import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class SpillBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    confidence: float = Field(..., ge=0.0, le=1.0)
    area_km2: float = Field(..., ge=0.0)
    perimeter_km: float = Field(..., ge=0.0)
    elongation: float = Field(default=1.0, ge=0.0)
    model_version: str = "mock-v1"
    centroid_lat: float
    centroid_lon: float
    polygon_geojson: Optional[Dict[str, Any]] = None

class SpillCreate(SpillBase):
    incident_id: int

class SpillResponse(SpillBase):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    incident_id: int
    created_at: datetime.datetime
