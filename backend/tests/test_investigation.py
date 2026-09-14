import pytest
from app.services.incident_service import IncidentService
from app.services.ais_service import AisService
from app.engines.ais_generator import IndianEezAisGenerator

def test_end_to_end_investigation_pipeline(client, db_session):
    """
    Validates complete end-to-end investigation orchestration:
    SAR Spill Detection -> OpenDrift Origin -> AIS Trajectories -> Attribution Ranking -> Forensic Dossier.
    """
    incident_id = "INC-TEST-E2E"

    # 1. Create incident with ML spill detection
    incident_service = IncidentService(db_session)
    incident = incident_service.create_incident_with_detection(
        title="End-to-End Arabian Sea Test Slick",
        incident_id=incident_id
    )
    assert incident.incident_id == incident_id
    assert len(incident.spills) > 0

    # 2. Ingest AIS traffic to simulate maritime corridor
    ais_service = AisService(db_session)
    raw_pings = IndianEezAisGenerator.generate_demo_traffic(
        origin_lat=incident.spills[0].centroid_lat,
        origin_lon=incident.spills[0].centroid_lon,
        observation_time=incident.observation_time
    )
    ingest_result = ais_service.ingest_raw_records(raw_pings, default_synthetic=True)
    assert ingest_result["ingested_positions"] > 0

    # 3. Call unified GET /api/v1/incidents/{incident_id}/investigation endpoint
    res = client.get(f"/api/v1/incidents/{incident_id}/investigation")
    assert res.status_code == 200

    data = res.json()

    # Verify incident & spill detection
    assert data["incident"]["incident_id"] == incident_id
    assert len(data["incident"]["spills"]) > 0
    spill = data["incident"]["spills"][0]
    assert spill["area_km2"] > 0.0
    assert spill["perimeter_km"] > 0.0
    assert spill["elongation"] >= 1.0
    assert "polygon_geojson" in spill

    # Verify origin estimate
    assert data["origin_estimate"] is not None
    assert data["origin_estimate"]["uncertainty_radius_km"] > 0.0
    assert "origin_geojson" in data["origin_estimate"]

    # Verify trajectories
    assert data["total_trajectories"] > 0
    assert len(data["trajectories"]) > 0
    first_traj = data["trajectories"][0]
    assert "points" in first_traj
    assert first_traj["total_distance_km"] > 0.0

    # Verify candidate suspects
    assert data["total_candidates"] > 0
    assert len(data["candidates"]) > 0
    top_candidate = data["candidates"][0]
    assert top_candidate["rank"] == 1
    assert top_candidate["final_score"] > 0.0
    assert "spatial_score" in top_candidate
    assert "temporal_score" in top_candidate

    # Verify top suspect forensic dossier
    assert data["top_suspect_dossier"] is not None
    dossier = data["top_suspect_dossier"]
    assert dossier["mmsi"] == top_candidate["mmsi"]
    assert len(dossier["timeline"]) > 0
    assert len(dossier["supporting_evidence"]) > 0
    assert "spill_compatibility" in dossier
    assert "legal_disclaimer" in dossier

    # Verify telemetry
    assert data["telemetry"] is not None
    telemetry = data["telemetry"]
    assert telemetry["total_execution_ms"] > 0.0
    assert "pipeline_version" in telemetry


def test_investigation_nonexistent_incident(client):
    """Validates 404 behavior for unknown incident."""
    res = client.get("/api/v1/incidents/INC-NONEXISTENT-999/investigation")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
