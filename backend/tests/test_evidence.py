import pytest
from app.core.config import settings

@pytest.fixture
def evidence_incident(client):
    inc_res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "Evidence Dossier Incident", "incident_id": "INC-EV-001"}
    )
    assert inc_res.status_code == 201
    return "INC-EV-001"

def test_vessel_dossier_prime_suspect(client, evidence_incident):
    # Query dossier for MT Sagar Ratna (MMSI 419001234)
    res = client.get(f"{settings.API_V1_STR}/candidates/{evidence_incident}/dossier/419001234")
    assert res.status_code == 200
    dossier = res.json()

    assert dossier["incident_id"] == evidence_incident
    assert dossier["mmsi"] == 419001234
    assert dossier["vessel_name"] == "MT Sagar Ratna"
    assert dossier["vessel_type"] == "Oil Tanker"
    assert dossier["rank"] <= 2
    assert dossier["final_score"] >= 75.0

    # Verify score breakdown
    sb = dossier["score_breakdown"]
    assert sb["spatial_score"] > 0
    assert sb["temporal_score"] > 0
    assert sb["trajectory_score"] > 0
    assert sb["behaviour_score"] > 0
    assert sb["ais_score"] > 0

    # Verify forensic timeline
    timeline = dossier["timeline"]
    assert len(timeline) >= 2
    event_types = [e["event_type"] for e in timeline]
    assert "CPA_ORIGIN" in event_types
    # MT Sagar Ratna slows down near origin
    assert "SPEED_ANOMALY" in event_types

    # Verify spill compatibility
    compat = dossier["spill_compatibility"]
    assert compat["risk_profile"] == "HIGH"
    assert compat["slick_area_km2"] > 0
    assert compat["estimated_discharge_tonnes"] > 0

    # Verify investigator summary and legal disclaimer
    assert len(dossier["investigator_summary"]) > 50
    assert "MARIS decision-support" in dossier["legal_disclaimer"]

def test_vessel_dossier_blackout_suspect(client, evidence_incident):
    # Query dossier for Pacific Chemist (MMSI 419005678)
    res = client.get(f"{settings.API_V1_STR}/candidates/{evidence_incident}/dossier/419005678")
    assert res.status_code == 200
    dossier = res.json()

    assert dossier["mmsi"] == 419005678
    assert dossier["vessel_name"] == "Pacific Chemist"
    assert dossier["rank"] <= 2

    # Pacific Chemist should have BLACKOUT events
    timeline = dossier["timeline"]
    event_types = [e["event_type"] for e in timeline]
    assert "BLACKOUT_START" in event_types
    assert "BLACKOUT_END" in event_types

    # AIS score should be elevated due to blackout
    assert dossier["score_breakdown"]["ais_score"] >= 80.0

def test_vessel_dossier_subresource(client, evidence_incident):
    # Subresource path /incidents/{incident_id}/candidates/{mmsi}/dossier
    res = client.get(f"{settings.API_V1_STR}/incidents/{evidence_incident}/candidates/419001234/dossier")
    assert res.status_code == 200
    assert res.json()["mmsi"] == 419001234

def test_vessel_dossier_not_found(client, evidence_incident):
    # Unknown incident
    res1 = client.get(f"{settings.API_V1_STR}/candidates/UNKNOWN-INC/dossier/419001234")
    assert res1.status_code == 404

    # Unknown MMSI on existing incident
    res2 = client.get(f"{settings.API_V1_STR}/candidates/{evidence_incident}/dossier/999999999")
    assert res2.status_code == 404
