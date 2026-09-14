import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import get_db
from app.models import Base, init_db

# Shared test engine across all test modules
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
init_db(test_engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def clean_database():
    """Drops and recreates all tables cleanly before every single test."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield

@pytest.fixture
def client():
    """Provides a fresh TestClient for API endpoints."""
    return TestClient(app)

@pytest.fixture
def db_session():
    """Provides a clean transactional database session for model tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
