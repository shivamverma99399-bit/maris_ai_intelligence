import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.spill import SpillResponse
from app.schemas.drift import OriginEstimateResponse
from app.schemas.ais import VesselTrajectoryResponse
from app.schemas.attribution import CandidateVesselResponse, VesselDossierResponse

class IncidentBase(BaseModel):
    title: str
    status: str = "DETECTED"
    observation_time: Optional[datetime.datetime] = None

class IncidentCreate(IncidentBase):
    incident_id: Optional[str] = None

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None

class IncidentResponse(IncidentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_id: str
    observation_time: datetime.datetime
    created_at: datetime.datetime

class IncidentDetailResponse(IncidentResponse):
    spills: List[SpillResponse] = []

class PipelineTelemetry(BaseModel):
    sar_detection_ms: float = 0.0
    drift_hindcast_ms: float = 0.0
    ais_reconstruction_ms: float = 0.0
    attribution_ms: float = 0.0
    total_execution_ms: float = 0.0
    pipeline_version: str = "1.0.0"

class IncidentInvestigationResponse(BaseModel):
    """
    Unified end-to-end investigation payload orchestrating SAR spill detection,
    hydrodynamic OpenDrift hindcast origin estimation, reconstructed AIS traffic,
    multi-factor suspect attribution ranking, and forensic evidence dossiers.
    """
    model_config = ConfigDict(from_attributes=True)

    incident: IncidentDetailResponse
    origin_estimate: Optional[OriginEstimateResponse] = None
    total_trajectories: int = 0
    trajectories: List[VesselTrajectoryResponse] = []
    total_candidates: int = 0
    candidates: List[CandidateVesselResponse] = []
    top_suspect_dossier: Optional[VesselDossierResponse] = None
    telemetry: Optional[PipelineTelemetry] = None
