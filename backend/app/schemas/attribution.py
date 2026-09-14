import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field

class CandidateScoreBreakdown(BaseModel):
    spatial_score: float = Field(..., ge=0.0, le=100.0)
    temporal_score: float = Field(..., ge=0.0, le=100.0)
    trajectory_score: float = Field(..., ge=0.0, le=100.0)
    behaviour_score: float = Field(..., ge=0.0, le=100.0)
    ais_score: float = Field(..., ge=0.0, le=100.0)
    final_score: float = Field(..., ge=0.0, le=100.0)
    rank: int

class CandidateExplanation(BaseModel):
    supporting_evidence: List[str] = []
    contradictory_evidence: List[str] = []
    uncertainty_factors: List[str] = []
    assessment_notes: Optional[str] = None

class CandidateVesselResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_id: int
    vessel_id: Optional[int] = None
    mmsi: int
    spatial_score: float
    temporal_score: float
    trajectory_score: float
    behaviour_score: float
    ais_score: float
    final_score: float
    rank: int
    explanation: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime

    # Vessel metadata
    vessel_name: Optional[str] = None
    vessel_type: Optional[str] = None
    flag: Optional[str] = None
    is_synthetic: Optional[bool] = False

class IncidentCandidatesResponse(BaseModel):
    incident_id: str
    total_candidates: int
    qualified_count: int
    candidates: List[CandidateVesselResponse]

class ForensicTimelineEvent(BaseModel):
    timestamp: datetime.datetime
    event_type: str
    title: str
    description: str
    latitude: float
    longitude: float
    sog_knots: float
    cog_degrees: float

class VesselDossierResponse(BaseModel):
    incident_id: str
    mmsi: int
    vessel_name: str
    vessel_type: str
    flag: str
    imo: Optional[str] = None
    is_synthetic: bool = False
    rank: int
    final_score: float
    score_breakdown: CandidateScoreBreakdown
    supporting_evidence: List[str]
    contradictory_evidence: List[str]
    uncertainty_factors: List[str]
    investigator_summary: str
    timeline: List[ForensicTimelineEvent]
    closest_approach_distance_km: float
    closest_approach_time: Optional[datetime.datetime] = None
    duration_in_zone_minutes: float
    spill_compatibility: Dict[str, Any]
    legal_disclaimer: str = "MARIS decision-support intelligence. Establishes probabilistic attribution based on kinematic and oceanographic modeling without asserting judicial guilt."


