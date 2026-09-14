import datetime
from typing import List, Dict, Any, Optional
from shapely.geometry import shape, Point, LineString, Polygon
from app.core.logging import logger
from app.engines.trajectory_engine import haversine_km
from app.schemas.ais import VesselTrajectoryResponse
from app.models.origin import OriginEstimate

class CandidateFilterResult:
    """Forensic spatiotemporal intersection result for a candidate suspect vessel."""

    def __init__(
        self,
        mmsi: int,
        vessel_name: str,
        vessel_type: str,
        flag: str,
        is_synthetic: bool,
        min_distance_km: float,
        closest_approach_time: Optional[datetime.datetime],
        speed_at_cpa_knots: float,
        temporal_overlap_minutes: float,
        duration_in_zone_minutes: float,
        intersects_polygon: bool,
        intersects_window: bool,
        has_anomalous_gaps: bool,
        is_qualified: bool,
        qualification_reason: str,
        points_in_window_count: int
    ):
        self.mmsi = mmsi
        self.vessel_name = vessel_name
        self.vessel_type = vessel_type
        self.flag = flag
        self.is_synthetic = is_synthetic
        self.min_distance_km = min_distance_km
        self.closest_approach_time = closest_approach_time
        self.speed_at_cpa_knots = speed_at_cpa_knots
        self.temporal_overlap_minutes = temporal_overlap_minutes
        self.duration_in_zone_minutes = duration_in_zone_minutes
        self.intersects_polygon = intersects_polygon
        self.intersects_window = intersects_window
        self.has_anomalous_gaps = has_anomalous_gaps
        self.is_qualified = is_qualified
        self.qualification_reason = qualification_reason
        self.points_in_window_count = points_in_window_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mmsi": self.mmsi,
            "vessel_name": self.vessel_name,
            "vessel_type": self.vessel_type,
            "flag": self.flag,
            "is_synthetic": self.is_synthetic,
            "min_distance_km": round(self.min_distance_km, 2),
            "closest_approach_time": self.closest_approach_time.isoformat() if self.closest_approach_time else None,
            "speed_at_cpa_knots": round(self.speed_at_cpa_knots, 2),
            "temporal_overlap_minutes": round(self.temporal_overlap_minutes, 1),
            "duration_in_zone_minutes": round(self.duration_in_zone_minutes, 1),
            "intersects_polygon": self.intersects_polygon,
            "intersects_window": self.intersects_window,
            "has_anomalous_gaps": self.has_anomalous_gaps,
            "is_qualified": self.is_qualified,
            "qualification_reason": self.qualification_reason,
            "points_in_window_count": self.points_in_window_count
        }

class CandidateFilterEngine:
    """Spatiotemporal filtering engine qualifying suspect vessels against probable origin distributions."""

    @classmethod
    def filter_candidates(
        cls,
        origin: OriginEstimate,
        trajectories: List[VesselTrajectoryResponse],
        spatial_buffer_km: float = 5.0,
        temporal_buffer_hours: float = 2.0
    ) -> List[CandidateFilterResult]:
        """Filters vessels from background maritime traffic intersecting the origin cone within the release window."""
        results: List[CandidateFilterResult] = []

        # Parse origin geometry
        try:
            origin_geom = shape(origin.origin_geojson) if origin.origin_geojson else None
        except Exception:
            origin_geom = None

        origin_lat = origin.probable_origin_lat
        origin_lon = origin.probable_origin_lon
        effective_radius_km = origin.uncertainty_radius_km + spatial_buffer_km

        window_start = origin.time_window_start
        window_end = origin.time_window_end
        if window_start.tzinfo is None:
            window_start = window_start.replace(tzinfo=datetime.timezone.utc)
        if window_end.tzinfo is None:
            window_end = window_end.replace(tzinfo=datetime.timezone.utc)

        t_start_buf = window_start - datetime.timedelta(hours=temporal_buffer_hours)
        t_end_buf = window_end + datetime.timedelta(hours=temporal_buffer_hours)

        for traj in trajectories:
            if not traj.points:
                continue

            # 1. Spatial proximity metrics
            min_dist = float("inf")
            cpa_point = None
            points_in_poly = 0
            points_in_window = 0
            points_in_zone_and_window = 0

            for p in traj.points:
                pt_ts = p.timestamp
                if pt_ts.tzinfo is None:
                    pt_ts = pt_ts.replace(tzinfo=datetime.timezone.utc)

                d = haversine_km(p.latitude, p.longitude, origin_lat, origin_lon)
                if d < min_dist:
                    min_dist = d
                    cpa_point = p

                is_in_poly = False
                if origin_geom and origin_geom.is_valid:
                    try:
                        is_in_poly = origin_geom.contains(Point(p.longitude, p.latitude))
                    except Exception:
                        is_in_poly = False

                if is_in_poly:
                    points_in_poly += 1

                is_in_time = (t_start_buf <= pt_ts <= t_end_buf)
                if is_in_time:
                    points_in_window += 1
                    if d <= effective_radius_km:
                        points_in_zone_and_window += 1

            # LineString spatial intersection with origin polygon
            intersects_poly = points_in_poly > 0
            if not intersects_poly and origin_geom and len(traj.points) >= 2:
                try:
                    coords = [[p.longitude, p.latitude] for p in traj.points]
                    line = LineString(coords)
                    intersects_poly = line.intersects(origin_geom)
                except Exception:
                    intersects_poly = False

            intersects_window = points_in_window > 0
            cpa_time = cpa_point.timestamp if cpa_point else None
            speed_at_cpa = cpa_point.sog if cpa_point else 0.0

            # Duration and overlap estimation
            step_minutes = 10.0  # nominal step
            duration_in_zone = points_in_zone_and_window * step_minutes
            overlap_minutes = points_in_window * step_minutes

            # Check whether closest approach occurred during release window
            cpa_in_window = False
            if cpa_time:
                cpa_tz = cpa_time.replace(tzinfo=datetime.timezone.utc) if cpa_time.tzinfo is None else cpa_time
                cpa_in_window = (t_start_buf <= cpa_tz <= t_end_buf)

            # Qualification decision
            # Qualified if minimum distance is within effective buffer AND temporal window overlaps
            is_qualified = (min_dist <= effective_radius_km) and (intersects_window or cpa_in_window)

            reasons = []
            if is_qualified:
                reasons.append(f"Approached within {min_dist:.1f} km of probable origin (threshold: {effective_radius_km:.1f} km)")
                if cpa_in_window:
                    reasons.append(f"Closest point of approach occurred within release window ({cpa_time.strftime('%H:%M UTC') if cpa_time else 'N/A'})")
                if speed_at_cpa <= 6.0:
                    reasons.append(f"Low speed / loitering behavior near origin ({speed_at_cpa:.1f} kt)")
                if traj.has_anomalous_gaps:
                    reasons.append("Exhibited AIS transmitter blackout near or during the release window")
                if intersects_poly:
                    reasons.append("Directly traversed the probable source release polygon")
                qual_reason = "; ".join(reasons)
            else:
                if min_dist > effective_radius_km:
                    qual_reason = f"Passed outside origin spatial buffer ({min_dist:.1f} km > {effective_radius_km:.1f} km)"
                else:
                    qual_reason = "Transit timestamps do not overlap with estimated spill release window"

            res = CandidateFilterResult(
                mmsi=traj.mmsi,
                vessel_name=traj.vessel_name,
                vessel_type=traj.vessel_type,
                flag=traj.flag,
                is_synthetic=traj.is_synthetic,
                min_distance_km=min_dist,
                closest_approach_time=cpa_time,
                speed_at_cpa_knots=speed_at_cpa,
                temporal_overlap_minutes=overlap_minutes,
                duration_in_zone_minutes=duration_in_zone,
                intersects_polygon=intersects_poly,
                intersects_window=intersects_window,
                has_anomalous_gaps=traj.has_anomalous_gaps,
                is_qualified=is_qualified,
                qualification_reason=qual_reason,
                points_in_window_count=points_in_window
            )
            results.append(res)

        # Sort: qualified first, then by minimum distance ascending
        results.sort(key=lambda r: (not r.is_qualified, r.min_distance_km))
        return results
