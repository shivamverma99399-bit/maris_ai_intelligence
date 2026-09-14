import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.spatial import PostGISGeometry

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class Spill(Base):
    """Geospatially characterized oil slick detected from satellite imagery."""
    __tablename__ = "spills"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    area_km2 = Column(Float, nullable=False)
    perimeter_km = Column(Float, nullable=False)
    elongation = Column(Float, default=1.0, nullable=False)
    model_version = Column(String(64), default="mock-v1", nullable=False)

    # Spatial columns (EPSG:4326)
    polygon = Column(PostGISGeometry("POLYGON", srid=4326), nullable=True)
    centroid = Column(PostGISGeometry("POINT", srid=4326), nullable=True)

    # Cached scalar coords & GeoJSON for quick querying & API serialization
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)
    polygon_geojson = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="spills")

    def __repr__(self):
        return f"<Spill #{self.id} area={self.area_km2:.2f}km2 conf={self.confidence:.2f}>"
