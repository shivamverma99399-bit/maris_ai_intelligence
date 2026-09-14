import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class DriftSimulationBase(BaseModel):
    simulation_type: str  # BACKWARD, FORWARD, COUNTERFACTUAL
    start_time: datetime.datetime
    end_time: datetime.datetime
    num_particles: int = 500

class DriftSimulationCreate(DriftSimulationBase):
    incident_id: int

class DriftSimulationResponse(DriftSimulationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_id: int
    status: str
    trajectories_geojson: Optional[Dict[str, Any]] = None
    uncertainty_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime

class OriginEstimateBase(BaseModel):
    probable_origin_lat: float
    probable_origin_lon: float
    origin_geojson: Optional[Dict[str, Any]] = None
    time_window_start: datetime.datetime
    time_window_end: datetime.datetime
    uncertainty_radius_km: float = 5.0
    confidence: float = 0.85

class OriginEstimateResponse(OriginEstimateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_id: int
    created_at: datetime.datetime
