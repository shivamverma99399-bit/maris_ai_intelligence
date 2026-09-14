import datetime
import pytest
from shapely.geometry import Polygon

from app.engines.counterfactual_engine import CounterfactualEngine
from app.schemas.counterfactual import CounterfactualResult
from app.services.incident_service import IncidentService
from app.services.ais_service import AisService
from app.engines.ais_generator import IndianEezAisGenerator

def test_counterfactual_engine_forward_simulation():
    """Validates core CounterfactualEngine forward particle advection and validation."""
    now = datetime.datetime.now(datetime.timezone.utc)
    rel_time = now - datetime.timedelta(hours=4)

    # Simulated observed slick around (18.85 N, 72.15 E)
    obs_poly = Polygon([
        (72.13, 18.84),
        (72.16, 18.87),
        (72.18, 18.86),
        (72.15, 18.83),
        (72.13, 18.84)
    ])
    obs_centroid = (18.85, 72.15)
    obs_area = 1.85

    vessel_meta = {
        "mmsi": 419001234,
        "vessel_name": "Pacific Chemist",
        "vessel_type": "Chemical Tanker",
        "flag": "MH",
        "is_synthetic": True
    }

    # Suspect release point backtracked ~4 hours south-southwest
    rel_point = (18.80, 72.08)

    result = CounterfactualEngine.run_counterfactual_simulation(
        incident_id="INC-CF-TEST",
        vessel_metadata=vessel_meta,
        release_point=rel_point,
        release_time=rel_time,
        observation_time=now,
        observed_spill_polygon=obs_poly,
        observed_centroid=obs_centroid,
        observed_area_km2=obs_area,
        mean_current_u=0.14,
        mean_current_v=0.12,
        mean_wind_u=3.5,
        mean_wind_v=2.5,
        num_particles=100
    )

    assert isinstance(result, CounterfactualResult)
    assert result.incident_id == "INC-CF-TEST"
    assert result.mmsi == 419001234
    assert result.vessel_name == "Pacific Chemist"
    assert result.drift_duration_hours >= 3.9
    assert result.simulated_centroid_lat != 0.0
    assert result.simulated_centroid_lon != 0.0
    assert result.centroid_distance_km >= 0.0
    assert 0.0 <= result.iou_overlap <= 1.0
    assert 0.0 <= result.physical_consistency_score <= 100.0
    assert result.consistency_verdict in ["STRONG_MATCH", "PLAUSIBLE_MATCH", "WEAK_MATCH", "INCONSISTENT"]
    assert "scientific_summary" in result.model_dump()
    assert result.particle_tracks_geojson["type"] == "FeatureCollection"
    assert len(result.particle_tracks_geojson["features"]) > 0


def test_counterfactual_service_and_api(client, db_session):
    """Validates end-to-end counterfactual simulation execution via REST API."""
    incident_id = "INC-CF-API"

    # 1. Setup incident and AIS traffic
    inc_service = IncidentService(db_session)
    incident = inc_service.create_incident_with_detection(
        title="Counterfactual API Validation Slick",
        incident_id=incident_id
    )

    ais_service = AisService(db_session)
    pings = IndianEezAisGenerator.generate_demo_traffic(
        origin_lat=incident.spills[0].centroid_lat,
        origin_lon=incident.spills[0].centroid_lon,
        observation_time=incident.observation_time
    )
    ais_service.ingest_raw_records(pings, default_synthetic=True)

    # 2. Trigger POST /api/v1/counterfactual/{incident_id}
    res = client.post(f"/api/v1/counterfactual/{incident_id}", json={"num_particles": 100})
    assert res.status_code == 200

    data = res.json()
    assert data["incident_id"] == incident_id
    assert data["mmsi"] > 0
    assert data["vessel_name"] != ""
    assert data["physical_consistency_score"] > 0.0
    assert data["consistency_verdict"] in ["STRONG_MATCH", "PLAUSIBLE_MATCH", "WEAK_MATCH", "INCONSISTENT"]
    assert data["simulated_area_km2"] > 0.0
    assert "polygon_geojson" in data["simulated_polygon_geojson"] or "coordinates" in data["simulated_polygon_geojson"]

    # 3. Test GET /api/v1/counterfactual/{incident_id}
    res_get = client.get(f"/api/v1/counterfactual/{incident_id}")
    assert res_get.status_code == 200
    assert res_get.json()["incident_id"] == incident_id


def test_counterfactual_nonexistent_incident(client):
    """Validates 404 for missing incident."""
    res = client.post("/api/v1/counterfactual/INC-NONEXISTENT-999")
    assert res.status_code == 404
