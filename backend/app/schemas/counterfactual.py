import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field

class CounterfactualRequest(BaseModel):
    mmsi: Optional[int] = Field(None, description="MMSI of suspect vessel to test. If omitted, tests top-ranked candidate.")
    num_particles: int = Field(200, ge=50, le=1000, description="Number of Lagrangian particles to simulate")
    variance_factor: float = Field(1.0, ge=0.1, le=5.0, description="Turbulent diffusion variance multiplier")

class CounterfactualResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    incident_id: str
    mmsi: int
    vessel_name: str
    vessel_type: str
    flag: str
    is_synthetic: bool = False
    
    # Release parameters
    release_time: datetime.datetime
    release_lat: float
    release_lon: float
    observation_time: datetime.datetime
    drift_duration_hours: float
    num_particles: int

    # Forward simulated slick geometry at observation time
    simulated_centroid_lat: float
    simulated_centroid_lon: float
    simulated_area_km2: float
    simulated_polygon_geojson: Dict[str, Any]

    # Observed satellite slick geometry
    observed_centroid_lat: float
    observed_centroid_lon: float
    observed_area_km2: float
    observed_polygon_geojson: Dict[str, Any]

    # Quantitative validation metrics
    centroid_distance_km: float
    iou_overlap: float
    hausdorff_distance_km: float
    physical_consistency_score: float = Field(..., ge=0.0, le=100.0)
    consistency_verdict: str  # STRONG_MATCH, PLAUSIBLE_MATCH, WEAK_MATCH, INCONSISTENT
    scientific_summary: str
    particle_tracks_geojson: Optional[Dict[str, Any]] = None
