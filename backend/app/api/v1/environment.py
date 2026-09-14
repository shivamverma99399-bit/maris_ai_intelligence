from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.environment_service import EnvironmentService
from app.schemas.environment import EnvironmentSummary

router = APIRouter(prefix="/environment", tags=["Environmental Data"])

@router.get("/{incident_id}", response_model=EnvironmentSummary)
def get_environment_for_incident(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves ocean currents, 10m surface winds, and net drift vectors for an incident region."""
    service = EnvironmentService(db)
    try:
        return service.get_environment_for_incident(incident_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
