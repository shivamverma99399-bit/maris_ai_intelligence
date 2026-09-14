import datetime
import pytest
from app.core.config import settings
from app.engines.attribution_engine import AttributionEngine, AttributionScores
from app.engines.candidate_filter import CandidateFilterResult
from app.schemas.ais import VesselTrajectoryResponse, TrajectoryPointResponse
from app.models.origin import OriginEstimate

def test_attribution_engine_weights_and_bounds():
    origin = OriginEstimate(
        probable_origin_lat=18.85,
        probable_origin_lon=72.15,
        uncertainty_radius_km=10.0,
        time_window_start=datetime.datetime(2026, 9, 11, 10, 0, tzinfo=datetime.timezone.utc),
        time_window_end=datetime.datetime(2026, 9, 11, 14, 0, tzinfo=datetime.timezone.utc),
        origin_geojson={"type": "Polygon", "coordinates": [[[72.1, 18.8], [72.2, 18.8], [72.2, 18.9], [72.1, 18.9], [72.1, 18.8]]]}
    )

    t_cpa = datetime.datetime(2026, 9, 11, 12, 0, tzinfo=datetime.timezone.utc)

    filter_res = CandidateFilterResult(
        mmsi=419001234,
        vessel_name="MT Sagar Ratna",
        vessel_type="Oil Tanker",
        flag="IN",
        is_synthetic=True,
        min_distance_km=1.2,
        closest_approach_time=t_cpa,
        speed_at_cpa_knots=4.5,
        temporal_overlap_minutes=180.0,
        duration_in_zone_minutes=120.0,
        intersects_polygon=True,
        intersects_window=True,
        has_anomalous_gaps=False,
        is_qualified=True,
        qualification_reason="Direct intersection",
        points_in_window_count=18
    )

    pings = [
        TrajectoryPointResponse(
            timestamp=t_cpa,
            latitude=18.85,
            longitude=72.15,
            sog=4.5,
            cog=32.0,
            heading=32.0
        )
    ]

    traj = VesselTrajectoryResponse(
        mmsi=419001234,
        vessel_name="MT Sagar Ratna",
        vessel_type="Oil Tanker",
        flag="IN",
        is_synthetic=True,
        start_time=t_cpa - datetime.timedelta(hours=4),
        end_time=t_cpa + datetime.timedelta(hours=4),
        raw_point_count=1,
        interpolated_point_count=0,
        total_distance_km=50.0,
        avg_speed_knots=14.2,
        max_speed_knots=15.0,
        min_speed_knots=4.5,
        has_anomalous_gaps=False,
        gaps=[],
        points=pings,
        geojson={"type": "Feature", "geometry": {"type": "LineString", "coordinates": [[72.15, 18.85]]}, "properties": {}}
    )

    scores: AttributionScores = AttributionEngine.compute_attribution(
        filter_result=filter_res,
        trajectory=traj,
        origin=origin,
        net_drift_cog=32.0
    )

    # All subscores bounded between 0 and 100
    for s in [scores.spatial_score, scores.temporal_score, scores.trajectory_score, scores.behaviour_score, scores.ais_score, scores.final_score]:
        assert 0.0 <= s <= 100.0

    # Prime suspect should score exceptionally high across spatial, temporal, and behavior
    assert scores.spatial_score >= 90.0
    assert scores.temporal_score >= 90.0
    assert scores.behaviour_score >= 85.0
    assert scores.final_score >= 80.0

    # Verifying mathematical composite weight formulation
    expected_final = (
        0.30 * scores.spatial_score +
        0.25 * scores.temporal_score +
        0.20 * scores.trajectory_score +
        0.15 * scores.behaviour_score +
        0.10 * scores.ais_score
    )
    assert abs(scores.final_score - expected_final) <= 0.2

    # Evidence lists populated
    assert len(scores.supporting_evidence) >= 2
    assert len(scores.uncertainty_factors) >= 1

def test_attribution_api_lifecycle(client):
    # 1. Create incident
    inc_res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "Attribution Scoring Test Incident", "incident_id": "INC-ATTR-001"}
    )
    assert inc_res.status_code == 201

    # 2. Query attribution endpoint
    res = client.get(f"{settings.API_V1_STR}/candidates/INC-ATTR-001/attribution")
    assert res.status_code == 200
    data = res.json()

    assert data["incident_id"] == "INC-ATTR-001"
    assert data["total_candidates"] >= 2
    candidates = data["candidates"]

    # Ranks must be strictly 1, 2, 3...
    assert [c["rank"] for c in candidates] == list(range(1, len(candidates) + 1))

    # Scores strictly descending
    for i in range(len(candidates) - 1):
        assert candidates[i]["final_score"] >= candidates[i + 1]["final_score"]

    top = candidates[0]
    second = candidates[1]

    # Top two candidates should be MT Sagar Ratna and Pacific Chemist
    top_two_names = {top["vessel_name"], second["vessel_name"]}
    assert "MT Sagar Ratna" in top_two_names
    assert "Pacific Chemist" in top_two_names

    # Check top candidate score breakdown completeness
    assert top["spatial_score"] > 0
    assert top["temporal_score"] > 0
    assert top["trajectory_score"] > 0
    assert top["behaviour_score"] > 0
    assert top["ais_score"] > 0
    assert top["final_score"] >= 70.0

    # Check explanation evidence cards
    expl = top["explanation"]
    assert "supporting_evidence" in expl
    assert "contradictory_evidence" in expl
    assert "uncertainty_factors" in expl
    assert len(expl["supporting_evidence"]) > 0

    # 3. Verify subresource endpoint /incidents/{incident_id}/attribution
    sub_res = client.get(f"{settings.API_V1_STR}/incidents/INC-ATTR-001/attribution")
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["total_candidates"] == data["total_candidates"]
    assert sub_data["candidates"][0]["mmsi"] == top["mmsi"]

def test_attribution_not_found(client):
    res = client.get(f"{settings.API_V1_STR}/candidates/NON-EXISTENT-INCIDENT/attribution")
    assert res.status_code == 404

    sub_res = client.get(f"{settings.API_V1_STR}/incidents/NON-EXISTENT-INCIDENT/attribution")
    assert sub_res.status_code == 404
