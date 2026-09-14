from typing import Optional
from sqlalchemy.orm import Session
from shapely.geometry import shape, Polygon
from app.models.incident import Incident
from app.models.spill import Spill
from app.models.drift import DriftSimulation
from app.models.origin import OriginEstimate
from app.repositories.incident_repository import IncidentRepository
from app.repositories.drift_repository import DriftRepository
from app.repositories.origin_repository import OriginRepository
from app.services.drift_service import DriftService
from app.services.environment_service import EnvironmentService
from app.engines.drift_engine import DriftEngine, DriftSimulationResult, DriftForecastSnapshot
from app.engines.origin_engine import OriginEngine, OriginResult
from app.core.logging import logger

class OriginService:
    """Service estimating the probable spill origin distribution and temporal release window."""

    def __init__(self, db: Session):
        self.db = db
        self.incident_repo = IncidentRepository()
        self.drift_repo = DriftRepository()
        self.origin_repo = OriginRepository()
        self.drift_service = DriftService(db)
        self.env_service = EnvironmentService(db)

    def get_or_create_origin_estimate(self, incident_id: str) -> OriginEstimate:
        """Retrieves an existing origin estimate or synthesizes one via backward hindcast."""
        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        # Check existing origin estimate
        existing = self.origin_repo.get_by_incident_id(self.db, incident.id)
        if existing:
            return existing

        # Ensure backward simulation exists, or run it automatically
        backward_sim = self.drift_repo.get_latest_by_type(self.db, incident.id, "BACKWARD")
        if not backward_sim:
            logger.info(f"Running backward hindcast for origin estimation on '{incident_id}'")
            backward_sim = self.drift_service.run_backward_hindcast(incident_id, hindcast_hours=24)

        primary_spill: Spill = incident.spills[0]
        elongation = primary_spill.elongation
        env_summary = self.env_service.get_environment_for_incident(incident_id)

        # Reconstruct DriftSimulationResult object from stored simulation metadata
        snapshots_raw = backward_sim.uncertainty_metadata.get("snapshots", [])
        snapshots = [
            DriftForecastSnapshot(
                timestep_hours=s["timestep_hours"],
                timestamp=s["timestamp"],
                particle_count=s["particle_count"],
                centroid_lat=s["centroid_lat"],
                centroid_lon=s["centroid_lon"],
                bounding_polygon_geojson=s.get("bounding_polygon_geojson")
            )
            for s in snapshots_raw
        ]

        sim_result = DriftSimulationResult(
            simulation_type="BACKWARD",
            start_time=backward_sim.start_time,
            end_time=backward_sim.end_time,
            num_particles=backward_sim.num_particles,
            duration_hours=float((backward_sim.end_time - backward_sim.start_time).total_seconds() / 3600.0),
            trajectories_geojson=backward_sim.trajectories_geojson,
            snapshots=snapshots,
            uncertainty_metadata=backward_sim.uncertainty_metadata
        )

        origin_calc: OriginResult = OriginEngine.estimate_origin_from_hindcast(
            hindcast_result=sim_result,
            spill_elongation=elongation,
            net_drift_speed_knots=env_summary.net_drift_speed_knots
        )

        # Create OriginEstimate database record
        origin_estimate = OriginEstimate(
            incident_id=incident.id,
            probable_origin_lat=origin_calc.probable_origin_lat,
            probable_origin_lon=origin_calc.probable_origin_lon,
            time_window_start=origin_calc.time_window_start,
            time_window_end=origin_calc.time_window_end,
            uncertainty_radius_km=origin_calc.uncertainty_radius_km,
            confidence=origin_calc.confidence,
            origin_geojson=origin_calc.origin_geojson
        )

        logger.info(
            f"Synthesized origin estimate for '{incident_id}': "
            f"origin=({origin_estimate.probable_origin_lat}, {origin_estimate.probable_origin_lon}), "
            f"window=[{origin_estimate.time_window_start} -> {origin_estimate.time_window_end}], "
            f"radius={origin_estimate.uncertainty_radius_km} km"
        )

        return self.origin_repo.create(self.db, origin_estimate)
