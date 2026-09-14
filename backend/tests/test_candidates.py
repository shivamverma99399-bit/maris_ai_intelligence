import datetime
import pytest
from app.core.config import settings
from app.services.candidate_service import CandidateService

def test_candidate_filtering_and_ranking_lifecycle(client):
    # 1. Create incident
    inc_res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "Candidate Qualification Incident", "incident_id": "INC-CAND-001"}
    )
    assert inc_res.status_code == 201

    # 2. Trigger candidate filtering via API
    res = client.get(f"{settings.API_V1_STR}/candidates/INC-CAND-001")
    assert res.status_code == 200
    data = res.json()

    assert data["incident_id"] == "INC-CAND-001"
    assert data["total_candidates"] >= 2
    assert data["qualified_count"] >= 1

    candidates = data["candidates"]
    # Check ranking
    ranks = [c["rank"] for c in candidates]
    assert ranks == list(range(1, len(candidates) + 1))

    # Verify that candidate scores are descending by final_score
    for i in range(len(candidates) - 1):
        assert candidates[i]["final_score"] >= candidates[i + 1]["final_score"]

    # Check that suspect vessels (MT Sagar Ratna and Pacific Chemist) are in candidates
    vessel_names = {c["vessel_name"] for c in candidates}
    assert "MT Sagar Ratna" in vessel_names
    assert "Pacific Chemist" in vessel_names

    # Check top candidate details
    top_cand = candidates[0]
    assert top_cand["rank"] == 1
    assert top_cand["final_score"] >= 60.0
    assert top_cand["spatial_score"] > 0
    assert top_cand["temporal_score"] > 0
    assert "min_distance_km" in top_cand["explanation"]
    assert "qualification_reason" in top_cand["explanation"]

    # 3. Verify subresource endpoint /incidents/{incident_id}/candidates returns identical cached results
    sub_res = client.get(f"{settings.API_V1_STR}/incidents/INC-CAND-001/candidates")
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["total_candidates"] == data["total_candidates"]
    assert sub_data["candidates"][0]["mmsi"] == top_cand["mmsi"]

    # 4. Verify force_recompute parameter
    recompute_res = client.get(f"{settings.API_V1_STR}/candidates/INC-CAND-001?force_recompute=true")
    assert recompute_res.status_code == 200
    assert recompute_res.json()["total_candidates"] == data["total_candidates"]

def test_candidate_service_direct(db_session):
    # Setup incident
    from app.services.incident_service import IncidentService
    inc_service = IncidentService(db_session)
    incident = inc_service.create_incident_with_detection(
        title="Direct Candidate Test",
        incident_id="INC-CAND-DIRECT"
    )

    cand_service = CandidateService(db_session)
    response = cand_service.filter_and_persist_candidates(
        incident_id="INC-CAND-DIRECT",
        force_recompute=True,
        spatial_buffer_km=5.0,
        temporal_buffer_hours=2.0
    )

    assert response.total_candidates > 0
    assert response.qualified_count >= 1
    assert any(c.explanation.get("is_qualified") for c in response.candidates)

def test_candidate_not_found(client):
    res = client.get(f"{settings.API_V1_STR}/candidates/NON-EXISTENT-INCIDENT")
    assert res.status_code == 404

    sub_res = client.get(f"{settings.API_V1_STR}/incidents/NON-EXISTENT-INCIDENT/candidates")
    assert sub_res.status_code == 404
