import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.spatial import PostGISGeometry

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class OriginEstimate(Base):
    """Reconstructed probable source distribution and estimated release time window."""
    __tablename__ = "origin_estimates"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)

    probable_origin_lat = Column(Float, nullable=False)
    probable_origin_lon = Column(Float, nullable=False)

    # Probable source region polygon / bounding cone
    origin_geom = Column(PostGISGeometry("POLYGON", srid=4326), nullable=True)
    origin_geojson = Column(JSON, nullable=True)

    # Estimated release time window
    time_window_start = Column(DateTime, nullable=False)
    time_window_end = Column(DateTime, nullable=False)

    uncertainty_radius_km = Column(Float, default=5.0, nullable=False)
    confidence = Column(Float, default=0.85, nullable=False)

    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="origin_estimates")

    def __repr__(self):
        return f"<OriginEstimate #{self.id} origin=({self.probable_origin_lat:.4f}, {self.probable_origin_lon:.4f}) conf={self.confidence:.2f}>"
