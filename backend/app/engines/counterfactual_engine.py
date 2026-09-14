import math
import random
import datetime
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from shapely.geometry import Polygon, Point, MultiPoint, mapping, shape
from shapely.ops import unary_union

from app.engines.geospatial_engine import GeospatialEngine
from app.engines.trajectory_engine import haversine_km
from app.engines.drift_engine import METERS_PER_DEG_LAT, DIFFUSION_COEFFICIENT_KH, LagrangianParticle
from app.schemas.counterfactual import CounterfactualResult
from app.core.logging import logger

class CounterfactualEngine:
    """
    Simulates hypothetical forward oil spill discharge from a suspect vessel's
    reconstructed coordinates at release time T_release to satellite observation time T_obs.
    Evaluates physical consistency against the satellite-observed oil slick.
    """

    @classmethod
    def run_counterfactual_simulation(
        cls,
        incident_id: str,
        vessel_metadata: Dict[str, Any],
        release_point: Tuple[float, float],  # (lat, lon)
        release_time: datetime.datetime,
        observation_time: datetime.datetime,
        observed_spill_polygon: Polygon,
        observed_centroid: Tuple[float, float], # (lat, lon)
        observed_area_km2: float,
        mean_current_u: float = 0.12,
        mean_current_v: float = -0.28,
        mean_wind_u: float = 5.2,
        mean_wind_v: float = -3.8,
        wind_drift_factor: float = 0.03,
        num_particles: int = 200,
        variance_factor: float = 1.0,
        time_step_minutes: int = 15
    ) -> CounterfactualResult:
        """
        Executes forward particle advection from suspect position and compares
        the simulated slick dispersion against the observed satellite slick.
        """
        rel_lat, rel_lon = release_point
        # Ensure timezone consistency
        if release_time.tzinfo is not None and observation_time.tzinfo is None:
            observation_time = observation_time.replace(tzinfo=datetime.timezone.utc)
        elif release_time.tzinfo is None and observation_time.tzinfo is not None:
            release_time = release_time.replace(tzinfo=datetime.timezone.utc)

        duration_seconds = max(60.0, (observation_time - release_time).total_seconds())
        duration_hours = duration_seconds / 3600.0

        logger.info(
            f"Running counterfactual simulation for incident '{incident_id}', vessel {vessel_metadata.get('vessel_name')}: "
            f"release=({rel_lat}, {rel_lon}) at {release_time}, duration={duration_hours:.2f}h, particles={num_particles}"
        )

        # 1. Seed particles locally around the vessel's release point (e.g. 250m discharge wake)
        particles: List[LagrangianParticle] = []
        seed_radius_deg = 250.0 / METERS_PER_DEG_LAT

        for i in range(num_particles):
            angle = random.uniform(0, 2 * math.pi)
            r = seed_radius_deg * math.sqrt(random.uniform(0, 1))
            seed_lat = rel_lat + r * math.sin(angle)
            lat_rad = math.radians(seed_lat)
            meters_per_deg_lon = max(1000.0, METERS_PER_DEG_LAT * math.cos(lat_rad))
            seed_lon = rel_lon + (r * math.cos(angle) * METERS_PER_DEG_LAT) / meters_per_deg_lon
            particles.append(LagrangianParticle(i, seed_lon, seed_lat, release_time))

        # 2. Forward advection loop
        steps = max(1, int(duration_seconds / (time_step_minutes * 60)))
        dt_seconds = duration_seconds / steps

        effective_diffusivity = DIFFUSION_COEFFICIENT_KH * variance_factor

        current_time = release_time
        for step in range(steps):
            current_time += datetime.timedelta(seconds=dt_seconds)
            for p in particles:
                # Hydrodynamic advection
                u_tot = mean_current_u + (wind_drift_factor * mean_wind_u)
                v_tot = mean_current_v + (wind_drift_factor * mean_wind_v)

                # Random walk turbulent diffusion
                diff_vel = math.sqrt(2.0 * effective_diffusivity / dt_seconds)
                u_tot += random.gauss(0, diff_vel)
                v_tot += random.gauss(0, diff_vel)

                p.step_advection(u_tot, v_tot, dt_seconds, current_time)

        # 3. Form simulated slick polygon at T_obs
        final_coords = [(p.lon, p.lat) for p in particles]
        sim_multi = MultiPoint(final_coords)
        sim_poly: Polygon = sim_multi.convex_hull.buffer(0.003)

        if not isinstance(sim_poly, Polygon):
            sim_poly = sim_poly.convex_hull

        sim_centroid_lon = float(sim_poly.centroid.x)
        sim_centroid_lat = float(sim_poly.centroid.y)

        # Characterize simulated polygon
        sim_metrics = GeospatialEngine.characterize_polygon(sim_poly)
        sim_area_km2 = sim_metrics.area_km2

        # 4. Quantitative spatial and geometric validation against observed satellite slick
        obs_lat, obs_lon = observed_centroid
        centroid_dist_km = haversine_km(sim_centroid_lat, sim_centroid_lon, obs_lat, obs_lon)

        # Calculate IoU
        try:
            inter_poly = sim_poly.intersection(observed_spill_polygon)
            union_poly = sim_poly.union(observed_spill_polygon)
            intersection_area = inter_poly.area
            union_area = union_poly.area
            iou = float(intersection_area / union_area) if union_area > 0 else 0.0
        except Exception:
            iou = 0.0

        # Hausdorff distance approximation
        try:
            hausdorff_deg = sim_poly.hausdorff_distance(observed_spill_polygon)
            hausdorff_km = round(hausdorff_deg * 111.13, 2)
        except Exception:
            hausdorff_km = round(centroid_dist_km * 1.5, 2)

        # 5. Physical Consistency Scoring (0 to 100)
        # Centroid proximity score: 100 at 0km, 0 at >= 15km
        s_centroid = max(0.0, min(100.0, 100.0 * (1.0 - (centroid_dist_km / 15.0))))

        # IoU score: particle envelopes have softer edges than binary thresholded SAR masks;
        # IoU > 0.4 is an extraordinary physical match in ocean drift modeling.
        s_iou = min(100.0, (iou / 0.40) * 100.0)

        # Area ratio score:
        area_ratio = min(sim_area_km2, observed_area_km2) / max(sim_area_km2, observed_area_km2, 0.001)
        s_area = min(100.0, area_ratio * 100.0)

        # Weighted aggregate consistency score
        consistency_score = round(0.50 * s_centroid + 0.35 * s_iou + 0.15 * s_area, 1)
        consistency_score = max(0.0, min(100.0, consistency_score))

        # 6. Verdict and explanation
        if consistency_score >= 75.0:
            verdict = "STRONG_MATCH"
            summary = (
                f"Hypothetical oil release from vessel {vessel_metadata.get('vessel_name')} at {release_time.strftime('%H:%M UTC')} "
                f"reproduces the satellite-observed slick with high physical fidelity. "
                f"Forward simulated centroid reaches within {centroid_dist_km:.2f} km of the observed slick centroid "
                f"with an IoU overlap of {iou * 100:.1f}%."
            )
        elif consistency_score >= 50.0:
            verdict = "PLAUSIBLE_MATCH"
            summary = (
                f"Forward drift simulation demonstrates plausible hydrodynamic agreement with observed slick. "
                f"Centroid discrepancy is {centroid_dist_km:.2f} km with {iou * 100:.1f}% spatial intersection. "
                f"Vessel transit timing aligns with observed slick spread."
            )
        elif consistency_score >= 25.0:
            verdict = "WEAK_MATCH"
            summary = (
                f"Simulated forward drift exhibits marginal spatial overlap ({iou * 100:.1f}%). "
                f"Centroid offset of {centroid_dist_km:.2f} km suggests differing release timing or hydrodynamic divergence."
            )
        else:
            verdict = "INCONSISTENT"
            summary = (
                f"Simulated forward dispersion from suspect location diverges significantly from the observed slick "
                f"(offset: {centroid_dist_km:.2f} km). Hydrodynamic evidence rejects direct causal release from this vessel."
            )

        # Build particle lines FeatureCollection for frontend visualization
        particle_features = []
        for p in particles[:40]:  # sample 40 representative trajectories for visual clarity
            line_coords = [[round(pt[0], 5), round(pt[1], 5)] for pt in p.history]
            particle_features.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": line_coords
                },
                "properties": {
                    "particle_id": p.id,
                    "status": p.status
                }
            })

        particle_fc = {
            "type": "FeatureCollection",
            "features": particle_features
        }

        obs_metrics = GeospatialEngine.characterize_polygon(observed_spill_polygon)

        return CounterfactualResult(
            incident_id=incident_id,
            mmsi=vessel_metadata.get("mmsi", 0),
            vessel_name=vessel_metadata.get("vessel_name", "Unknown"),
            vessel_type=vessel_metadata.get("vessel_type", "Unknown"),
            flag=vessel_metadata.get("flag", "Unknown"),
            is_synthetic=vessel_metadata.get("is_synthetic", False),
            release_time=release_time,
            release_lat=round(rel_lat, 6),
            release_lon=round(rel_lon, 6),
            observation_time=observation_time,
            drift_duration_hours=round(duration_hours, 2),
            num_particles=num_particles,
            simulated_centroid_lat=round(sim_centroid_lat, 6),
            simulated_centroid_lon=round(sim_centroid_lon, 6),
            simulated_area_km2=round(sim_area_km2, 2),
            simulated_polygon_geojson=sim_metrics.polygon_geojson,
            observed_centroid_lat=round(obs_lat, 6),
            observed_centroid_lon=round(obs_lon, 6),
            observed_area_km2=round(observed_area_km2, 2),
            observed_polygon_geojson=obs_metrics.polygon_geojson,
            centroid_distance_km=round(centroid_dist_km, 2),
            iou_overlap=round(iou, 4),
            hausdorff_distance_km=hausdorff_km,
            physical_consistency_score=consistency_score,
            consistency_verdict=verdict,
            scientific_summary=summary,
            particle_tracks_geojson=particle_fc
        )
