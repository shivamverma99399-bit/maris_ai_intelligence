import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class CandidateVessel(Base):
    """Ranked suspect vessel with transparent multi-factor attribution scores and explanation evidence."""
    __tablename__ = "candidate_vessels"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    vessel_id = Column(Integer, ForeignKey("vessels.id", ondelete="SET NULL"), nullable=True, index=True)
    mmsi = Column(Integer, index=True, nullable=False)

    # Attribution component scores (0.0 to 100.0)
    spatial_score = Column(Float, default=0.0, nullable=False)
    temporal_score = Column(Float, default=0.0, nullable=False)
    trajectory_score = Column(Float, default=0.0, nullable=False)
    behaviour_score = Column(Float, default=0.0, nullable=False)
    ais_score = Column(Float, default=0.0, nullable=False)

    # Weighted final suspect score (0.0 to 100.0)
    final_score = Column(Float, default=0.0, nullable=False, index=True)
    rank = Column(Integer, default=1, nullable=False, index=True)

    # Forensic explanation: supporting evidence, contradictory evidence, uncertainty narrative
    explanation = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="candidates")
    vessel = relationship("Vessel", back_populates="candidate_records")

    def __repr__(self):
        return f"<CandidateVessel Rank #{self.rank} MMSI={self.mmsi} Score={self.final_score:.1f}>"
