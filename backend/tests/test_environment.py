import math
import datetime
import pytest
from app.core.config import settings
from app.services.environment_service import EnvironmentService

def test_uv_speed_direction_roundtrip():
    spd, direction = EnvironmentService.uv_to_speed_direction(0.0, 10.0)
    assert spd == 10.0
    assert direction in [0.0, 360.0]

    spd, direction = EnvironmentService.uv_to_speed_direction(10.0, 0.0)
    assert spd == 10.0
    assert direction == 90.0

    u, v = EnvironmentService.speed_direction_to_uv(10.0, 135.0)
    spd, direction = EnvironmentService.uv_to_speed_direction(u, v)
    assert math.isclose(spd, 10.0, abs_tol=0.01)
    assert math.isclose(direction, 135.0, abs_tol=0.1)

def test_environment_service_and_api(client):
    res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "Env Test Spill Incident", "incident_id": "INC-ENV-001"}
    )
    assert res.status_code == 201

    env_res = client.get(f"{settings.API_V1_STR}/environment/INC-ENV-001")
    assert env_res.status_code == 200
    data = env_res.json()

    assert data["incident_id"] == "INC-ENV-001"
    assert data["mean_current_speed"] > 0.0
    assert data["mean_wind_speed"] > 0.0
    assert 0.0 <= data["mean_wind_direction"] <= 360.0
    assert 0.0 <= data["mean_current_direction"] <= 360.0
    assert data["net_drift_speed_knots"] > 0.0
    assert len(data["grid_points"]) > 0

    pt = data["grid_points"][0]
    assert "current_u" in pt
    assert "current_v" in pt
    assert "wind_u" in pt
    assert "wind_v" in pt
    assert pt["current_speed"] > 0.0
    assert pt["wind_speed"] > 0.0

def test_environment_not_found(client):
    res = client.get(f"{settings.API_V1_STR}/environment/NON-EXISTENT-INCIDENT")
    assert res.status_code == 404
