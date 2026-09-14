from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.drift_service import DriftService
from app.schemas.drift import DriftSimulationResponse

router = APIRouter(prefix="/drift", tags=["Drift Simulations"])

@router.post("/{incident_id}/forward", response_model=DriftSimulationResponse, status_code=status.HTTP_201_CREATED)
def run_forward_drift_forecast(
    incident_id: str,
    duration_hours: int = Query(24, ge=1, le=120, description="Forecast horizon in hours (1-120)"),
    num_particles: int = Query(150, ge=20, le=1000, description="Number of Lagrangian particles to advect"),
    db: Session = Depends(get_db)
):
    """Executes forward Lagrangian oil drift simulation predicting future slick dispersion and trajectory."""
    service = DriftService(db)
    try:
        return service.run_forward_forecast(
            incident_id=incident_id,
            duration_hours=duration_hours,
            num_particles=num_particles
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/{incident_id}/backward", response_model=DriftSimulationResponse, status_code=status.HTTP_201_CREATED)
def run_backward_drift_hindcast(
    incident_id: str,
    hindcast_hours: int = Query(24, ge=1, le=120, description="Hindcast duration into the past in hours (1-120)"),
    num_particles: int = Query(150, ge=20, le=1000, description="Number of Lagrangian particles to backtrack"),
    db: Session = Depends(get_db)
):
    """Executes backward Lagrangian oil drift hindcast backtracking from observed slick to probable source regions."""
    service = DriftService(db)
    try:
        return service.run_backward_hindcast(
            incident_id=incident_id,
            hindcast_hours=hindcast_hours,
            num_particles=num_particles
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/{incident_id}", response_model=List[DriftSimulationResponse])
def list_drift_simulations(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves all drift simulation runs associated with an incident."""
    service = DriftService(db)
    try:
        return service.list_simulations(incident_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
