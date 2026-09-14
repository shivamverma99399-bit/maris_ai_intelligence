import datetime
import time
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.spill import Spill
from app.models.origin import OriginEstimate
from app.models.drift import DriftSimulation
from app.models.candidate import CandidateVessel
from app.models.vessel import Vessel
from app.models.ais_position import AisPosition

from app.repositories.incident_repository import IncidentRepository
from app.repositories.spill_repository import SpillRepository
from app.repositories.origin_repository import OriginRepository
from app.repositories.drift_repository import DriftRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.ais_repository import AisRepository

from app.services.environment_service import EnvironmentService
from app.services.origin_service import OriginService
from app.services.ais_service import AisService
from app.services.candidate_service import CandidateService
from app.services.drift_service import DriftService

from app.engines.ais_generator import IndianEezAisGenerator
from app.core.logging import logger

DEMO_INCIDENT_ID = "INC-DEMO-2026"

class DemoSeeder:
    """
    Automated turn-key demonstrator seeder for Smart India Hackathon / NTRO evaluation.
    Constructs a complete, physically consistent Arabian Sea (Mumbai High) oil spill scenario:
    1. SAR Sentinel-1 satellite detection polygon
    2. Environmental current & wind telemetry
    3. OpenDrift backward hindcast & probable origin uncertainty cone
    4. Reconstructed AIS vessel traffic with transponder blackout anomaly
    5. Multi-factor attribution scoring & ranking (Pacific Chemist top suspect)
    6. Comprehensive forensic evidence dossier
    7. Forward counterfactual validation proving physical consistency
    """

    @classmethod
    def seed_mumbai_high_demo(
        cls,
        db: Session,
        reset_if_exists: bool = True
    ) -> Dict[str, Any]:
        t0 = time.perf_counter()
        logger.info(f"Initiating turn-key demo scenario seeding for '{DEMO_INCIDENT_ID}'")

        incident_repo = IncidentRepository()
        spill_repo = SpillRepository()
        origin_repo = OriginRepository()
        drift_repo = DriftRepository()
        candidate_repo = CandidateRepository()
        ais_repo = AisRepository()

        # 0. Check existing incident
        existing_incident = incident_repo.get_by_incident_id(db, DEMO_INCIDENT_ID)
        if existing_incident:
            if not reset_if_exists:
                logger.info(f"Demo incident '{DEMO_INCIDENT_ID}' already present; skipping reset.")
                return {"status": "exists", "incident_id": DEMO_INCIDENT_ID}

            logger.info(f"Purging existing demo records for '{DEMO_INCIDENT_ID}' before fresh seed")
            # Delete child entities
            candidate_repo.delete_by_incident_id(db, existing_incident.id)
            for sim in drift_repo.list_by_incident_id(db, existing_incident.id):
                db.delete(sim)
            existing_origin = origin_repo.get_by_incident_id(db, existing_incident.id)
            if existing_origin:
                db.delete(existing_origin)
            for sp in existing_incident.spills:
                db.delete(sp)
            incident_repo.delete(db, existing_incident.id)
            db.commit()

        # 1. Create primary Incident
        obs_time = datetime.datetime(2026, 9, 12, 8, 30, 0, tzinfo=datetime.timezone.utc)
        incident = Incident(
            incident_id=DEMO_INCIDENT_ID,
            title="Mumbai High Offshore Sector 4 Oil Slick Detection",
            status="ANALYZED",
            observation_time=obs_time
        )
        incident = incident_repo.create(db, incident)

        # 2. Create SAR Spill Detection Polygon (Mumbai High offshore: 19.35°N, 71.45°E)
        spill_polygon_geojson = {
            "type": "Polygon",
            "coordinates": [
                [
                    [71.410, 19.330],
                    [71.435, 19.362],
                    [71.470, 19.375],
                    [71.492, 19.355],
                    [71.475, 19.335],
                    [71.440, 19.320],
                    [71.410, 19.330]
                ]
            ]
        }

        spill = Spill(
            incident_id=incident.id,
            confidence=0.94,
            area_km2=18.45,
            perimeter_km=26.8,
            elongation=2.85,
            model_version="sar-unet-sentinel1-v2.1",
            centroid_lat=19.350,
            centroid_lon=71.450,
            polygon_geojson=spill_polygon_geojson
        )
        spill_repo.create(db, spill)

        # 3. Populate Environmental Forcing Cache
        env_service = EnvironmentService(db)
        env_service.get_environment_for_incident(DEMO_INCIDENT_ID)

        # 4. Generate & Ingest AIS Maritime Traffic
        ais_service = AisService(db)
        pings = IndianEezAisGenerator.generate_demo_traffic(
            origin_lat=19.350,
            origin_lon=71.450,
            observation_time=obs_time
        )
        ingest_stats = ais_service.ingest_raw_records(pings, default_synthetic=True)

        # 5. Compute Probable Origin Estimate (Backward Drift)
        origin_service = OriginService(db)
        origin_estimate = origin_service.get_or_create_origin_estimate(DEMO_INCIDENT_ID)

        # 6. Reconstruct Kinematic Trajectories
        trajectories = ais_service.get_incident_trajectories(DEMO_INCIDENT_ID)

        # 7. Compute Multi-Factor Attribution Ranking
        candidate_service = CandidateService(db)
        candidates_resp = candidate_service.filter_and_persist_candidates(
            incident_id=DEMO_INCIDENT_ID,
            force_recompute=True
        )

        # 8. Generate Forensic Dossier for Top Suspect
        top_dossier = None
        if candidates_resp.candidates:
            top_mmsi = candidates_resp.candidates[0].mmsi
            top_dossier = candidate_service.get_vessel_dossier(DEMO_INCIDENT_ID, top_mmsi)

        # 9. Run Forward Counterfactual Simulation
        drift_service = DriftService(db)
        cf_result = drift_service.run_counterfactual_simulation(
            incident_id=DEMO_INCIDENT_ID,
            mmsi=candidates_resp.candidates[0].mmsi if candidates_resp.candidates else 419001234,
            num_particles=150
        )

        elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        logger.info(f"Demo scenario '{DEMO_INCIDENT_ID}' successfully seeded in {elapsed_ms}ms")

        return {
            "status": "success",
            "incident_id": DEMO_INCIDENT_ID,
            "title": incident.title,
            "observation_time": incident.observation_time.isoformat(),
            "spill_area_km2": spill.area_km2,
            "origin_lat": origin_estimate.probable_origin_lat,
            "origin_lon": origin_estimate.probable_origin_lon,
            "uncertainty_radius_km": origin_estimate.uncertainty_radius_km,
            "ingested_positions": ingest_stats["ingested_positions"],
            "total_candidates": len(candidates_resp.candidates),
            "top_suspect": candidates_resp.candidates[0].vessel_name if candidates_resp.candidates else "None",
            "top_score": candidates_resp.candidates[0].final_score if candidates_resp.candidates else 0.0,
            "counterfactual_verdict": cf_result.consistency_verdict,
            "counterfactual_consistency_score": cf_result.physical_consistency_score,
            "seed_duration_ms": elapsed_ms
        }
