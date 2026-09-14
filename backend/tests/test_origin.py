import datetime
import pytest
from shapely.geometry import Polygon, shape
from app.core.config import settings
from app.engines.drift_engine import DriftEngine, DriftSimulationResult
from app.engines.origin_engine import OriginEngine, OriginResult

def test_origin_engine_computation():
    poly = Polygon([
        (72.14, 18.84),
        (72.16, 18.84),
        (72.16, 18.86),
        (72.14, 18.86),
        (72.14, 18.84)
    ])
    obs_time = datetime.datetime.now(datetime.timezone.utc)

    hindcast: DriftSimulationResult = DriftEngine.run_backward_hindcast(
        observed_polygon=poly,
        observation_time=obs_time,
        hindcast_hours=24,
        time_step_minutes=30,
        num_particles=60,
        mean_current_u=0.15,
        mean_current_v=-0.25,
        mean_wind_u=5.0,
        mean_wind_v=-4.0
    )

    origin_result: OriginResult = OriginEngine.estimate_origin_from_hindcast(
        hindcast_result=hindcast,
        spill_elongation=2.5,
        net_drift_speed_knots=0.85
    )

    # 1. Temporal bounds check
    assert origin_result.time_window_start < origin_result.time_window_end < obs_time

    # 2. Spatial coordinates check: origin must be upcurrent/upwind (NW of observed centroid)
    obs_centroid = poly.centroid
    assert origin_result.probable_origin_lon < obs_centroid.x  # West
    assert origin_result.probable_origin_lat > obs_centroid.y  # North

    # 3. Uncertainty radius and confidence
    assert origin_result.uncertainty_radius_km >= 3.0
    assert 0.70 <= origin_result.confidence <= 1.0

    # 4. Geometry validity
    origin_geom = shape(origin_result.origin_geojson)
    assert origin_geom.is_valid
    assert not origin_geom.is_empty
    assert origin_geom.area > 0

def test_origin_api_lifecycle(client):
    # 1. Create incident first
    res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "Origin Estimate Incident", "incident_id": "INC-ORIGIN-001"}
    )
    assert res.status_code == 201

    # 2. Request probable origin (triggers automatic backward hindcast and persistence)
    orig_res = client.get(f"{settings.API_V1_STR}/origin/INC-ORIGIN-001")
    assert orig_res.status_code == 200
    data = orig_res.json()

    assert data["incident_id"] is not None
    assert data["probable_origin_lat"] > 18.0
    assert data["probable_origin_lon"] > 71.0
    assert data["uncertainty_radius_km"] >= 3.0
    assert data["confidence"] > 0.8
    assert "time_window_start" in data
    assert "time_window_end" in data
    assert "origin_geojson" in data

    # 3. Query again to verify cached result from DB
    cached_res = client.get(f"{settings.API_V1_STR}/origin/INC-ORIGIN-001")
    assert cached_res.status_code == 200
    assert cached_res.json()["id"] == data["id"]

def test_origin_not_found(client):
    res = client.get(f"{settings.API_V1_STR}/origin/UNKNOWN-ID")
    assert res.status_code == 404
