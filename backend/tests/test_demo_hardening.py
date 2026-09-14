import pytest
from app.services.demo_seeder import DemoSeeder, DEMO_INCIDENT_ID

def test_demo_seeder_execution(db_session):
    """Validates that DemoSeeder successfully creates the complete Mumbai High incident scenario."""
    summary = DemoSeeder.seed_mumbai_high_demo(db_session, reset_if_exists=True)

    assert summary["status"] == "success"
    assert summary["incident_id"] == DEMO_INCIDENT_ID
    assert summary["spill_area_km2"] > 10.0
    assert summary["uncertainty_radius_km"] > 0.0
    assert summary["ingested_positions"] > 0
    assert summary["total_candidates"] >= 3
    assert len(summary["top_suspect"]) > 0
    assert summary["top_score"] >= 70.0
    assert summary["counterfactual_consistency_score"] > 0.0
    assert summary["seed_duration_ms"] > 0.0


def test_demo_seed_api_endpoint(client):
    """Validates POST /api/v1/incidents/demo/seed REST endpoint."""
    res = client.post("/api/v1/incidents/demo/seed?reset_if_exists=true")
    assert res.status_code == 201

    data = res.json()
    assert data["status"] == "success"
    assert data["incident_id"] == DEMO_INCIDENT_ID
    assert data["total_candidates"] > 0


def test_full_demo_investigation_query(client):
    """Validates end-to-end investigation query on seeded demo scenario."""
    # Ensure seeded
    client.post("/api/v1/incidents/demo/seed?reset_if_exists=false")

    res = client.get(f"/api/v1/incidents/{DEMO_INCIDENT_ID}/investigation")
    assert res.status_code == 200

    data = res.json()
    assert data["incident"]["incident_id"] == DEMO_INCIDENT_ID
    assert len(data["incident"]["spills"]) > 0
    assert data["origin_estimate"] is not None
    assert data["total_trajectories"] > 0
    assert data["total_candidates"] > 0
    assert data["top_suspect_dossier"] is not None
    assert len(data["top_suspect_dossier"]["timeline"]) > 0
    assert data["telemetry"]["total_execution_ms"] > 0.0


def test_counterfactual_on_demo_incident(client):
    """Validates counterfactual simulation query on demo incident."""
    client.post("/api/v1/incidents/demo/seed?reset_if_exists=false")
    res = client.get(f"/api/v1/counterfactual/{DEMO_INCIDENT_ID}")
    assert res.status_code == 200

    data = res.json()
    assert data["incident_id"] == DEMO_INCIDENT_ID
    assert data["physical_consistency_score"] >= 30.0
    assert data["consistency_verdict"] in ["STRONG_MATCH", "PLAUSIBLE_MATCH", "WEAK_MATCH"]


def test_api_resilience_and_error_handling(client):
    """Validates defensive exception handling for malformed or out-of-bounds requests."""
    # 1. Non-existent incident
    res1 = client.get("/api/v1/incidents/NON-EXISTENT-XYZ/investigation")
    assert res1.status_code == 404

    # 2. Counterfactual with non-existent incident
    res2 = client.post("/api/v1/counterfactual/NON-EXISTENT-XYZ")
    assert res2.status_code == 404

    # 3. Candidate dossier for non-existent vessel
    res3 = client.get(f"/api/v1/candidates/{DEMO_INCIDENT_ID}/dossier/999999999")
    assert res3.status_code in [200, 404]  # returns preliminary fallback dossier or 404
