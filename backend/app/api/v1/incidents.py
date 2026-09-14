from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.incident_service import IncidentService
from app.schemas.incident import (
    IncidentCreate, IncidentResponse, IncidentDetailResponse, IncidentInvestigationResponse
)
from app.schemas.attribution import IncidentCandidatesResponse

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.post("", response_model=IncidentDetailResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db)
):
    """Creates a new maritime spill investigation incident and triggers satellite spill detection."""
    service = IncidentService(db)
    incident = service.create_incident_with_detection(
        title=incident_in.title,
        observation_time=incident_in.observation_time,
        incident_id=incident_in.incident_id
    )
    return incident

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Lists all active and historical incidents with pagination."""
    service = IncidentService(db)
    return service.list_incidents(skip=skip, limit=limit)

@router.post("/demo/seed", status_code=status.HTTP_201_CREATED)
def seed_demo_scenario(
    reset_if_exists: bool = Query(True, description="Force purge and fresh re-seed of demo data"),
    db: Session = Depends(get_db)
):
    """
    Seeds a turnkey Mumbai High offshore oil spill scenario for live hackathon evaluation.
    Pre-populates Sentinel-1 SAR spill detection, OpenDrift origin, AIS traffic,
    multi-factor suspect attribution ranking, top suspect dossier, and counterfactual validation.
    """
    from app.services.demo_seeder import DemoSeeder
    return DemoSeeder.seed_mumbai_high_demo(db, reset_if_exists=reset_if_exists)

@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves an incident by its unique identifier along with characterized satellite spills."""
    service = IncidentService(db)
    incident = service.get_incident(incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found."
        )
    return incident

@router.get("/{incident_id}/candidates", response_model=IncidentCandidatesResponse)
def get_incident_candidates(
    incident_id: str,
    force_recompute: bool = Query(False, description="Force re-running spatiotemporal filter"),
    spatial_buffer_km: float = Query(5.0, ge=0.0, le=50.0),
    temporal_buffer_hours: float = Query(2.0, ge=0.0, le=24.0),
    db: Session = Depends(get_db)
):
    """Retrieves candidate suspect vessels intersecting the incident origin within the release window."""
    from app.services.candidate_service import CandidateService
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
def get_incident_attribution_subresource(
    incident_id: str,
    force_recompute: bool = Query(False, description="Force recomputing attribution scores"),
    db: Session = Depends(get_db)
):
    """Retrieves ranked candidate suspects with multi-factor attribution scores and explanation evidence."""
    from app.services.candidate_service import CandidateService
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

@router.get("/{incident_id}/candidates/{mmsi}/dossier")
def get_candidate_dossier_subresource(
    incident_id: str,
    mmsi: int,
    db: Session = Depends(get_db)
):
    """Retrieves full investigator forensic dossier for a candidate vessel."""
    from app.services.candidate_service import CandidateService
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

@router.get("/{incident_id}/investigation", response_model=IncidentInvestigationResponse)
def get_incident_investigation(
    incident_id: str,
    force_recompute: bool = Query(False, description="Force recomputing hindcast and attribution"),
    db: Session = Depends(get_db)
):
    """
    Unified end-to-end investigation orchestration endpoint.
    Aggregates:
    - SAR spill detection geometry & metrics
    - Hydrodynamic OpenDrift hindcast & probable origin uncertainty cone
    - Reconstructed AIS vessel tracks and blackout gaps
    - Multi-factor suspect attribution ranking
    - Forensic dossier for the primary suspect vessel
    - Pipeline execution telemetry
    """
    service = IncidentService(db)
    try:
        return service.get_full_investigation(
            incident_id=incident_id,
            force_recompute=force_recompute
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )




