from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.drift_service import DriftService
from app.schemas.counterfactual import CounterfactualRequest, CounterfactualResult

router = APIRouter(prefix="/counterfactual", tags=["Counterfactual Simulation"])

@router.post("/{incident_id}", response_model=CounterfactualResult)
def run_counterfactual_endpoint(
    incident_id: str,
    request: Optional[CounterfactualRequest] = None,
    mmsi: Optional[int] = Query(None, description="Suspect vessel MMSI to test. Defaults to top candidate if omitted."),
    num_particles: int = Query(200, ge=50, le=1000, description="Particle count"),
    variance_factor: float = Query(1.0, ge=0.1, le=5.0, description="Turbulent diffusion multiplier"),
    db: Session = Depends(get_db)
):
    """
    Executes a forward counterfactual simulation for a suspect vessel.
    Releases hypothetical oil particles from the vessel's coordinates at release time T_release
    and advects them to observation time T_obs using active environmental forcing.
    Computes spatial overlap (IoU, centroid distance) against the satellite-observed slick.
    """
    service = DriftService(db)
    target_mmsi = request.mmsi if request and request.mmsi else mmsi
    target_particles = request.num_particles if request else num_particles
    target_variance = request.variance_factor if request else variance_factor

    try:
        return service.run_counterfactual_simulation(
            incident_id=incident_id,
            mmsi=target_mmsi,
            num_particles=target_particles,
            variance_factor=target_variance
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/{incident_id}", response_model=CounterfactualResult)
def get_counterfactual_endpoint(
    incident_id: str,
    mmsi: Optional[int] = Query(None, description="Suspect vessel MMSI"),
    db: Session = Depends(get_db)
):
    """
    Retrieves or generates counterfactual physical consistency results for a suspect vessel.
    """
    service = DriftService(db)
    try:
        return service.run_counterfactual_simulation(
            incident_id=incident_id,
            mmsi=mmsi
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
