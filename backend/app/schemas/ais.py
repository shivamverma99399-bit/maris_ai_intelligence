import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class AisPositionBase(BaseModel):
    mmsi: int
    timestamp: datetime.datetime
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    sog: float = Field(default=0.0, ge=0.0)
    cog: float = Field(default=0.0, ge=0.0, le=360.0)
    heading: float = Field(default=0.0, ge=0.0, le=360.0)
    nav_status: int = 0
    is_synthetic: bool = False

class AisPositionCreate(AisPositionBase):
    vessel_id: Optional[int] = None

class AisPositionResponse(AisPositionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vessel_id: Optional[int] = None

class AisIngestRequest(BaseModel):
    records: Optional[list[dict]] = None
    csv_content: Optional[str] = None
    is_synthetic: bool = False

class AisIngestResponse(BaseModel):
    status: str = "success"
    message: str
    ingested_positions: int
    dropped_positions: int
    distinct_vessels: int

class AisIncidentTrafficResponse(BaseModel):
    incident_id: str
    origin_lat: float
    origin_lon: float
    time_window_start: datetime.datetime
    time_window_end: datetime.datetime
    total_positions: int
    total_vessels: int
    positions: list[AisPositionResponse]

class AisGapResponse(BaseModel):
    start_time: datetime.datetime
    end_time: datetime.datetime
    duration_hours: float
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    distance_km: float
    suspected_blackout: bool
    description: str

class TrajectoryPointResponse(BaseModel):
    timestamp: datetime.datetime
    latitude: float
    longitude: float
    sog: float
    cog: float
    heading: float
    is_interpolated: bool = False
    in_gap: bool = False

class VesselTrajectoryResponse(BaseModel):
    mmsi: int
    vessel_name: str
    vessel_type: str
    flag: str
    is_synthetic: bool
    start_time: datetime.datetime
    end_time: datetime.datetime
    raw_point_count: int
    interpolated_point_count: int
    total_distance_km: float
    avg_speed_knots: float
    max_speed_knots: float
    min_speed_knots: float
    has_anomalous_gaps: bool
    gaps: list[AisGapResponse] = []
    points: list[TrajectoryPointResponse] = []
    geojson: dict

class IncidentTrajectoriesResponse(BaseModel):
    incident_id: str
    total_vessels: int
    vessels: list[VesselTrajectoryResponse]


