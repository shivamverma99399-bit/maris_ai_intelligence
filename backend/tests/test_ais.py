import datetime
import io
import pytest
from app.core.config import settings
from app.engines.ais_cleaner import AisCleaner
from app.engines.ais_generator import IndianEezAisGenerator
from app.services.ais_service import AisService

def test_ais_cleaner_validation():
    # 1. Valid record
    valid_raw = {
        "mmsi": 419001234,
        "timestamp": "2026-09-12T01:00:00Z",
        "latitude": 18.85,
        "longitude": 72.15,
        "sog": 12.4,
        "cog": 45.0,
        "heading": 44.0,
        "vessel_name": "Test Tanker",
        "vessel_type": "Oil Tanker",
        "flag": "IN"
    }
    cleaned = AisCleaner.clean_record(valid_raw)
    assert cleaned is not None
    assert cleaned["mmsi"] == 419001234
    assert cleaned["latitude"] == 18.85
    assert cleaned["longitude"] == 72.15
    assert cleaned["sog"] == 12.4
    assert cleaned["vessel_name"] == "Test Tanker"
    assert cleaned["is_synthetic"] is False

    # 2. Invalid speed outlier (> 60 knots)
    high_speed = dict(valid_raw, sog=75.5)
    assert AisCleaner.clean_record(high_speed) is None

    # 3. Invalid coordinates
    bad_lat = dict(valid_raw, latitude=95.0)
    assert AisCleaner.clean_record(bad_lat) is None

    # 4. Invalid MMSI
    bad_mmsi = dict(valid_raw, mmsi=0)
    assert AisCleaner.clean_record(bad_mmsi) is None

def test_ais_cleaner_deduplication():
    records = [
        {"mmsi": 419001111, "timestamp": "2026-09-12T01:00:00Z", "latitude": 18.0, "longitude": 72.0, "sog": 10.0},
        {"mmsi": 419001111, "timestamp": "2026-09-12T01:00:00Z", "latitude": 18.0, "longitude": 72.0, "sog": 10.0}, # duplicate
        {"mmsi": 419001111, "timestamp": "2026-09-12T01:15:00Z", "latitude": 18.05, "longitude": 72.05, "sog": 10.5},
    ]
    cleaned, dropped = AisCleaner.clean_batch(records)
    assert len(cleaned) == 2
    assert dropped == 1

def test_ais_cleaner_csv_parsing():
    csv_text = """mmsi,timestamp,lat,lon,speed,course,ship_name,type
419002222,2026-09-12T02:00:00Z,18.5,72.2,14.2,35.0,Alpha Star,Cargo
419003333,2026-09-12T02:05:00Z,18.6,72.3,11.0,180.0,Beta Ocean,Tanker
"""
    records = AisCleaner.parse_csv_content(csv_text, default_synthetic=True)
    assert len(records) == 2
    cleaned, dropped = AisCleaner.clean_batch(records)
    assert len(cleaned) == 2
    assert dropped == 0
    assert cleaned[0]["vessel_name"] == "Alpha Star"
    assert cleaned[0]["is_synthetic"] is True
    assert cleaned[1]["vessel_name"] == "Beta Ocean"

def test_ais_cleaner_nmea_sentence():
    sentence = "$AIS,419004444,2026-09-12T03:00:00Z,18.7,72.4,12.5,90.0,Gamma Wave"
    record = AisCleaner.parse_nmea_sentence(sentence)
    assert record is not None
    assert record["mmsi"] == 419004444
    assert record["latitude"] == 18.7
    assert record["vessel_name"] == "Gamma Wave"

def test_indian_eez_generator_synthetic_tagging():
    obs_time = datetime.datetime.now(datetime.timezone.utc)
    traffic = IndianEezAisGenerator.generate_demo_traffic(
        origin_lat=18.85,
        origin_lon=72.15,
        observation_time=obs_time
    )

    assert len(traffic) > 50
    # Rule 6 compliance: All synthetic records MUST have is_synthetic == True
    for r in traffic:
        assert r["is_synthetic"] is True

    # Vessel identities verification
    vessel_names = {r["vessel_name"] for r in traffic}
    assert "MT Sagar Ratna" in vessel_names
    assert "Pacific Chemist" in vessel_names
    assert "Ever Apex" in vessel_names
    assert "Halani Tide" in vessel_names

def test_ais_api_ingest_json(client):
    payload = {
        "records": [
            {
                "mmsi": 419999001,
                "timestamp": "2026-09-12T04:00:00Z",
                "latitude": 18.9,
                "longitude": 72.2,
                "sog": 12.0,
                "cog": 45.0,
                "vessel_name": "API Test Vessel",
                "vessel_type": "Tanker",
                "flag": "IN",
                "is_synthetic": True
            }
        ],
        "is_synthetic": True
    }
    res = client.post(f"{settings.API_V1_STR}/ais/ingest", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["ingested_positions"] == 1
    assert data["distinct_vessels"] == 1

def test_ais_api_ingest_csv_payload(client):
    csv_str = """mmsi,timestamp,latitude,longitude,sog,cog,vessel_name
419999002,2026-09-12T05:00:00Z,18.92,72.22,11.5,50.0,CSV Vessel 1
419999003,2026-09-12T05:00:00Z,18.95,72.25,14.0,55.0,CSV Vessel 2
"""
    res = client.post(
        f"{settings.API_V1_STR}/ais/ingest",
        json={"csv_content": csv_str, "is_synthetic": True}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["ingested_positions"] == 2
    assert data["distinct_vessels"] == 2

def test_ais_api_upload_file(client):
    csv_bytes = b"""mmsi,timestamp,latitude,longitude,sog,cog,vessel_name\n419999004,2026-09-12T06:00:00Z,18.98,72.28,10.0,60.0,Uploaded Vessel\n"""
    files = {"file": ("ais_data.csv", io.BytesIO(csv_bytes), "text/csv")}
    res = client.post(f"{settings.API_V1_STR}/ais/upload", files=files, data={"is_synthetic": "true"})
    assert res.status_code == 200
    data = res.json()
    assert data["ingested_positions"] == 1
    assert data["distinct_vessels"] == 1

def test_ais_incident_traffic_generation_and_query(client):
    # 1. Create incident
    inc_res = client.post(
        f"{settings.API_V1_STR}/incidents",
        json={"title": "AIS Traffic Test Incident", "incident_id": "INC-AIS-001"}
    )
    assert inc_res.status_code == 201

    # 2. Query AIS traffic (triggers automatic Indian EEZ synthesis because no prior traffic exists)
    traffic_res = client.get(f"{settings.API_V1_STR}/ais/INC-AIS-001")
    assert traffic_res.status_code == 200
    traffic_data = traffic_res.json()

    assert traffic_data["incident_id"] == "INC-AIS-001"
    assert traffic_data["total_positions"] > 0
    assert traffic_data["total_vessels"] >= 2
    assert "time_window_start" in traffic_data
    assert "time_window_end" in traffic_data
    assert len(traffic_data["positions"]) == traffic_data["total_positions"]

    # All demo records should have is_synthetic == True
    assert all(p["is_synthetic"] is True for p in traffic_data["positions"])

    # 3. Query positions sub-endpoint
    pos_res = client.get(f"{settings.API_V1_STR}/ais/INC-AIS-001/positions")
    assert pos_res.status_code == 200
    pos_data = pos_res.json()
    assert len(pos_data) == traffic_data["total_positions"]

def test_ais_incident_not_found(client):
    res = client.get(f"{settings.API_V1_STR}/ais/NON-EXISTENT-INCIDENT")
    assert res.status_code == 404
