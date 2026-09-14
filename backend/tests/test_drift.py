import datetime
import pytest
from shapely.geometry import Polygon
from app.core.config import settings
from app.engines.drift_engine import DriftEngine, DriftSimulationResult

def test_particle_seeding_in_polygon():
    poly = Polygon([
        (72.10, 18.80),
        (72.20, 18.80),
        (72.20, 18.90),
        (72.10, 18.90),
        (72.10, 18.80)
    ])
    num = 80
    particles = DriftEngine.seed_particles_in_polygon(poly, num)
    assert len(particles) == num

    minx, miny, maxx, maxy = poly.bounds
    for lon, lat in particles:
        assert minx - 0.01 <= lon <= maxx + 0.01
        assert miny - 0.01 <= lat <= maxy + 0.01

def test_forward_drift_engine_physics():
    poly = Polygon([
        (72.14, 18.84),
        (72.16, 18.84),
        (72.16, 18.86),
        (72.14, 18.86),
        (72.14, 18.84)
    ])
    start = datetime.datetime.now(datetime.timezone.utc)

    result: DriftSimulationResult = DriftEngine.run_forward_simulation(
        spill_polygon=poly,
        start_time=start,
        duration_hours=12,
        time_step_minutes=30,
        num_particles=50,
        mean_current_u=0.15,
        mean_current_v=-0.25,
        mean_wind_u=5.0,
        mean_wind_v=-4.0
    )

    assert result.simulation_type == "FORWARD"
    assert result.num_particles == 50
    assert len(result.snapshots) >= 2
    assert result.trajectories_geojson["type"] == "FeatureCollection"
    assert len(result.trajectories_geojson["features"]) == 50

    last_snapshot = result.snapshots[-1]
    init_centroid = poly.centroid
    assert last_snapshot.centroid_lon > init_centroid.x
    assert last_snapshot.centroid_lat < init_centroid.y

def test_backward_drift_hindcast_physics():
    poly = Polygon([
        (72.14, 18.84),
        (72.16, 18.84),
        (72.16, 18.86),
        (72.14, 18.86),
        (72.14, 18.84)
    ])
    obs_time = datetime.datetime.now(datetime.timezone.utc)

    result: DriftSimulationResult = DriftEngine.run_backward_hindcast(
        observed_polygon=poly,
        observation_time=obs_time,
        hindcast_hours=12,
        time_step_minutes=30,
        num_particles=50,
        mean_current_u=0.15,
        mean_current_v=-0.25,
        mean_wind_u=5.0,
        mean_wind_v=-4.0
    )

    assert result.simulation_type == "BACKWARD"
    assert result.num_particles == 50
    assert len(result.snapshots) >= 2
    assert result.trajectories_geojson["type"] == "FeatureCollection"
    assert len(result.trajectories_geojson["features"]) == 50

    earliest_snapshot = result.snapshots[-1]
    init_centroid = poly.centroid
    assert earliest_snapshot.centroid_lon < init_centroid.x
    assert earliest_snapshot.centroid_lat > init_centroid.y
    assert earliest_snapshot.timestep_hours < 0

def test_forward_and_backward_drift_api_workflow(client):
    res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "Drift Workflow Test Incident", "incident_id": "INC-DRIFT-WF"}
    )
    assert res.status_code == 201

    fwd_res = client.post(
        f"{settings.API_V1_STR}/drift/INC-DRIFT-WF/forward?duration_hours=12&num_particles=50"
    )
    assert fwd_res.status_code == 201
    fwd_data = fwd_res.json()
    assert fwd_data["simulation_type"] == "FORWARD"

    bwd_res = client.post(
        f"{settings.API_V1_STR}/drift/INC-DRIFT-WF/backward?hindcast_hours=18&num_particles=60"
    )
    assert bwd_res.status_code == 201
    bwd_data = bwd_res.json()
    assert bwd_data["simulation_type"] == "BACKWARD"
    assert bwd_data["status"] == "COMPLETED"
    assert bwd_data["num_particles"] == 60
    assert "trajectories_geojson" in bwd_data

    list_res = client.get(f"{settings.API_V1_STR}/drift/INC-DRIFT-WF")
    assert list_res.status_code == 200
    sims = list_res.json()
    assert len(sims) == 2
    types = [s["simulation_type"] for s in sims]
    assert "FORWARD" in types
    assert "BACKWARD" in types
