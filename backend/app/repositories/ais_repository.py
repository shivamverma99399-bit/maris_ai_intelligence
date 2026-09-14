import datetime
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from app.models.vessel import Vessel
from app.models.ais_position import AisPosition

class AisRepository:
    """Repository handling database operations for vessel profiles and spatiotemporal AIS position pings."""

    @staticmethod
    def get_vessel_by_mmsi(db: Session, mmsi: int) -> Optional[Vessel]:
        return db.query(Vessel).filter(Vessel.mmsi == mmsi).first()

    @staticmethod
    def upsert_vessel(
        db: Session,
        mmsi: int,
        vessel_name: str,
        vessel_type: str,
        flag: str,
        imo: Optional[str] = None,
        is_synthetic: bool = False
    ) -> Vessel:
        vessel = db.query(Vessel).filter(Vessel.mmsi == mmsi).first()
        if not vessel:
            vessel = Vessel(
                mmsi=mmsi,
                imo=imo,
                vessel_name=vessel_name,
                vessel_type=vessel_type,
                flag=flag,
                is_synthetic=is_synthetic
            )
            db.add(vessel)
            db.commit()
            db.refresh(vessel)
        else:
            # Update attributes if needed
            vessel.vessel_name = vessel_name
            vessel.vessel_type = vessel_type
            vessel.flag = flag
            if imo:
                vessel.imo = imo
            vessel.is_synthetic = is_synthetic
            db.commit()
            db.refresh(vessel)
        return vessel

    @staticmethod
    def create_positions_batch(db: Session, positions: List[AisPosition]) -> List[AisPosition]:
        db.add_all(positions)
        db.commit()
        return positions

    @staticmethod
    def get_positions_in_window(
        db: Session,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        start_time: datetime.datetime,
        end_time: datetime.datetime
    ) -> List[AisPosition]:
        return (
            db.query(AisPosition)
            .filter(
                AisPosition.latitude >= min_lat,
                AisPosition.latitude <= max_lat,
                AisPosition.longitude >= min_lon,
                AisPosition.longitude <= max_lon,
                AisPosition.timestamp >= start_time,
                AisPosition.timestamp <= end_time
            )
            .order_by(AisPosition.mmsi.asc(), AisPosition.timestamp.asc())
            .all()
        )
