import math
import random
import datetime
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from shapely.geometry import Polygon, MultiPoint, Point, mapping
from pydantic import BaseModel, Field

# Constants for degree to meter conversion on WGS84
METERS_PER_DEG_LAT = 111132.954  # meters per degree latitude
DIFFUSION_COEFFICIENT_KH = 1.0     # Horizontal eddy diffusivity (m^2/s)

class ParticleState(BaseModel):
    """Snapshot of a drifting oil particle."""
    id: int
    lon: float
    lat: float
    status: str = "active"

class DriftForecastSnapshot(BaseModel):
    """Time-slice of simulated slick spread (forward forecast or backward hindcast)."""
    timestep_hours: float
    timestamp: datetime.datetime
    particle_count: int
    centroid_lat: float
    centroid_lon: float
    bounding_polygon_geojson: Optional[Dict[str, Any]] = None

class DriftSimulationResult(BaseModel):
    """Comprehensive output payload of an oil spill drift simulation run."""
    simulation_type: str  # FORWARD, BACKWARD, COUNTERFACTUAL
    start_time: datetime.datetime
    end_time: datetime.datetime
    num_particles: int
    duration_hours: float
    trajectories_geojson: Dict[str, Any]  # GeoJSON FeatureCollection of particle lines
    snapshots: List[DriftForecastSnapshot]
    uncertainty_metadata: Dict[str, Any]

class LagrangianParticle:
    """Represents an individual oil particle tracked in the Lagrangian drift model."""

    def __init__(self, particle_id: int, initial_lon: float, initial_lat: float, initial_time: datetime.datetime):
        self.id = particle_id
        self.lon = initial_lon
        self.lat = initial_lat
        self.status = "active"
        self.history: List[Tuple[float, float, datetime.datetime]] = [(initial_lon, initial_lat, initial_time)]

    def step_advection(
        self,
        u_total_ms: float,
        v_total_ms: float,
        dt_seconds: float,
        current_time: datetime.datetime
    ):
        """Advances the particle position by advection and turbulent diffusion."""
        if self.status != "active":
            return

        # Meters per degree longitude at current latitude
        lat_rad = math.radians(self.lat)
        meters_per_deg_lon = max(1000.0, METERS_PER_DEG_LAT * math.cos(lat_rad))

        # Coordinate displacement
        d_lon = (u_total_ms * dt_seconds) / meters_per_deg_lon
        d_lat = (v_total_ms * dt_seconds) / METERS_PER_DEG_LAT

        self.lon = round(self.lon + d_lon, 6)
        self.lat = round(self.lat + d_lat, 6)
        self.history.append((self.lon, self.lat, current_time))

class DriftEngine:
    """Lagrangian oil drift simulation engine implementing forward forecasting and backward hindcasting."""

    @staticmethod
    def seed_particles_in_polygon(polygon: Polygon, num_particles: int) -> List[Tuple[float, float]]:
        """Seeds particles uniformly across the interior of a georeferenced spill polygon."""
        if polygon.is_empty:
            return []

        minx, miny, maxx, maxy = polygon.bounds
        seeded: List[Tuple[float, float]] = []

        attempts = 0
        max_attempts = num_particles * 20
        while len(seeded) < num_particles and attempts < max_attempts:
            rx = random.uniform(minx, maxx)
            ry = random.uniform(miny, maxy)
            pt = Point(rx, ry)
            if polygon.contains(pt):
                seeded.append((round(rx, 6), round(ry, 6)))
            attempts += 1

        # Fallback perturbation around centroid if polygon is very narrow or irregular
        centroid = polygon.centroid
        while len(seeded) < num_particles:
            dx = random.gauss(0, 0.001)
            dy = random.gauss(0, 0.001)
            seeded.append((round(centroid.x + dx, 6), round(centroid.y + dy, 6)))

        return seeded

    @classmethod
    def run_forward_simulation(
        cls,
        spill_polygon: Polygon,
        start_time: datetime.datetime,
        duration_hours: int = 24,
        time_step_minutes: int = 30,
        num_particles: int = 150,
        mean_current_u: float = 0.12,
        mean_current_v: float = -0.28,
        mean_wind_u: float = 5.2,
        mean_wind_v: float = -3.8,
        wind_drift_factor: float = 0.03
    ) -> DriftSimulationResult:
        """Executes forward Lagrangian oil drift simulation over the forecast horizon."""
        seeded_coords = cls.seed_particles_in_polygon(spill_polygon, num_particles)
        particles: List[LagrangianParticle] = [
            LagrangianParticle(idx, lon, lat, start_time)
            for idx, (lon, lat) in enumerate(seeded_coords)
        ]

        total_steps = int((duration_hours * 60) / time_step_minutes)
        dt_seconds = time_step_minutes * 60.0

        snapshot_interval_steps = max(1, int(6 * 60 / time_step_minutes))
        snapshots: List[DriftForecastSnapshot] = []

        sigma_diff = math.sqrt(2.0 * DIFFUSION_COEFFICIENT_KH / dt_seconds)

        det_u = mean_current_u + wind_drift_factor * mean_wind_u
        det_v = mean_current_v + wind_drift_factor * mean_wind_v

        current_time = start_time
        for step in range(1, total_steps + 1):
            current_time += datetime.timedelta(minutes=time_step_minutes)

            for p in particles:
                u_turb = random.gauss(0, sigma_diff)
                v_turb = random.gauss(0, sigma_diff)
                p.step_advection(
                    u_total_ms=det_u + u_turb,
                    v_total_ms=det_v + v_turb,
                    dt_seconds=dt_seconds,
                    current_time=current_time
                )

            if step % snapshot_interval_steps == 0 or step == total_steps:
                hrs = (step * time_step_minutes) / 60.0
                pts = [(p.lon, p.lat) for p in particles]
                c_lon = sum(x[0] for x in pts) / len(pts)
                c_lat = sum(x[1] for x in pts) / len(pts)

                mp = MultiPoint(pts)
                hull = mp.convex_hull
                if not isinstance(hull, Polygon) or hull.area == 0:
                    hull = hull.buffer(0.005)

                snapshots.append(DriftForecastSnapshot(
                    timestep_hours=hrs,
                    timestamp=current_time,
                    particle_count=len(particles),
                    centroid_lat=round(c_lat, 6),
                    centroid_lon=round(c_lon, 6),
                    bounding_polygon_geojson=mapping(hull)
                ))

        features: List[Dict[str, Any]] = []
        for p in particles:
            line_coords = [[lon, lat] for lon, lat, _ in p.history]
            features.append({
                "type": "Feature",
                "properties": {
                    "particle_id": p.id,
                    "status": p.status,
                    "start_time": start_time.isoformat(),
                    "end_time": current_time.isoformat()
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": line_coords
                }
            })

        uncertainty_metadata = {
            "wind_leeway_factor": wind_drift_factor,
            "horizontal_diffusivity_m2s": DIFFUSION_COEFFICIENT_KH,
            "time_step_minutes": time_step_minutes,
            "deterministic_velocity_ms": {"u": round(det_u, 4), "v": round(det_v, 4)},
            "dispersion_confidence": 0.85,
            "assumptions": [
                "Lagrangian particle forward advection under regional forcing.",
                "Surface leeway coefficient fixed at standard 3% of 10m wind vector.",
                "Horizontal eddy diffusion modeled via random walk with Kh = 1.0 m^2/s."
            ]
        }

        return DriftSimulationResult(
            simulation_type="FORWARD",
            start_time=start_time,
            end_time=current_time,
            num_particles=num_particles,
            duration_hours=float(duration_hours),
            trajectories_geojson={"type": "FeatureCollection", "features": features},
            snapshots=snapshots,
            uncertainty_metadata=uncertainty_metadata
        )

    @classmethod
    def run_backward_hindcast(
        cls,
        observed_polygon: Polygon,
        observation_time: datetime.datetime,
        hindcast_hours: int = 24,
        time_step_minutes: int = 30,
        num_particles: int = 150,
        mean_current_u: float = 0.12,
        mean_current_v: float = -0.28,
        mean_wind_u: float = 5.2,
        mean_wind_v: float = -3.8,
        wind_drift_factor: float = 0.03
    ) -> DriftSimulationResult:
        """Executes backward Lagrangian oil drift hindcast (backtracking in time).
        
        Reverse Physics Formulation:
            Backtracking reverses the advection velocity vectors:
            V_backtrack = -1.0 * (V_current + 0.03 * V_wind) + V_diffusion
            As time regresses into the past, the particle cluster naturally expands,
            forming an uncertainty probability cone / probable source distribution.
        """
        seeded_coords = cls.seed_particles_in_polygon(observed_polygon, num_particles)
        particles: List[LagrangianParticle] = [
            LagrangianParticle(idx, lon, lat, observation_time)
            for idx, (lon, lat) in enumerate(seeded_coords)
        ]

        total_steps = int((hindcast_hours * 60) / time_step_minutes)
        dt_seconds = time_step_minutes * 60.0

        snapshot_interval_steps = max(1, int(6 * 60 / time_step_minutes))
        snapshots: List[DriftForecastSnapshot] = []

        # Turbulent diffusion standard deviation
        sigma_diff = math.sqrt(2.0 * DIFFUSION_COEFFICIENT_KH / dt_seconds)

        # Inverted deterministic velocity for reverse advection
        rev_u = -1.0 * (mean_current_u + wind_drift_factor * mean_wind_u)
        rev_v = -1.0 * (mean_current_v + wind_drift_factor * mean_wind_v)

        current_time = observation_time
        for step in range(1, total_steps + 1):
            # Step backward in time
            current_time -= datetime.timedelta(minutes=time_step_minutes)

            for p in particles:
                u_turb = random.gauss(0, sigma_diff)
                v_turb = random.gauss(0, sigma_diff)
                p.step_advection(
                    u_total_ms=rev_u + u_turb,
                    v_total_ms=rev_v + v_turb,
                    dt_seconds=dt_seconds,
                    current_time=current_time
                )

            if step % snapshot_interval_steps == 0 or step == total_steps:
                hrs_back = (step * time_step_minutes) / 60.0
                pts = [(p.lon, p.lat) for p in particles]
                c_lon = sum(x[0] for x in pts) / len(pts)
                c_lat = sum(x[1] for x in pts) / len(pts)

                mp = MultiPoint(pts)
                hull = mp.convex_hull
                if not isinstance(hull, Polygon) or hull.area == 0:
                    hull = hull.buffer(0.008)

                snapshots.append(DriftForecastSnapshot(
                    timestep_hours=-hrs_back,
                    timestamp=current_time,
                    particle_count=len(particles),
                    centroid_lat=round(c_lat, 6),
                    centroid_lon=round(c_lon, 6),
                    bounding_polygon_geojson=mapping(hull)
                ))

        # Build reverse trajectories GeoJSON FeatureCollection
        features: List[Dict[str, Any]] = []
        for p in particles:
            line_coords = [[lon, lat] for lon, lat, _ in p.history]
            features.append({
                "type": "Feature",
                "properties": {
                    "particle_id": p.id,
                    "status": p.status,
                    "observation_time": observation_time.isoformat(),
                    "hindcast_origin_time": current_time.isoformat()
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": line_coords
                }
            })

        uncertainty_metadata = {
            "wind_leeway_factor": wind_drift_factor,
            "horizontal_diffusivity_m2s": DIFFUSION_COEFFICIENT_KH,
            "time_step_minutes": time_step_minutes,
            "reverse_velocity_ms": {"u": round(rev_u, 4), "v": round(rev_v, 4)},
            "hindcast_confidence": 0.82,
            "assumptions": [
                "Lagrangian reverse particle trajectory advection driven by inverted vector forcing.",
                "Particle cluster dispersion represents expanding probabilistic release origin envelope.",
                "Oceanic turbulence produces growing uncertainty backwards in time."
            ]
        }

        return DriftSimulationResult(
            simulation_type="BACKWARD",
            start_time=current_time,  # Earliest reconstructed time in the past
            end_time=observation_time, # Observation time
            num_particles=num_particles,
            duration_hours=float(hindcast_hours),
            trajectories_geojson={"type": "FeatureCollection", "features": features},
            snapshots=snapshots,
            uncertainty_metadata=uncertainty_metadata
        )
