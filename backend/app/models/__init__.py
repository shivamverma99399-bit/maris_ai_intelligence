from app.core.database import Base
from app.models.incident import Incident
from app.models.spill import Spill
from app.models.vessel import Vessel
from app.models.ais_position import AisPosition
from app.models.environment import EnvironmentData
from app.models.drift import DriftSimulation
from app.models.origin import OriginEstimate
from app.models.candidate import CandidateVessel

__all__ = [
    "Base",
    "Incident",
    "Spill",
    "Vessel",
    "AisPosition",
    "EnvironmentData",
    "DriftSimulation",
    "OriginEstimate",
    "CandidateVessel",
]

from sqlalchemy import text

def init_db(engine):
    """Initializes all model tables in the target database."""
    if engine.dialect.name == "postgresql":
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
        except Exception:
            pass
    Base.metadata.create_all(bind=engine)
