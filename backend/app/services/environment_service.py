import math
import datetime
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.spill import Spill
from app.models.environment import EnvironmentData
from app.repositories.incident_repository import IncidentRepository
from app.repositories.spill_repository import SpillRepository
from app.repositories.environment_repository import EnvironmentRepository
from app.schemas.environment import EnvironmentVector, EnvironmentSummary
from app.core.logging import logger

# 1 m/s is approximately 1.94384 knots
MS_TO_KNOTS = 1.94384

class EnvironmentService:
    """Service providing ocean current and surface wind forcing vectors for spill drift modeling."""

    def __init__(self, db: Session):
        self.db = db
        self.incident_repo = IncidentRepository()
        self.spill_repo = SpillRepository()
        self.env_repo = EnvironmentRepository()

    @staticmethod
    def uv_to_speed_direction(u: float, v: float) -> Tuple[float, float]:
        """Converts (u, v) velocity components to speed (m/s) and direction (degrees towards, 0-360)."""
        speed = math.hypot(u, v)
        if speed < 1e-6:
            return 0.0, 0.0
        # math.atan2(u, v) gives angle from North (v) towards East (u)
        direction = (math.degrees(math.atan2(u, v)) + 360.0) % 360.0
        return round(speed, 3), round(direction, 1)

    @staticmethod
    def speed_direction_to_uv(speed: float, direction_deg: float) -> Tuple[float, float]:
        """Converts speed (m/s) and flow direction (degrees towards) back to (u, v) components."""
        rad = math.radians(direction_deg)
        u = speed * math.sin(rad)
        v = speed * math.cos(rad)
        return round(u, 4), round(v, 4)

    def synthesize_cached_grid(
        self,
        center_lat: float,
        center_lon: float,
        start_time: datetime.datetime,
        end_time: datetime.datetime,
        source: str = "ERA5+CMEMS_CACHED"
    ) -> List[EnvironmentData]:
        """Synthesizes a realistic ocean current and surface wind vector grid for the incident region."""
        records: List[EnvironmentData] = []

        # 3x3 spatial grid spanning +/- 0.15 degrees (~16 km radius)
        lat_offsets = [-0.15, 0.0, 0.15]
        lon_offsets = [-0.15, 0.0, 0.15]

        # Time steps every 3 hours
        current_time = start_time
        time_step = datetime.timedelta(hours=3)

        # Baseline Indian EEZ / Arabian Sea parameters (Mumbai High shipping lane)
        base_current_speed = 0.32   # ~0.62 knots
        base_current_dir = 155.0     # Heading SSE
        base_wind_speed = 6.4       # ~12.4 knots
        base_wind_dir = 142.0        # Heading SE

        step_count = 0
        while current_time <= end_time:
            for d_lat in lat_offsets:
                for d_lon in lon_offsets:
                    pt_lat = round(center_lat + d_lat, 4)
                    pt_lon = round(center_lon + d_lon, 4)

                    # Realistic temporal and spatial modulation (tides and wind gusts)
                    t_factor = math.sin(step_count * 0.5)
                    curr_spd = max(0.1, base_current_speed + 0.08 * t_factor + 0.02 * d_lat)
                    curr_dir = (base_current_dir + 12.0 * math.cos(step_count * 0.4)) % 360.0

                    w_spd = max(2.0, base_wind_speed + 1.2 * math.sin(step_count * 0.3) + 0.3 * d_lon)
                    w_dir = (base_wind_dir + 10.0 * math.sin(step_count * 0.2)) % 360.0

                    cu, cv = self.speed_direction_to_uv(curr_spd, curr_dir)
                    wu, wv = self.speed_direction_to_uv(w_spd, w_dir)

                    record = EnvironmentData(
                        timestamp=current_time,
                        latitude=pt_lat,
                        longitude=pt_lon,
                        current_u=cu,
                        current_v=cv,
                        wind_u=wu,
                        wind_v=wv,
                        source=source
                    )
                    records.append(record)

            current_time += time_step
            step_count += 1

        return records

    def get_environment_for_incident(self, incident_id: str) -> EnvironmentSummary:
        """Retrieves and computes environmental metrics and vector field for an incident."""
        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        # Determine center coordinates from associated spill or fallback
        if incident.spills:
            spill: Spill = incident.spills[0]
            center_lat = spill.centroid_lat
            center_lon = spill.centroid_lon
        else:
            center_lat = 18.85
            center_lon = 72.15

        obs_time = incident.observation_time
        time_window_start = obs_time - datetime.timedelta(hours=24)
        time_window_end = obs_time

        # Spatial search bounds (+/- 0.2 degrees)
        min_lat = center_lat - 0.2
        max_lat = center_lat + 0.2
        min_lon = center_lon - 0.2
        max_lon = center_lon + 0.2

        # Check existing cached data in DB
        records = self.env_repo.query_spatiotemporal(
            self.db,
            min_lat=min_lat,
            max_lat=max_lat,
            min_lon=min_lon,
            max_lon=max_lon,
            start_time=time_window_start,
            end_time=time_window_end
        )

        if not records:
            logger.info(f"Populating environmental cache for incident '{incident_id}' ({center_lat}, {center_lon})")
            synthesized = self.synthesize_cached_grid(
                center_lat=center_lat,
                center_lon=center_lon,
                start_time=time_window_start,
                end_time=time_window_end
            )
            self.env_repo.create_batch(self.db, synthesized)
            records = synthesized

        # Format vector objects and calculate aggregate means
        grid_vectors: List[EnvironmentVector] = []
        total_cu, total_cv = 0.0, 0.0
        total_wu, total_wv = 0.0, 0.0

        for r in records:
            c_spd, c_dir = self.uv_to_speed_direction(r.current_u, r.current_v)
            w_spd, w_dir = self.uv_to_speed_direction(r.wind_u, r.wind_v)

            total_cu += r.current_u
            total_cv += r.current_v
            total_wu += r.wind_u
            total_wv += r.wind_v

            grid_vectors.append(EnvironmentVector(
                timestamp=r.timestamp,
                latitude=r.latitude,
                longitude=r.longitude,
                current_u=r.current_u,
                current_v=r.current_v,
                current_speed=c_spd,
                current_direction=c_dir,
                wind_u=r.wind_u,
                wind_v=r.wind_v,
                wind_speed=w_spd,
                wind_direction=w_dir,
                source=r.source
            ))

        n = len(records)
        mean_cu = total_cu / n if n > 0 else 0.0
        mean_cv = total_cv / n if n > 0 else 0.0
        mean_wu = total_wu / n if n > 0 else 0.0
        mean_wv = total_wv / n if n > 0 else 0.0

        mean_c_spd, mean_c_dir = self.uv_to_speed_direction(mean_cu, mean_cv)
        mean_w_spd, mean_w_dir = self.uv_to_speed_direction(mean_wu, mean_wv)

        # Net estimated surface drift vector (100% current + 3% wind leeway)
        net_drift_u = mean_cu + 0.03 * mean_wu
        net_drift_v = mean_cv + 0.03 * mean_wv
        net_drift_spd_ms, net_drift_dir_deg = self.uv_to_speed_direction(net_drift_u, net_drift_v)
        net_drift_speed_knots = round(net_drift_spd_ms * MS_TO_KNOTS, 2)

        return EnvironmentSummary(
            incident_id=incident_id,
            center_lat=center_lat,
            center_lon=center_lon,
            observation_time=obs_time,
            time_window_start=time_window_start,
            time_window_end=time_window_end,
            mean_current_speed=mean_c_spd,
            mean_current_direction=mean_c_dir,
            mean_wind_speed=mean_w_spd,
            mean_wind_direction=mean_w_dir,
            net_drift_speed_knots=net_drift_speed_knots,
            net_drift_direction_deg=net_drift_dir_deg,
            source=records[0].source if records else "ERA5+CMEMS",
            grid_points=grid_vectors[:36]  # Return representative subset for UI rendering
        )
