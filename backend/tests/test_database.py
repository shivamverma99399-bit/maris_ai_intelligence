import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core import database
from app.core.config import settings

client = TestClient(app)

def test_system_config_endpoint():
    response = client.get(f"{settings.API_V1_STR}/config")
    assert response.status_code == 200
    data = response.json()
    assert data["project_name"] == settings.PROJECT_NAME
    assert data["ml_mode"] == settings.ML_MODE
    assert "opendrift_particles" in data

def test_database_health_probe_reporting():
    response = client.get(f"{settings.API_V1_STR}/health/db")
    # Endpoint should respond with 200 (if local postgres is running) or 503 (if not running yet)
    assert response.status_code in [200, 503]
    data = response.json()
    assert "database_status" in data
    assert data["database_status"] in ["connected", "disconnected"]
    assert "message" in data

def test_check_db_connection_with_mock_engine(monkeypatch):
    test_engine = create_engine("sqlite:///:memory:")
    monkeypatch.setattr(database, "engine", test_engine)
    
    is_connected, msg = database.check_db_connection()
    assert is_connected is True
    assert "active" in msg.lower()

    # Now verify failure handling
    monkeypatch.setattr(database, "engine", None)
    is_connected, msg = database.check_db_connection()
    assert is_connected is False
    assert "not initialized" in msg.lower()

def test_get_db_session_lifecycle(monkeypatch):
    test_engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    monkeypatch.setattr(database, "SessionLocal", TestingSessionLocal)

    gen = database.get_db()
    session = next(gen)
    assert session is not None
    # Execute a test query
    result = session.execute(text("SELECT 42")).scalar()
    assert result == 42
    
    # Verify cleanup upon generator exit
    with pytest.raises(StopIteration):
        next(gen)
