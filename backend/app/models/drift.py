import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class DriftSimulation(Base):
    """OpenDrift particle simulation run (backward hindcast or forward forecast)."""
    __tablename__ = "drift_simulations"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    simulation_type = Column(String(32), nullable=False)  # BACKWARD, FORWARD, COUNTERFACTUAL
    status = Column(String(32), default="COMPLETED", nullable=False)  # PENDING, RUNNING, COMPLETED, FAILED

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    num_particles = Column(Integer, default=500, nullable=False)

    # Particle trajectory history and summary polygons stored in GeoJSON format
    trajectories_geojson = Column(JSON, nullable=True)
    uncertainty_metadata = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="drift_simulations")

    def __repr__(self):
        return f"<DriftSimulation #{self.id} type={self.simulation_type} status={self.status}>"
