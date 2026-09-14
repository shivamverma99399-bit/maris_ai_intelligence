import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import (
    Base, Incident, Spill, Vessel, AisPosition,
    EnvironmentData, DriftSimulation, OriginEstimate, CandidateVessel, init_db
)
from app.schemas import (
    IncidentResponse, SpillResponse, VesselResponse,
    AisPositionResponse, CandidateVesselResponse
)

@pytest.fixture
def db_session():
    """Provides a fresh transactional in-memory database session."""
    test_engine = create_engine("sqlite:///:memory:")
    init_db(test_engine)
    Session = sessionmaker(bind=test_engine)
    session = Session()
    yield session
    session.close()

def test_incident_and_spill_relationship(db_session):
    # 1. Create Incident
    obs_time = datetime.datetime.now(datetime.timezone.utc)
    incident = Incident(
        incident_id="INC-2026-TEST-001",
        title="Test Sentinel-1 Spill Detection",
        status="DETECTED",
        observation_time=obs_time
    )
    db_session.add(incident)
    db_session.commit()
    db_session.refresh(incident)

    assert incident.id is not None
    assert incident.incident_id == "INC-2026-TEST-001"

    # 2. Add Spill
    polygon_geo = {
        "type": "Polygon",
        "coordinates": [[[72.5, 18.9], [72.6, 18.9], [72.6, 19.0], [72.5, 18.9]]]
    }
    spill = Spill(
        incident_id=incident.id,
        confidence=0.94,
        area_km2=4.85,
        perimeter_km=11.2,
        elongation=2.3,
        centroid_lat=18.95,
        centroid_lon=72.55,
        polygon_geojson=polygon_geo
    )
    db_session.add(spill)
    db_session.commit()
    db_session.refresh(spill)

    assert spill.id is not None
    assert spill.incident_id == incident.id
    assert len(incident.spills) == 1
    assert incident.spills[0].area_km2 == 4.85

    # Test Pydantic serialization
    spill_dto = SpillResponse.model_validate(spill)
    assert spill_dto.confidence == 0.94
    assert spill_dto.polygon_geojson == polygon_geo

def test_vessel_and_ais_position_tracking(db_session):
    vessel = Vessel(
        mmsi=419001234,
        imo="IMO9123456",
        vessel_name="Ocean Pioneer",
        vessel_type="Oil Tanker",
        flag="IN",
        is_synthetic=True
    )
    db_session.add(vessel)
    db_session.commit()
    db_session.refresh(vessel)

    ping_time = datetime.datetime.now(datetime.timezone.utc)
    pos = AisPosition(
        mmsi=vessel.mmsi,
        vessel_id=vessel.id,
        timestamp=ping_time,
        latitude=18.92,
        longitude=72.51,
        sog=12.4,
        cog=210.0,
        heading=209.0,
        is_synthetic=True
    )
    db_session.add(pos)
    db_session.commit()
    db_session.refresh(vessel)

    assert len(vessel.positions) == 1
    assert vessel.positions[0].sog == 12.4
    assert vessel.is_synthetic is True

    # Pydantic schema validation
    vessel_dto = VesselResponse.model_validate(vessel)
    pos_dto = AisPositionResponse.model_validate(pos)
    assert vessel_dto.mmsi == 419001234
    assert pos_dto.sog == 12.4

def test_drift_and_origin_and_candidate_attribution(db_session):
    incident = Incident(
        incident_id="INC-2026-TEST-002",
        title="Full Chain Test",
        status="ANALYZING",
        observation_time=datetime.datetime.now(datetime.timezone.utc)
    )
    db_session.add(incident)
    db_session.commit()

    # Drift Hindcast
    now = datetime.datetime.now(datetime.timezone.utc)
    start_time = now - datetime.timedelta(hours=12)
    drift = DriftSimulation(
        incident_id=incident.id,
        simulation_type="BACKWARD",
        status="COMPLETED",
        start_time=start_time,
        end_time=now,
        num_particles=500
    )
    db_session.add(drift)

    # Origin Estimate
    origin = OriginEstimate(
        incident_id=incident.id,
        probable_origin_lat=18.88,
        probable_origin_lon=72.48,
        time_window_start=start_time,
        time_window_end=now - datetime.timedelta(hours=8),
        uncertainty_radius_km=4.2,
        confidence=0.88
    )
    db_session.add(origin)

    # Candidate Vessel with forensic explanation
    explanation = {
        "supporting_evidence": [
            "AIS track crossed probable origin buffer at T-10h",
            "Speed drop from 14 knots to 4 knots observed near origin"
        ],
        "contradictory_evidence": [],
        "uncertainty_factors": ["Wind variance +/- 15 deg"],
        "disclaimer": "Ranked suspect for investigation; not an autonomous guilt declaration"
    }
    candidate = CandidateVessel(
        incident_id=incident.id,
        mmsi=419001234,
        spatial_score=92.0,
        temporal_score=88.5,
        trajectory_score=84.0,
        behaviour_score=80.0,
        ais_score=95.0,
        final_score=88.4,
        rank=1,
        explanation=explanation
    )
    db_session.add(candidate)
    db_session.commit()
    db_session.refresh(incident)

    assert len(incident.drift_simulations) == 1
    assert len(incident.origin_estimates) == 1
    assert len(incident.candidates) == 1
    assert incident.candidates[0].rank == 1
    assert incident.candidates[0].final_score == 88.4

    # Pydantic validation
    candidate_dto = CandidateVesselResponse.model_validate(candidate)
    assert candidate_dto.final_score == 88.4
    assert "Speed drop" in candidate_dto.explanation["supporting_evidence"][1]
