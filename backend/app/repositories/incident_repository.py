from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.incident import Incident

class IncidentRepository:
    """Repository handling CRUD operations for incidents."""

    @staticmethod
    def create(db: Session, incident: Incident) -> Incident:
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident

    @staticmethod
    def get_by_id(db: Session, id: int) -> Optional[Incident]:
        return (
            db.query(Incident)
            .options(joinedload(Incident.spills))
            .filter(Incident.id == id)
            .first()
        )

    @staticmethod
    def get_by_incident_id(db: Session, incident_id: str) -> Optional[Incident]:
        return (
            db.query(Incident)
            .options(joinedload(Incident.spills))
            .filter(Incident.incident_id == incident_id)
            .first()
        )

    @staticmethod
    def list(db: Session, skip: int = 0, limit: int = 50) -> List[Incident]:
        return (
            db.query(Incident)
            .options(joinedload(Incident.spills))
            .order_by(Incident.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def update_status(db: Session, incident_id: str, new_status: str) -> Optional[Incident]:
        incident = IncidentRepository.get_by_incident_id(db, incident_id)
        if incident:
            incident.status = new_status
            db.commit()
            db.refresh(incident)
        return incident
