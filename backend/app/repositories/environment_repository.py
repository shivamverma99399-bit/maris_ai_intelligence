import datetime
from typing import List
from sqlalchemy.orm import Session
from app.models.environment import EnvironmentData

class EnvironmentRepository:
    """Repository handling database operations for oceanographic and meteorological vector grids."""

    @staticmethod
    def create_batch(db: Session, records: List[EnvironmentData]) -> List[EnvironmentData]:
        db.add_all(records)
        db.commit()
        return records

    @staticmethod
    def query_spatiotemporal(
        db: Session,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        start_time: datetime.datetime,
        end_time: datetime.datetime
    ) -> List[EnvironmentData]:
        return (
            db.query(EnvironmentData)
            .filter(
                EnvironmentData.latitude >= min_lat,
                EnvironmentData.latitude <= max_lat,
                EnvironmentData.longitude >= min_lon,
                EnvironmentData.longitude <= max_lon,
                EnvironmentData.timestamp >= start_time,
                EnvironmentData.timestamp <= end_time
            )
            .order_by(EnvironmentData.timestamp.asc())
            .all()
        )
