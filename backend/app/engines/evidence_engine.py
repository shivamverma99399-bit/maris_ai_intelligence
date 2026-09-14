import datetime
from typing import List, Dict, Any, Optional
from app.core.logging import logger
from app.models.candidate import CandidateVessel
from app.models.origin import OriginEstimate
from app.models.spill import Spill
from app.schemas.ais import VesselTrajectoryResponse
from app.schemas.attribution import (
    CandidateScoreBreakdown, ForensicTimelineEvent, VesselDossierResponse
)
from app.engines.trajectory_engine import haversine_km

class EvidenceEngine:
    """Forensic evidence assembler synthesizing investigator dossiers, event timelines, and physical compatibility."""

    @classmethod
    def generate_dossier(
        cls,
        incident_id: str,
        candidate: CandidateVessel,
        trajectory: VesselTrajectoryResponse,
        origin: OriginEstimate,
        spill: Optional[Spill] = None
    ) -> VesselDossierResponse:
        """Assembles a comprehensive, objective forensic dossier for an individual suspect vessel."""
        vessel = candidate.vessel
        v_name = vessel.vessel_name if vessel else f"Vessel-{candidate.mmsi}"
        v_type = vessel.vessel_type if vessel else "Unknown"
        v_flag = vessel.flag if vessel else "Unknown"
        v_imo = vessel.imo if vessel else None
        v_synth = vessel.is_synthetic if vessel else False

        # Extract explanation metadata
        expl = candidate.explanation or {}
        supporting = expl.get("supporting_evidence", [])
        contradictory = expl.get("contradictory_evidence", [])
        uncertainties = expl.get("uncertainty_factors", [])

        d_min = expl.get("min_distance_km", 0.0)
        t_cpa_str = expl.get("closest_approach_time")
        duration_in_zone = expl.get("duration_in_zone_minutes", 0.0)

        t_cpa = None
        if t_cpa_str:
            try:
                t_cpa = datetime.datetime.fromisoformat(t_cpa_str)
            except Exception:
                t_cpa = None

        # Build Score Breakdown
        score_breakdown = CandidateScoreBreakdown(
            spatial_score=candidate.spatial_score,
            temporal_score=candidate.temporal_score,
            trajectory_score=candidate.trajectory_score,
            behaviour_score=candidate.behaviour_score,
            ais_score=candidate.ais_score,
            final_score=candidate.final_score,
            rank=candidate.rank
        )

        # -------------------------------------------------------------
        # Reconstruct Forensic Event Timeline
        # -------------------------------------------------------------
        timeline: List[ForensicTimelineEvent] = []
        origin_lat = origin.probable_origin_lat
        origin_lon = origin.probable_origin_lon
        radius_km = origin.uncertainty_radius_km

        in_zone = False
        lowest_dist = float("inf")
        cpa_pt = None

        if trajectory.points:
            for p in trajectory.points:
                dist = haversine_km(p.latitude, p.longitude, origin_lat, origin_lon)
                if dist < lowest_dist:
                    lowest_dist = dist
                    cpa_pt = p

                # Zone entry
                if dist <= radius_km and not in_zone:
                    in_zone = True
                    timeline.append(ForensicTimelineEvent(
                        timestamp=p.timestamp,
                        event_type="ZONE_ENTRY",
                        title=f"Enters Origin Buffer ({radius_km:.1f} km)",
                        description=f"{v_name} entered the 95% confidence probable origin zone at {p.sog:.1f} kt.",
                        latitude=p.latitude,
                        longitude=p.longitude,
                        sog_knots=p.sog,
                        cog_degrees=p.cog
                    ))

                # Significant speed drop near origin
                if dist <= radius_km * 1.5 and p.sog <= 5.5 and not p.is_interpolated:
                    # Check if already added recent speed drop
                    has_recent_drop = any(e.event_type == "SPEED_ANOMALY" and abs((e.timestamp - p.timestamp).total_seconds()) < 3600 for e in timeline)
                    if not has_recent_drop:
                        timeline.append(ForensicTimelineEvent(
                            timestamp=p.timestamp,
                            event_type="SPEED_ANOMALY",
                            title="Kinematic Speed Reduction",
                            description=f"Speed dropped to {p.sog:.1f} kt (cruise avg {trajectory.avg_speed_knots:.1f} kt), indicating potential discharge or loitering.",
                            latitude=p.latitude,
                            longitude=p.longitude,
                            sog_knots=p.sog,
                            cog_degrees=p.cog
                        ))

                # Zone exit
                if dist > radius_km and in_zone:
                    in_zone = False
                    timeline.append(ForensicTimelineEvent(
                        timestamp=p.timestamp,
                        event_type="ZONE_EXIT",
                        title="Exits Origin Sector",
                        description=f"{v_name} cleared the probable origin radius.",
                        latitude=p.latitude,
                        longitude=p.longitude,
                        sog_knots=p.sog,
                        cog_degrees=p.cog
                    ))

        # Add Closest Point of Approach (CPA)
        if cpa_pt:
            timeline.append(ForensicTimelineEvent(
                timestamp=cpa_pt.timestamp,
                event_type="CPA_ORIGIN",
                title=f"Closest Point of Approach ({lowest_dist:.1f} km)",
                description=f"Minimum geodesic distance to origin centroid reached at {cpa_pt.timestamp.strftime('%H:%M UTC')}.",
                latitude=cpa_pt.latitude,
                longitude=cpa_pt.longitude,
                sog_knots=cpa_pt.sog,
                cog_degrees=cpa_pt.cog
            ))

        # Add AIS Blackout gaps
        for gap in trajectory.gaps:
            timeline.append(ForensicTimelineEvent(
                timestamp=gap.start_time,
                event_type="BLACKOUT_START",
                title=f"AIS Signal Loss ({gap.duration_hours:.1f}h)",
                description=f"Transponder signal dropped near ({gap.start_lat:.3f}, {gap.start_lon:.3f}). " + ("Suspected intentional blackout." if gap.suspected_blackout else "Intermittent satellite latency."),
                latitude=gap.start_lat,
                longitude=gap.start_lon,
                sog_knots=0.0,
                cog_degrees=0.0
            ))
            timeline.append(ForensicTimelineEvent(
                timestamp=gap.end_time,
                event_type="BLACKOUT_END",
                title="AIS Transmission Resumed",
                description=f"Transponder resumed broadcasts at ({gap.end_lat:.3f}, {gap.end_lon:.3f}) after {gap.distance_km:.1f} km unmonitored passage.",
                latitude=gap.end_lat,
                longitude=gap.end_lon,
                sog_knots=0.0,
                cog_degrees=0.0
            ))

        # Sort timeline chronologically
        timeline.sort(key=lambda e: e.timestamp)

        # -------------------------------------------------------------
        # Physical & Cargo Spill Compatibility
        # -------------------------------------------------------------
        area = spill.area_km2 if spill else 1.5
        perimeter = spill.perimeter_km if spill else 12.0
        est_metric_tons = round(area * 1.8, 1)  # standard ~1.8 tonnes/km2 for light-medium sheen

        is_tanker = any(k in v_type.lower() for k in ["tanker", "oil", "chemical", "crude"])
        if is_tanker:
            risk_level = "HIGH"
            compat_desc = f"Vessel is a commercial {v_type}. Cargo and slop tanks carry sufficient volume to account for the estimated {est_metric_tons} tonnes slick."
        else:
            risk_level = "MODERATE"
            compat_desc = f"Vessel is a {v_type}. Heavy bunker fuel or bilge discharge is physically compatible with observed {area:.2f} km2 slick."

        spill_compat = {
            "slick_area_km2": area,
            "slick_perimeter_km": perimeter,
            "estimated_discharge_tonnes": est_metric_tons,
            "risk_profile": risk_level,
            "compatibility_assessment": compat_desc
        }

        # -------------------------------------------------------------
        # Investigator Executive Summary
        # -------------------------------------------------------------
        summary_lines = [
            f"Vessel '{v_name}' (MMSI: {candidate.mmsi}, Flag: {v_flag}, Type: {v_type}) ranks #{candidate.rank} with an attribution score of {candidate.final_score:.1f}/100.",
            f"Closest approach was {d_min:.1f} km from the probable spill origin centroid.",
        ]
        if candidate.spatial_score >= 85.0 and candidate.temporal_score >= 85.0:
            summary_lines.append("Demonstrates high spatial and temporal concurrence with the oceanographic hindcast release window.")
        if candidate.behaviour_score >= 80.0:
            summary_lines.append("Exhibited anomalous kinematic behavior (speed reduction) near the release coordinates.")
        if candidate.ais_score >= 80.0:
            summary_lines.append("Flagged for suspicious AIS transponder deactivation while underway.")

        investigator_summary = " ".join(summary_lines)

        return VesselDossierResponse(
            incident_id=incident_id,
            mmsi=candidate.mmsi,
            vessel_name=v_name,
            vessel_type=v_type,
            flag=v_flag,
            imo=v_imo,
            is_synthetic=v_synth,
            rank=candidate.rank,
            final_score=candidate.final_score,
            score_breakdown=score_breakdown,
            supporting_evidence=supporting,
            contradictory_evidence=contradictory,
            uncertainty_factors=uncertainties,
            investigator_summary=investigator_summary,
            timeline=timeline,
            closest_approach_distance_km=d_min,
            closest_approach_time=t_cpa,
            duration_in_zone_minutes=duration_in_zone,
            spill_compatibility=spill_compat
        )
