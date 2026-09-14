import datetime
import pytest
from app.core.config import settings
from app.engines.trajectory_engine import (
    TrajectoryEngine, haversine_km, interpolate_angle
)
from app.schemas.ais import VesselTrajectoryResponse

def test_trajectory_engine_math_helpers():
    # 1. Haversine distance
    # Distance between (18.0, 72.0) and (19.0, 72.0) ~ 111.19 km
    dist = haversine_km(18.0, 72.0, 19.0, 72.0)
    assert 110.0 <= dist <= 112.5

    # 2. Angle interpolation across 360 boundary (e.g. from 350 deg to 10 deg)
    mid_angle = interpolate_angle(350.0, 10.0, 0.5)
    assert round(mid_angle, 1) == 0.0 or round(mid_angle, 1) == 360.0

    # Normal angle interpolation (from 20 deg to 40 deg at 25%)
    assert round(interpolate_angle(20.0, 40.0, 0.25), 1) == 25.0

def test_single_vessel_trajectory_interpolation():
    t0 = datetime.datetime(2026, 9, 12, 0, 0, tzinfo=datetime.timezone.utc)
    t1 = t0 + datetime.timedelta(minutes=30)  # 30 min gap, step is 10 min -> 2 interpolated points

    pings = [
        {"mmsi": 419001234, "timestamp": t0, "latitude": 18.0, "longitude": 72.0, "sog": 12.0, "cog": 30.0, "vessel_name": "Test Ship"},
        {"mmsi": 419001234, "timestamp": t1, "latitude": 18.1, "longitude": 72.1, "sog": 14.0, "cog": 40.0, "vessel_name": "Test Ship"}
    ]

    traj: VesselTrajectoryResponse = TrajectoryEngine.reconstruct_vessel_trajectory(
        pings=pings,
        step_minutes=10,
        gap_threshold_hours=1.0
    )

    assert traj.mmsi == 419001234
    assert traj.vessel_name == "Test Ship"
    assert traj.raw_point_count == 2
    assert traj.interpolated_point_count == 2  # t+10m, t+20m
    assert len(traj.points) == 4
    assert traj.has_anomalous_gaps is False
    assert len(traj.gaps) == 0

    # Verify GeoJSON
    assert traj.geojson["type"] == "Feature"
    assert traj.geojson["geometry"]["type"] == "LineString"
    assert len(traj.geojson["geometry"]["coordinates"]) == 4

def test_ais_gap_and_blackout_detection():
    t0 = datetime.datetime(2026, 9, 12, 0, 0, tzinfo=datetime.timezone.utc)
    t1 = t0 + datetime.timedelta(hours=3, minutes=30)  # 3.5 hour blackout

    pings = [
        {"mmsi": 419005678, "timestamp": t0, "latitude": 18.0, "longitude": 72.0, "sog": 13.0, "cog": 345.0, "vessel_name": "Dark Target"},
        {"mmsi": 419005678, "timestamp": t1, "latitude": 18.4, "longitude": 71.9, "sog": 13.0, "cog": 345.0, "vessel_name": "Dark Target"}
    ]

    traj = TrajectoryEngine.reconstruct_vessel_trajectory(
        pings=pings,
        step_minutes=15,
        gap_threshold_hours=1.0
    )

    assert traj.has_anomalous_gaps is True
    assert len(traj.gaps) == 1
    gap = traj.gaps[0]
    assert gap.duration_hours == 3.5
    assert gap.suspected_blackout is True
    assert gap.distance_km > 30.0

    # Check points in gap are flagged
    interp_in_gap = [p for p in traj.points if p.in_gap]
    assert len(interp_in_gap) > 0

def test_incident_trajectories_api(client):
    # 1. Create incident
    inc_res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "Trajectory Incident Test", "incident_id": "INC-TRAJ-001"}
    )
    assert inc_res.status_code == 201

    # 2. Query incident trajectories endpoint
    res = client.get(f"{settings.API_V1_STR}/ais/INC-TRAJ-001/trajectories?step_minutes=15&gap_threshold_hours=1.5")
    assert res.status_code == 200
    data = res.json()

    assert data["incident_id"] == "INC-TRAJ-001"
    assert data["total_vessels"] >= 2
    vessels = data["vessels"]
    vessel_names = {v["vessel_name"] for v in vessels}
    assert "MT Sagar Ratna" in vessel_names
    assert "Pacific Chemist" in vessel_names

    # Check that Pacific Chemist exhibits the intentional transponder blackout
    pacific_chemist = next(v for v in vessels if v["vessel_name"] == "Pacific Chemist")
    assert pacific_chemist["has_anomalous_gaps"] is True
    assert any(g["suspected_blackout"] for g in pacific_chemist["gaps"])
    assert pacific_chemist["geojson"]["type"] == "Feature"
    assert len(pacific_chemist["geojson"]["geometry"]["coordinates"]) > 0

def test_incident_trajectories_not_found(client):
    res = client.get(f"{settings.API_V1_STR}/ais/NON-EXISTENT-INCIDENT/trajectories")
    assert res.status_code == 404
