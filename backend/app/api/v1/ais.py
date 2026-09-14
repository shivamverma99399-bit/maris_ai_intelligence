from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.services.ais_service import AisService
from app.schemas.ais import (
    AisIngestRequest, AisIngestResponse, AisIncidentTrafficResponse, AisPositionResponse,
    IncidentTrajectoriesResponse, VesselTrajectoryResponse
)

router = APIRouter(prefix="/ais", tags=["AIS Traffic & Ingestion"])

@router.post("/ingest", response_model=AisIngestResponse, status_code=status.HTTP_200_OK)
def ingest_ais_data(
    payload: AisIngestRequest,
    db: Session = Depends(get_db)
):
    """Ingests, sanitizes, and persists AIS messages from JSON records or CSV text."""
    service = AisService(db)
    try:
        if payload.csv_content:
            res = service.ingest_csv(payload.csv_content, default_synthetic=payload.is_synthetic)
        elif payload.records:
            res = service.ingest_raw_records(payload.records, default_synthetic=payload.is_synthetic)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'records' list or 'csv_content' string must be provided."
            )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to ingest AIS data: {str(e)}"
        )

@router.post("/upload", response_model=AisIngestResponse, status_code=status.HTTP_200_OK)
async def upload_ais_csv_file(
    file: UploadFile = File(...),
    is_synthetic: bool = Form(False),
    db: Session = Depends(get_db)
):
    """Parses and ingests an uploaded CSV file containing AIS positional messages."""
    if not file.filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a .csv or .txt file"
        )
    content = await file.read()
    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    service = AisService(db)
    res = service.ingest_csv(csv_text, default_synthetic=is_synthetic)
    return res

@router.get("/{incident_id}", response_model=AisIncidentTrafficResponse)
def get_incident_ais_traffic(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves AIS traffic surrounding the incident's probable origin and release window."""
    service = AisService(db)
    try:
        summary = service.get_incident_traffic_summary(incident_id)
        return summary
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/{incident_id}/positions", response_model=List[AisPositionResponse])
def get_incident_ais_positions(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """Returns raw positional pings for an incident."""
    service = AisService(db)
    try:
        positions = service.get_or_generate_ais_for_incident(incident_id)
        return positions
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/{incident_id}/trajectories", response_model=IncidentTrajectoriesResponse)
def get_incident_trajectories(
    incident_id: str,
    step_minutes: int = 10,
    gap_threshold_hours: float = 1.0,
    db: Session = Depends(get_db)
):
    """Reconstructs continuous kinematic trajectories with gap analysis for all vessels intersecting the incident area."""
    service = AisService(db)
    try:
        trajectories = service.get_incident_trajectories(
            incident_id=incident_id,
            step_minutes=step_minutes,
            gap_threshold_hours=gap_threshold_hours
        )
        return IncidentTrajectoriesResponse(
            incident_id=incident_id,
            total_vessels=len(trajectories),
            vessels=trajectories
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

