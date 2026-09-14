from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.incident_repository import IncidentRepository
from app.repositories.spill_repository import SpillRepository
from app.schemas.spill import SpillResponse

router = APIRouter(prefix="/spills", tags=["Spills"])

@router.get("/{incident_id}", response_model=List[SpillResponse])
def get_spills_for_incident(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves all characterized satellite oil spills detected for a given incident."""
    incident = IncidentRepository.get_by_incident_id(db, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found."
        )
    return SpillRepository.get_by_incident_id(db, incident.id)
