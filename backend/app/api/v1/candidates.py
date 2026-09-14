from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.candidate_service import CandidateService
from app.schemas.attribution import IncidentCandidatesResponse, VesselDossierResponse

router = APIRouter(prefix="/candidates", tags=["Candidate Filtering & Attribution"])

@router.get("/{incident_id}", response_model=IncidentCandidatesResponse)
def get_incident_candidates(
    incident_id: str,
    force_recompute: bool = Query(False, description="Force re-running spatiotemporal filter"),
    spatial_buffer_km: float = Query(5.0, ge=0.0, le=50.0, description="Spatial tolerance buffer around origin (km)"),
    temporal_buffer_hours: float = Query(2.0, ge=0.0, le=24.0, description="Temporal tolerance window (hours)"),
    db: Session = Depends(get_db)
):
    """Filters maritime traffic against the probable origin cone and estimated release window."""
    service = CandidateService(db)
    try:
        return service.filter_and_persist_candidates(
            incident_id=incident_id,
            force_recompute=force_recompute,
            spatial_buffer_km=spatial_buffer_km,
            temporal_buffer_hours=temporal_buffer_hours
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/{incident_id}/attribution", response_model=IncidentCandidatesResponse)
def get_incident_attribution(
    incident_id: str,
    force_recompute: bool = Query(False, description="Force recomputing attribution scores"),
    db: Session = Depends(get_db)
):
    """Retrieves ranked candidate vessels with multi-factor attribution scores and evidence cards."""
    service = CandidateService(db)
    try:
        return service.get_attribution_ranking(
            incident_id=incident_id,
            force_recompute=force_recompute
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/{incident_id}/dossier/{mmsi}", response_model=VesselDossierResponse)
def get_vessel_dossier(
    incident_id: str,
    mmsi: int,
    db: Session = Depends(get_db)
):
    """Retrieves comprehensive forensic evidentiary dossier, timeline, and cargo compatibility for a suspect vessel."""
    service = CandidateService(db)
    try:
        return service.get_vessel_dossier(
            incident_id=incident_id,
            mmsi=mmsi
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


