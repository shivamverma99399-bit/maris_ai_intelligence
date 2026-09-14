from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.spill import Spill

class SpillRepository:
    """Repository handling CRUD operations for characterized oil spills."""

    @staticmethod
    def create(db: Session, spill: Spill) -> Spill:
        db.add(spill)
        db.commit()
        db.refresh(spill)
        return spill

    @staticmethod
    def get_by_id(db: Session, id: int) -> Optional[Spill]:
        return db.query(Spill).filter(Spill.id == id).first()

    @staticmethod
    def get_by_incident_id(db: Session, incident_id: int) -> List[Spill]:
        return db.query(Spill).filter(Spill.incident_id == incident_id).all()
