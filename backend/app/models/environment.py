from sqlalchemy import Column, Integer, Float, DateTime, String
from app.core.database import Base
from app.core.spatial import PostGISGeometry

class EnvironmentData(Base):
    """Ocean current and surface wind forcing vectors driving OpenDrift simulations."""
    __tablename__ = "environment_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geom = Column(PostGISGeometry("POINT", srid=4326), nullable=True)

    # Ocean current vectors (m/s)
    current_u = Column(Float, default=0.0, nullable=False)
    current_v = Column(Float, default=0.0, nullable=False)

    # Surface wind vectors at 10m (m/s)
    wind_u = Column(Float, default=0.0, nullable=False)
    wind_v = Column(Float, default=0.0, nullable=False)

    source = Column(String(32), default="ERA5", nullable=False)  # ERA5, CMEMS, HYCOM, CACHED

    def __repr__(self):
        return f"<EnvironmentData {self.timestamp} ({self.latitude:.2f}, {self.longitude:.2f}) wind=({self.wind_u},{self.wind_v})>"
