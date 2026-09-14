from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Vessel(Base):
    """Maritime vessel profile tracked via AIS."""
    __tablename__ = "vessels"

    id = Column(Integer, primary_key=True, index=True)
    mmsi = Column(Integer, unique=True, index=True, nullable=False)
    imo = Column(String(32), nullable=True, index=True)
    vessel_name = Column(String(128), default="Unknown Vessel", nullable=False)
    vessel_type = Column(String(64), default="Unknown", nullable=False)  # e.g., Oil Tanker, Cargo, Container
    flag = Column(String(32), default="Unknown", nullable=False)
    is_synthetic = Column(Boolean, default=False, nullable=False)

    # Relationships
    positions = relationship("AisPosition", back_populates="vessel", cascade="all, delete-orphan")
    candidate_records = relationship("CandidateVessel", back_populates="vessel")

    def __repr__(self):
        return f"<Vessel {self.vessel_name} (MMSI: {self.mmsi})>"
