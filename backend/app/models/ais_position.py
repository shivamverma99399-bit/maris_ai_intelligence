from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.spatial import PostGISGeometry

class AisPosition(Base):
    """Spatiotemporal AIS position ping for maritime traffic trajectory reconstruction."""
    __tablename__ = "ais_positions"

    id = Column(Integer, primary_key=True, index=True)
    mmsi = Column(Integer, index=True, nullable=False)
    vessel_id = Column(Integer, ForeignKey("vessels.id", ondelete="SET NULL"), nullable=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geom = Column(PostGISGeometry("POINT", srid=4326), nullable=True)

    sog = Column(Float, default=0.0, nullable=False)  # Speed Over Ground (knots)
    cog = Column(Float, default=0.0, nullable=False)  # Course Over Ground (degrees)
    heading = Column(Float, default=0.0, nullable=False)
    nav_status = Column(Integer, default=0, nullable=False)
    is_synthetic = Column(Boolean, default=False, nullable=False)

    # Relationships
    vessel = relationship("Vessel", back_populates="positions")

    def __repr__(self):
        return f"<AisPosition MMSI={self.mmsi} @ {self.timestamp} ({self.latitude:.4f}, {self.longitude:.4f})>"
