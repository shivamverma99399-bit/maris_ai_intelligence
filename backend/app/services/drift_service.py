from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from shapely.geometry import shape, Polygon
from app.models.incident import Incident
from app.models.spill import Spill
from app.models.drift import DriftSimulation
from app.repositories.incident_repository import IncidentRepository
from app.repositories.spill_repository import SpillRepository
from app.repositories.drift_repository import DriftRepository
from app.services.environment_service import EnvironmentService
from app.engines.drift_engine import DriftEngine, DriftSimulationResult
from app.core.logging import logger

class DriftService:
    """Service orchestrating Lagrangian oil drift simulations (forward forecast and backward hindcast)."""

    def __init__(self, db: Session):
        self.db = db
        self.incident_repo = IncidentRepository()
        self.spill_repo = SpillRepository()
        self.drift_repo = DriftRepository()
        self.env_service = EnvironmentService(db)

    def run_forward_forecast(
        self,
        incident_id: str,
        duration_hours: int = 24,
        num_particles: int = 150
    ) -> DriftSimulation:
        """Executes a forward slick dispersion simulation over the given forecast duration."""
        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        if not incident.spills:
            raise ValueError(f"Incident '{incident_id}' does not have any detected spill geometries.")

        primary_spill: Spill = incident.spills[0]
        spill_geom = shape(primary_spill.polygon_geojson)
        if not isinstance(spill_geom, Polygon):
            spill_geom = spill_geom.convex_hull

        # Fetch environmental forcing vectors for incident region
        env_summary = self.env_service.get_environment_for_incident(incident_id)

        # Convert mean current and wind speeds/directions back to (u, v)
        c_spd = env_summary.mean_current_speed
        c_dir = env_summary.mean_current_direction
        w_spd = env_summary.mean_wind_speed
        w_dir = env_summary.mean_wind_direction

        cu, cv = self.env_service.speed_direction_to_uv(c_spd, c_dir)
        wu, wv = self.env_service.speed_direction_to_uv(w_spd, w_dir)

        logger.info(
            f"Running forward drift simulation for '{incident_id}': "
            f"duration={duration_hours}h, particles={num_particles}, "
            f"current=({cu}, {cv}), wind=({wu}, {wv})"
        )

        obs_time = incident.observation_time or primary_spill.created_at
        sim_result: DriftSimulationResult = DriftEngine.run_forward_simulation(
            spill_polygon=spill_geom,
            start_time=obs_time,
            duration_hours=duration_hours,
            num_particles=num_particles,
            mean_current_u=cu,
            mean_current_v=cv,
            mean_wind_u=wu,
            mean_wind_v=wv,
            wind_drift_factor=0.03
        )

        # Package snapshot summaries into metadata
        snapshots_data = [s.model_dump(mode="json") for s in sim_result.snapshots]
        metadata = {
            **sim_result.uncertainty_metadata,
            "snapshots": snapshots_data
        }

        # Persist simulation in database
        drift_sim = DriftSimulation(
            incident_id=incident.id,
            simulation_type="FORWARD",
            status="COMPLETED",
            start_time=sim_result.start_time,
            end_time=sim_result.end_time,
            num_particles=num_particles,
            trajectories_geojson=sim_result.trajectories_geojson,
            uncertainty_metadata=metadata
        )

        return self.drift_repo.create(self.db, drift_sim)

    def run_backward_hindcast(
        self,
        incident_id: str,
        hindcast_hours: int = 24,
        num_particles: int = 150
    ) -> DriftSimulation:
        """Executes backward Lagrangian hindcast backtracking from observed slick into the past."""
        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        if not incident.spills:
            raise ValueError(f"Incident '{incident_id}' does not have any detected spill geometries.")

        primary_spill: Spill = incident.spills[0]
        spill_geom = shape(primary_spill.polygon_geojson)
        if not isinstance(spill_geom, Polygon):
            spill_geom = spill_geom.convex_hull

        # Fetch environmental forcing vectors for incident region
        env_summary = self.env_service.get_environment_for_incident(incident_id)

        c_spd = env_summary.mean_current_speed
        c_dir = env_summary.mean_current_direction
        w_spd = env_summary.mean_wind_speed
        w_dir = env_summary.mean_wind_direction

        cu, cv = self.env_service.speed_direction_to_uv(c_spd, c_dir)
        wu, wv = self.env_service.speed_direction_to_uv(w_spd, w_dir)

        logger.info(
            f"Running backward drift hindcast for '{incident_id}': "
            f"hindcast_hours={hindcast_hours}h, particles={num_particles}, "
            f"current=({cu}, {cv}), wind=({wu}, {wv})"
        )

        obs_time = incident.observation_time or primary_spill.created_at
        sim_result: DriftSimulationResult = DriftEngine.run_backward_hindcast(
            observed_polygon=spill_geom,
            observation_time=obs_time,
            hindcast_hours=hindcast_hours,
            num_particles=num_particles,
            mean_current_u=cu,
            mean_current_v=cv,
            mean_wind_u=wu,
            mean_wind_v=wv,
            wind_drift_factor=0.03
        )

        # Package snapshot summaries into metadata
        snapshots_data = [s.model_dump(mode="json") for s in sim_result.snapshots]
        metadata = {
            **sim_result.uncertainty_metadata,
            "snapshots": snapshots_data
        }

        # Persist simulation in database
        drift_sim = DriftSimulation(
            incident_id=incident.id,
            simulation_type="BACKWARD",
            status="COMPLETED",
            start_time=sim_result.start_time,
            end_time=sim_result.end_time,
            num_particles=num_particles,
            trajectories_geojson=sim_result.trajectories_geojson,
            uncertainty_metadata=metadata
        )

        return self.drift_repo.create(self.db, drift_sim)

    def list_simulations(self, incident_id: str) -> List[DriftSimulation]:
        """Lists all drift simulation runs for an incident."""
        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")
        return self.drift_repo.list_by_incident_id(self.db, incident.id)

    def get_simulation(self, simulation_id: int) -> Optional[DriftSimulation]:
        return self.drift_repo.get_by_id(self.db, simulation_id)

    def run_counterfactual_simulation(
        self,
        incident_id: str,
        mmsi: Optional[int] = None,
        num_particles: int = 200,
        variance_factor: float = 1.0
    ):
        """
        Executes a forward counterfactual simulation for a suspect vessel.
        Advects hypothetical discharged oil particles from the vessel's release coordinates
        forward to the satellite observation time, testing physical consistency against the observed slick.
        """
        import datetime
        from shapely.geometry import shape, Polygon
        from app.schemas.counterfactual import CounterfactualResult
        from app.engines.counterfactual_engine import CounterfactualEngine
        from app.repositories.ais_repository import AisRepository
        from app.repositories.origin_repository import OriginRepository
        from app.services.candidate_service import CandidateService
        from app.services.ais_service import AisService

        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        if not incident.spills:
            raise ValueError(f"Incident '{incident_id}' does not have any detected spill geometries.")

        primary_spill: Spill = incident.spills[0]
        spill_geom = shape(primary_spill.polygon_geojson)
        if not isinstance(spill_geom, Polygon):
            spill_geom = spill_geom.convex_hull

        # 1. Resolve suspect vessel MMSI
        ais_repo = AisRepository()
        candidate_service = CandidateService(self.db)
        target_mmsi = mmsi

        if not target_mmsi:
            candidates_resp = candidate_service.filter_and_persist_candidates(incident_id)
            if candidates_resp.candidates:
                target_mmsi = candidates_resp.candidates[0].mmsi
            else:
                # Fallback: get first available vessel
                vessels = ais_repo.list_vessels(self.db, limit=1)
                if vessels:
                    target_mmsi = vessels[0].mmsi
                else:
                    target_mmsi = 419001234  # Default Pacific Chemist

        vessel = ais_repo.get_vessel_by_mmsi(self.db, target_mmsi)
        vessel_meta = {
            "mmsi": target_mmsi,
            "vessel_name": vessel.vessel_name if vessel else f"Vessel-{target_mmsi}",
            "vessel_type": vessel.vessel_type if vessel else "Crude Oil Tanker",
            "flag": vessel.flag if vessel else "Unknown",
            "is_synthetic": vessel.is_synthetic if vessel else True
        }

        # 2. Reconstruct trajectory and identify release point & timestamp
        ais_service = AisService(self.db)
        trajectories = ais_service.get_incident_trajectories(incident_id)
        target_traj = next((t for t in trajectories if t.mmsi == target_mmsi), None)

        obs_time = incident.observation_time or datetime.datetime.now(datetime.timezone.utc)
        obs_centroid = (primary_spill.centroid_lat, primary_spill.centroid_lon)

        origin_repo = OriginRepository()
        origin_est = origin_repo.get_by_incident_id(self.db, incident.id)
        target_center = (
            (origin_est.probable_origin_lat, origin_est.probable_origin_lon)
            if origin_est
            else obs_centroid
        )

        if target_traj and target_traj.points:
            # Find point closest to probable origin or spill centroid
            best_point = min(
                target_traj.points,
                key=lambda p: (p.latitude - target_center[0])**2 + (p.longitude - target_center[1])**2
            )
            rel_lat = best_point.latitude
            rel_lon = best_point.longitude
            rel_time = best_point.timestamp
        else:
            # Fallback based on typical release window ~4 hours before observation
            rel_time = obs_time - datetime.timedelta(hours=4, minutes=15)
            rel_lat = obs_centroid[0] - 0.07
            rel_lon = obs_centroid[1] - 0.13

        # 3. Environmental conditions
        env_summary = self.env_service.get_environment_for_incident(incident_id)
        cu, cv = self.env_service.speed_direction_to_uv(
            env_summary.mean_current_speed, env_summary.mean_current_direction
        )
        wu, wv = self.env_service.speed_direction_to_uv(
            env_summary.mean_wind_speed, env_summary.mean_wind_direction
        )

        # 4. Execute counterfactual simulation
        result: CounterfactualResult = CounterfactualEngine.run_counterfactual_simulation(
            incident_id=incident_id,
            vessel_metadata=vessel_meta,
            release_point=(rel_lat, rel_lon),
            release_time=rel_time,
            observation_time=obs_time,
            observed_spill_polygon=spill_geom,
            observed_centroid=obs_centroid,
            observed_area_km2=primary_spill.area_km2,
            mean_current_u=cu,
            mean_current_v=cv,
            mean_wind_u=wu,
            mean_wind_v=wv,
            num_particles=num_particles,
            variance_factor=variance_factor
        )

        # 5. Persist simulation record in database
        drift_sim = DriftSimulation(
            incident_id=incident.id,
            simulation_type="COUNTERFACTUAL",
            status="COMPLETED",
            start_time=rel_time,
            end_time=obs_time,
            num_particles=num_particles,
            trajectories_geojson=result.particle_tracks_geojson or {},
            uncertainty_metadata={
                "mmsi": target_mmsi,
                "vessel_name": vessel_meta["vessel_name"],
                "consistency_score": result.physical_consistency_score,
                "consistency_verdict": result.consistency_verdict,
                "iou_overlap": result.iou_overlap,
                "centroid_distance_km": result.centroid_distance_km,
                "hausdorff_distance_km": result.hausdorff_distance_km,
                "simulated_area_km2": result.simulated_area_km2,
                "simulated_centroid": [result.simulated_centroid_lat, result.simulated_centroid_lon],
                "scientific_summary": result.scientific_summary
            }
        )
        self.drift_repo.create(self.db, drift_sim)

        return result
