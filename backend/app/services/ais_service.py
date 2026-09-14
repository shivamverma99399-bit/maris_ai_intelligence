import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.vessel import Vessel
from app.models.ais_position import AisPosition
from app.models.origin import OriginEstimate
from app.repositories.incident_repository import IncidentRepository
from app.repositories.ais_repository import AisRepository
from app.services.origin_service import OriginService
from app.engines.ais_cleaner import AisCleaner
from app.engines.ais_generator import IndianEezAisGenerator
from app.core.logging import logger

class AisService:
    """Service handling AIS message cleaning, vessel profile tracking, and traffic ingestion."""

    def __init__(self, db: Session):
        self.db = db
        self.incident_repo = IncidentRepository()
        self.ais_repo = AisRepository()
        self.origin_service = OriginService(db)

    def ingest_raw_records(
        self,
        raw_records: List[Dict[str, Any]],
        default_synthetic: bool = False
    ) -> Dict[str, Any]:
        """Cleans, validates, and persists a batch of raw AIS messages."""
        cleaned_records, dropped_count = AisCleaner.clean_batch(
            raw_records,
            default_synthetic=default_synthetic
        )

        if not cleaned_records:
            return {
                "status": "success",
                "message": f"Processed {len(raw_records)} messages: 0 valid, {dropped_count} dropped.",
                "ingested_positions": 0,
                "dropped_positions": dropped_count,
                "distinct_vessels": 0
            }

        # 1. Upsert vessels
        vessel_map: Dict[int, Vessel] = {}
        for r in cleaned_records:
            mmsi = r["mmsi"]
            if mmsi not in vessel_map:
                vessel = self.ais_repo.upsert_vessel(
                    db=self.db,
                    mmsi=mmsi,
                    vessel_name=r["vessel_name"],
                    vessel_type=r["vessel_type"],
                    flag=r["flag"],
                    imo=r.get("imo"),
                    is_synthetic=r["is_synthetic"]
                )
                vessel_map[mmsi] = vessel

        # 2. Prepare position records
        position_models: List[AisPosition] = []
        for r in cleaned_records:
            vessel = vessel_map[r["mmsi"]]
            pos = AisPosition(
                mmsi=r["mmsi"],
                vessel_id=vessel.id,
                timestamp=r["timestamp"],
                latitude=r["latitude"],
                longitude=r["longitude"],
                sog=r["sog"],
                cog=r["cog"],
                heading=r["heading"],
                nav_status=r["nav_status"],
                is_synthetic=r["is_synthetic"]
            )
            position_models.append(pos)

        self.ais_repo.create_positions_batch(self.db, position_models)

        logger.info(
            f"Ingested {len(position_models)} AIS positions for {len(vessel_map)} vessels "
            f"(dropped {dropped_count} invalid/duplicate messages)"
        )

        return {
            "status": "success",
            "message": f"Successfully ingested {len(position_models)} positions across {len(vessel_map)} vessels ({dropped_count} invalid/duplicate dropped).",
            "ingested_positions": len(position_models),
            "dropped_positions": dropped_count,
            "distinct_vessels": len(vessel_map)
        }

    def ingest_csv(self, csv_text: str, default_synthetic: bool = False) -> Dict[str, Any]:
        """Parses and ingests AIS messages from CSV text."""
        raw_records = AisCleaner.parse_csv_content(csv_text, default_synthetic=default_synthetic)
        return self.ingest_raw_records(raw_records, default_synthetic=default_synthetic)

    def get_or_generate_ais_for_incident(self, incident_id: str) -> List[AisPosition]:
        """Retrieves AIS traffic for an incident area, generating curated Indian EEZ traffic if needed."""
        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        # Ensure origin estimate exists
        origin: OriginEstimate = self.origin_service.get_or_create_origin_estimate(incident_id)

        # Spatiotemporal query bounding box
        min_lat = origin.probable_origin_lat - 0.80
        max_lat = origin.probable_origin_lat + 0.80
        min_lon = origin.probable_origin_lon - 0.80
        max_lon = origin.probable_origin_lon + 0.80

        # Time window: from 8 hours prior to release window start up to observation time
        start_time = origin.time_window_start - datetime.timedelta(hours=8)
        end_time = incident.observation_time

        positions = self.ais_repo.get_positions_in_window(
            self.db,
            min_lat=min_lat,
            max_lat=max_lat,
            min_lon=min_lon,
            max_lon=max_lon,
            start_time=start_time,
            end_time=end_time
        )

        if not positions:
            logger.info(f"Synthesizing curated Indian EEZ AIS traffic for incident '{incident_id}'")
            traffic_records = IndianEezAisGenerator.generate_demo_traffic(
                origin_lat=origin.probable_origin_lat,
                origin_lon=origin.probable_origin_lon,
                observation_time=incident.observation_time
            )
            self.ingest_raw_records(traffic_records, default_synthetic=True)

            positions = self.ais_repo.get_positions_in_window(
                self.db,
                min_lat=min_lat,
                max_lat=max_lat,
                min_lon=min_lon,
                max_lon=max_lon,
                start_time=start_time,
                end_time=end_time
            )

        return positions

    def get_incident_traffic_summary(self, incident_id: str) -> Dict[str, Any]:
        """Returns structured traffic summary with origin coordinates and release window."""
        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        origin: OriginEstimate = self.origin_service.get_or_create_origin_estimate(incident_id)
        positions = self.get_or_generate_ais_for_incident(incident_id)

        distinct_mmsi = {p.mmsi for p in positions}

        return {
            "incident_id": incident_id,
            "origin_lat": origin.probable_origin_lat,
            "origin_lon": origin.probable_origin_lon,
            "time_window_start": origin.time_window_start,
            "time_window_end": origin.time_window_end,
            "total_positions": len(positions),
            "total_vessels": len(distinct_mmsi),
            "positions": positions
        }

    def get_incident_trajectories(
        self,
        incident_id: str,
        step_minutes: int = 10,
        gap_threshold_hours: float = 1.0
    ) -> List[Any]:
        """Reconstructs continuous kinematic trajectories with gap analysis for all vessels near incident."""
        from app.engines.trajectory_engine import TrajectoryEngine
        positions = self.get_or_generate_ais_for_incident(incident_id)
        return TrajectoryEngine.reconstruct_trajectories(
            positions=positions,
            step_minutes=step_minutes,
            gap_threshold_hours=gap_threshold_hours
        )

