from typing import Optional
from pydantic import BaseModel, ConfigDict

class VesselBase(BaseModel):
    mmsi: int
    imo: Optional[str] = None
    vessel_name: str = "Unknown Vessel"
    vessel_type: str = "Unknown"
    flag: str = "Unknown"
    is_synthetic: bool = False

class VesselCreate(VesselBase):
    pass

class VesselResponse(VesselBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
