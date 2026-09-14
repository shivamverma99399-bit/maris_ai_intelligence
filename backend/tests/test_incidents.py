import pytest
from app.core.config import settings

def test_create_incident_and_spill_detection(client):
    payload = {
        "title": "Suspected Spill near Mumbai High Oilfield",
        "incident_id": "INC-2026-MUM-001"
    }
    response = client.post(f"{settings.API_V1_STR}/incidents", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["incident_id"] == "INC-2026-MUM-001"
    assert data["title"] == "Suspected Spill near Mumbai High Oilfield"
    assert data["status"] == "DETECTED"
    assert len(data["spills"]) == 1

    spill = data["spills"][0]
    assert spill["confidence"] >= 0.9
    assert 1.0 < spill["area_km2"] < 10.0
    assert spill["elongation"] > 2.0
    assert "polygon_geojson" in spill
    assert spill["centroid_lat"] > 18.0
    assert spill["centroid_lon"] > 72.0

def test_list_incidents(client):
    client.post(f"{settings.API_V1_STR}/incidents", json={"title": "Incident Alpha"})
    client.post(f"{settings.API_V1_STR}/incidents", json={"title": "Incident Beta"})

    response = client.get(f"{settings.API_V1_STR}/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) == 2

def test_get_incident_by_id_and_not_found(client):
    create_res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "Single Search Test", "incident_id": "INC-TARGET-99"}
    )
    assert create_res.status_code == 201

    get_res = client.get(f"{settings.API_V1_STR}/incidents/INC-TARGET-99")
    assert get_res.status_code == 200
    assert get_res.json()["incident_id"] == "INC-TARGET-99"

    not_found = client.get(f"{settings.API_V1_STR}/incidents/NON-EXISTENT-ID")
    assert not_found.status_code == 404

def test_get_spills_for_incident(client):
    create_res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "Spill Query Test", "incident_id": "INC-SPILL-QUERY"}
    )
    assert create_res.status_code == 201

    spill_res = client.get(f"{settings.API_V1_STR}/spills/INC-SPILL-QUERY")
    assert spill_res.status_code == 200
    spills = spill_res.json()
    assert len(spills) == 1
    assert spills[0]["model_version"] == "mock-sar-unet-v1.0"
