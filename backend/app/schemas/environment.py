import math
import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class EnvironmentVector(BaseModel):
    """Spatiotemporal ocean current and surface wind velocity vectors."""
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime.datetime
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

    # Ocean current velocities (m/s)
    current_u: float = Field(..., description="Zonal current velocity (eastward > 0)")
    current_v: float = Field(..., description="Meridional current velocity (northward > 0)")
    current_speed: float = Field(..., ge=0.0, description="Current speed in m/s")
    current_direction: float = Field(..., ge=0.0, le=360.0, description="Current flow direction (towards, degrees)")

    # Surface wind velocities at 10m (m/s)
    wind_u: float = Field(..., description="Zonal wind velocity (eastward > 0)")
    wind_v: float = Field(..., description="Meridional wind velocity (northward > 0)")
    wind_speed: float = Field(..., ge=0.0, description="Wind speed in m/s")
    wind_direction: float = Field(..., ge=0.0, le=360.0, description="Wind direction (towards, degrees)")

    source: str = "ERA5"

class EnvironmentSummary(BaseModel):
    """Aggregated environmental forcing metrics for a spill incident region."""
    incident_id: str
    center_lat: float
    center_lon: float
    observation_time: datetime.datetime
    time_window_start: datetime.datetime
    time_window_end: datetime.datetime

    mean_current_speed: float
    mean_current_direction: float
    mean_wind_speed: float
    mean_wind_direction: float

    # Net estimated surface drift vector (approx. 100% current + 3% wind)
    net_drift_speed_knots: float
    net_drift_direction_deg: float

    source: str
    grid_points: List[EnvironmentVector] = []
