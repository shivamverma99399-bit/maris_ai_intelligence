from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.drift import DriftSimulation

class DriftRepository:
    """Repository handling database operations for forward/backward drift simulations."""

    @staticmethod
    def create(db: Session, simulation: DriftSimulation) -> DriftSimulation:
        db.add(simulation)
        db.commit()
        db.refresh(simulation)
        return simulation

    @staticmethod
    def get_by_id(db: Session, id: int) -> Optional[DriftSimulation]:
        return db.query(DriftSimulation).filter(DriftSimulation.id == id).first()

    @staticmethod
    def list_by_incident_id(db: Session, incident_id: int) -> List[DriftSimulation]:
        return (
            db.query(DriftSimulation)
            .filter(DriftSimulation.incident_id == incident_id)
            .order_by(DriftSimulation.created_at.desc())
            .all()
        )

    @staticmethod
    def get_latest_by_type(db: Session, incident_id: int, sim_type: str) -> Optional[DriftSimulation]:
        return (
            db.query(DriftSimulation)
            .filter(
                DriftSimulation.incident_id == incident_id,
                DriftSimulation.simulation_type == sim_type
            )
            .order_by(DriftSimulation.created_at.desc())
            .first()
        )
