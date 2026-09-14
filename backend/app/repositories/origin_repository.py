from typing import Optional
from sqlalchemy.orm import Session
from app.models.origin import OriginEstimate

class OriginRepository:
    """Repository handling database operations for probable origin distributions."""

    @staticmethod
    def create(db: Session, origin: OriginEstimate) -> OriginEstimate:
        db.add(origin)
        db.commit()
        db.refresh(origin)
        return origin

    @staticmethod
    def get_by_incident_id(db: Session, incident_id: int) -> Optional[OriginEstimate]:
        return (
            db.query(OriginEstimate)
            .filter(OriginEstimate.incident_id == incident_id)
            .order_by(OriginEstimate.created_at.desc())
            .first()
        )
