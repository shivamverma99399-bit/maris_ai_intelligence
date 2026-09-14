from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.candidate import CandidateVessel

class CandidateRepository:
    """Repository handling database operations for filtered and scored candidate suspect vessels."""

    @staticmethod
    def get_by_incident_id(db: Session, incident_id: int) -> List[CandidateVessel]:
        return (
            db.query(CandidateVessel)
            .filter(CandidateVessel.incident_id == incident_id)
            .order_by(CandidateVessel.rank.asc(), CandidateVessel.final_score.desc())
            .all()
        )

    @staticmethod
    def delete_by_incident_id(db: Session, incident_id: int) -> int:
        deleted = (
            db.query(CandidateVessel)
            .filter(CandidateVessel.incident_id == incident_id)
            .delete()
        )
        db.commit()
        return deleted

    @staticmethod
    def create_batch(db: Session, candidates: List[CandidateVessel]) -> List[CandidateVessel]:
        db.add_all(candidates)
        db.commit()
        for c in candidates:
            db.refresh(c)
        return candidates
