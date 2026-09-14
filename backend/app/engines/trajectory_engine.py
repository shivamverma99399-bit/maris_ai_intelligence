import math
import datetime
from typing import List, Dict, Any, Optional, Tuple
from app.core.logging import logger
from app.schemas.ais import (
    AisGapResponse, TrajectoryPointResponse, VesselTrajectoryResponse
)

EARTH_RADIUS_KM = 6371.0088

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two coordinates in kilometers."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    return 2.0 * EARTH_RADIUS_KM * math.asin(math.sqrt(min(1.0, a)))

def interpolate_angle(deg1: float, deg2: float, fraction: float) -> float:
    """Interpolates between two heading/course angles across the circular 0-360 boundary."""
    diff = (deg2 - deg1 + 180.0) % 360.0 - 180.0
    return (deg1 + diff * fraction) % 360.0

class TrajectoryEngine:
    """Kinematic engine segmenting, reconstructing, and interpolating continuous maritime trajectories."""

    @classmethod
    def reconstruct_vessel_trajectory(
        cls,
        pings: List[Any],
        vessel_info: Optional[Dict[str, Any]] = None,
        step_minutes: int = 10,
        gap_threshold_hours: float = 1.0
    ) -> VesselTrajectoryResponse:
        """Reconstructs continuous trajectory for an individual vessel with kinematic interpolation and gap analysis."""
        if not pings:
            raise ValueError("Cannot reconstruct trajectory from empty ping list.")

        # Extract vessel metadata
        first_p = pings[0]
        mmsi = getattr(first_p, "mmsi", None) or (first_p.get("mmsi") if isinstance(first_p, dict) else 0)
        vessel_obj = getattr(first_p, "vessel", None)

        vessel_name = f"Vessel-{mmsi}"
        vessel_type = "Unknown"
        flag = "Unknown"
        is_synthetic = False

        if vessel_info:
            vessel_name = vessel_info.get("vessel_name") or vessel_name
            vessel_type = vessel_info.get("vessel_type") or vessel_type
            flag = vessel_info.get("flag") or flag
            is_synthetic = bool(vessel_info.get("is_synthetic", False))
        elif vessel_obj:
            vessel_name = getattr(vessel_obj, "vessel_name", None) or vessel_name
            vessel_type = getattr(vessel_obj, "vessel_type", None) or vessel_type
            flag = getattr(vessel_obj, "flag", None) or flag
            is_synthetic = bool(getattr(vessel_obj, "is_synthetic", False))
        elif isinstance(first_p, dict):
            vessel_name = first_p.get("vessel_name") or vessel_name
            vessel_type = first_p.get("vessel_type") or vessel_type
            flag = first_p.get("flag") or flag
            is_synthetic = bool(first_p.get("is_synthetic", False))
        else:
            vessel_name = getattr(first_p, "vessel_name", None) or vessel_name
            vessel_type = getattr(first_p, "vessel_type", None) or vessel_type
            flag = getattr(first_p, "flag", None) or flag
            is_synthetic = bool(getattr(first_p, "is_synthetic", False))

        # Normalize pings into list of dicts
        norm_pings = []
        for p in pings:
            ts = getattr(p, "timestamp", None) or p.get("timestamp")
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=datetime.timezone.utc)
            lat = float(getattr(p, "latitude", None) if hasattr(p, "latitude") else p.get("latitude"))
            lon = float(getattr(p, "longitude", None) if hasattr(p, "longitude") else p.get("longitude"))
            sog = float(getattr(p, "sog", None) if hasattr(p, "sog") else p.get("sog", 0.0))
            cog = float(getattr(p, "cog", None) if hasattr(p, "cog") else p.get("cog", 0.0))
            heading = float(getattr(p, "heading", None) if hasattr(p, "heading") else p.get("heading", cog))
            norm_pings.append({
                "timestamp": ts,
                "latitude": lat,
                "longitude": lon,
                "sog": sog,
                "cog": cog,
                "heading": heading
            })

        # Sort chronologically and deduplicate timestamps
        norm_pings.sort(key=lambda x: x["timestamp"])
        unique_pings = []
        seen_ts = set()
        for p in norm_pings:
            if p["timestamp"] not in seen_ts:
                seen_ts.add(p["timestamp"])
                unique_pings.append(p)

        norm_pings = unique_pings

        # Interpolate and analyze gaps
        out_points: List[TrajectoryPointResponse] = []
        detected_gaps: List[AisGapResponse] = []
        total_distance = 0.0
        speeds = []

        for i in range(len(norm_pings)):
            curr = norm_pings[i]
            speeds.append(curr["sog"])

            # Append current real waypoint
            out_points.append(TrajectoryPointResponse(
                timestamp=curr["timestamp"],
                latitude=curr["latitude"],
                longitude=curr["longitude"],
                sog=curr["sog"],
                cog=curr["cog"],
                heading=curr["heading"],
                is_interpolated=False,
                in_gap=False
            ))

            if i < len(norm_pings) - 1:
                nxt = norm_pings[i + 1]
                dt_seconds = (nxt["timestamp"] - curr["timestamp"]).total_seconds()
                if dt_seconds <= 0:
                    continue

                dist_km = haversine_km(
                    curr["latitude"], curr["longitude"],
                    nxt["latitude"], nxt["longitude"]
                )
                total_distance += dist_km

                duration_hours = dt_seconds / 3600.0
                is_gap = duration_hours >= gap_threshold_hours

                if is_gap:
                    # Suspected intentional blackout: gap > 1.5 hours and distance > 5 km
                    suspected = duration_hours >= 1.5 and dist_km >= 5.0
                    gap_record = AisGapResponse(
                        start_time=curr["timestamp"],
                        end_time=nxt["timestamp"],
                        duration_hours=round(duration_hours, 2),
                        start_lat=curr["latitude"],
                        start_lon=curr["longitude"],
                        end_lat=nxt["latitude"],
                        end_lon=nxt["longitude"],
                        distance_km=round(dist_km, 2),
                        suspected_blackout=suspected,
                        description=(
                            f"AIS signal lost for {duration_hours:.1f}h ({dist_km:.1f} km traversal). "
                            + ("Suspected intentional transmitter deactivation." if suspected else "Standard transmission latency.")
                        )
                    )
                    detected_gaps.append(gap_record)

                # Kinematic interpolation
                step_sec = step_minutes * 60
                if dt_seconds > step_sec:
                    num_steps = int((dt_seconds - 1) // step_sec)
                    for s in range(1, num_steps + 1):
                        frac = (s * step_sec) / dt_seconds
                        interp_ts = curr["timestamp"] + datetime.timedelta(seconds=s * step_sec)
                        interp_lat = curr["latitude"] + frac * (nxt["latitude"] - curr["latitude"])
                        interp_lon = curr["longitude"] + frac * (nxt["longitude"] - curr["longitude"])
                        interp_sog = curr["sog"] + frac * (nxt["sog"] - curr["sog"])
                        interp_cog = interpolate_angle(curr["cog"], nxt["cog"], frac)
                        interp_heading = interpolate_angle(curr["heading"], nxt["heading"], frac)

                        out_points.append(TrajectoryPointResponse(
                            timestamp=interp_ts,
                            latitude=round(interp_lat, 6),
                            longitude=round(interp_lon, 6),
                            sog=round(interp_sog, 2),
                            cog=round(interp_cog, 1),
                            heading=round(interp_heading, 1),
                            is_interpolated=True,
                            in_gap=is_gap
                        ))

        # Re-sort full waypoint series chronologically
        out_points.sort(key=lambda p: p.timestamp)

        # Compile GeoJSON LineString
        coordinates = [[p.longitude, p.latitude] for p in out_points]
        geojson_feature = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            },
            "properties": {
                "mmsi": mmsi,
                "vessel_name": vessel_name,
                "vessel_type": vessel_type,
                "flag": flag,
                "is_synthetic": is_synthetic,
                "total_distance_km": round(total_distance, 2),
                "total_points": len(out_points),
                "gap_count": len(detected_gaps),
                "has_blackout": any(g.suspected_blackout for g in detected_gaps)
            }
        }

        avg_speed = sum(speeds) / len(speeds) if speeds else 0.0
        max_speed = max(speeds) if speeds else 0.0
        min_speed = min(speeds) if speeds else 0.0

        return VesselTrajectoryResponse(
            mmsi=mmsi,
            vessel_name=vessel_name,
            vessel_type=vessel_type,
            flag=flag,
            is_synthetic=is_synthetic,
            start_time=norm_pings[0]["timestamp"],
            end_time=norm_pings[-1]["timestamp"],
            raw_point_count=len(norm_pings),
            interpolated_point_count=len(out_points) - len(norm_pings),
            total_distance_km=round(total_distance, 2),
            avg_speed_knots=round(avg_speed, 2),
            max_speed_knots=round(max_speed, 2),
            min_speed_knots=round(min_speed, 2),
            has_anomalous_gaps=len(detected_gaps) > 0,
            gaps=detected_gaps,
            points=out_points,
            geojson=geojson_feature
        )

    @classmethod
    def reconstruct_trajectories(
        cls,
        positions: List[Any],
        step_minutes: int = 10,
        gap_threshold_hours: float = 1.0
    ) -> List[VesselTrajectoryResponse]:
        """Groups positional pings by MMSI and reconstructs continuous trajectory for all vessels."""
        if not positions:
            return []

        # Group by MMSI
        vessel_groups: Dict[int, List[Any]] = {}
        for p in positions:
            mmsi = getattr(p, "mmsi", None) or (p.get("mmsi") if isinstance(p, dict) else None)
            if mmsi:
                vessel_groups.setdefault(mmsi, []).append(p)

        trajectories: List[VesselTrajectoryResponse] = []
        for mmsi, pings in vessel_groups.items():
            if len(pings) < 1:
                continue
            traj = cls.reconstruct_vessel_trajectory(
                pings=pings,
                step_minutes=step_minutes,
                gap_threshold_hours=gap_threshold_hours
            )
            trajectories.append(traj)

        # Sort by total points or name
        trajectories.sort(key=lambda t: t.vessel_name)
        return trajectories
