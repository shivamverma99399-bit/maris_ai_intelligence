from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.origin_service import OriginService
from app.schemas.drift import OriginEstimateResponse

router = APIRouter(prefix="/origin", tags=["Probable Origin"])

@router.get("/{incident_id}", response_model=OriginEstimateResponse)
def get_probable_origin(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves the reconstructed probable source region polygon and release time window for an incident."""
    service = OriginService(db)
    try:
        return service.get_or_create_origin_estimate(incident_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
