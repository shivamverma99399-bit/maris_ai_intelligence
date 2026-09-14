import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class Incident(Base):
    """Investigation incident aggregating satellite detection, drift hindcast, and vessel attribution."""
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(32), default="DETECTED", nullable=False)  # DETECTED, ANALYZING, ATTRIBUTED, CLOSED
    observation_time = Column(DateTime, default=utcnow, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    spills = relationship("Spill", back_populates="incident", cascade="all, delete-orphan")
    drift_simulations = relationship("DriftSimulation", back_populates="incident", cascade="all, delete-orphan")
    origin_estimates = relationship("OriginEstimate", back_populates="incident", cascade="all, delete-orphan")
    candidates = relationship("CandidateVessel", back_populates="incident", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Incident {self.incident_id} [{self.status}]>"
