import math
import datetime
from typing import Dict, Any, List, Optional
from app.core.logging import logger
from app.engines.candidate_filter import CandidateFilterResult
from app.schemas.ais import VesselTrajectoryResponse
from app.models.origin import OriginEstimate
from app.models.spill import Spill

class AttributionScores:
    """Multi-factor attribution score breakdown compliant with SIH PS-26143."""

    def __init__(
        self,
        spatial_score: float,
        temporal_score: float,
        trajectory_score: float,
        behaviour_score: float,
        ais_score: float,
        final_score: float,
        supporting_evidence: List[str],
        contradictory_evidence: List[str],
        uncertainty_factors: List[str]
    ):
        self.spatial_score = round(spatial_score, 1)
        self.temporal_score = round(temporal_score, 1)
        self.trajectory_score = round(trajectory_score, 1)
        self.behaviour_score = round(behaviour_score, 1)
        self.ais_score = round(ais_score, 1)
        self.final_score = round(final_score, 1)
        self.supporting_evidence = supporting_evidence
        self.contradictory_evidence = contradictory_evidence
        self.uncertainty_factors = uncertainty_factors

    def to_explanation_dict(self) -> Dict[str, Any]:
        return {
            "spatial_score": self.spatial_score,
            "temporal_score": self.temporal_score,
            "trajectory_score": self.trajectory_score,
            "behaviour_score": self.behaviour_score,
            "ais_score": self.ais_score,
            "final_score": self.final_score,
            "supporting_evidence": self.supporting_evidence,
            "contradictory_evidence": self.contradictory_evidence,
            "uncertainty_factors": self.uncertainty_factors
        }

class AttributionEngine:
    """Physics-informed multi-factor attribution scoring engine for maritime spill investigations."""

    WEIGHT_SPATIAL = 0.30
    WEIGHT_TEMPORAL = 0.25
    WEIGHT_TRAJECTORY = 0.20
    WEIGHT_BEHAVIOUR = 0.15
    WEIGHT_AIS = 0.10

    @classmethod
    def compute_attribution(
        cls,
        filter_result: CandidateFilterResult,
        trajectory: VesselTrajectoryResponse,
        origin: OriginEstimate,
        spill: Optional[Spill] = None,
        net_drift_cog: float = 30.0
    ) -> AttributionScores:
        """Computes transparent, multi-factor attribution scores and explanation cards for a vessel."""
        supporting: List[str] = []
        contradictory: List[str] = []
        uncertainties: List[str] = []

        # =========================================================
        # 1. SPATIAL SCORE (30% weight)
        # =========================================================
        d_km = filter_result.min_distance_km
        sigma_spatial = max(4.0, origin.uncertainty_radius_km / 1.5)

        # Gaussian distance decay
        spatial_score = 100.0 * math.exp(-(d_km ** 2) / (2.0 * (sigma_spatial ** 2)))

        if filter_result.intersects_polygon:
            spatial_score = max(spatial_score, 92.0)
            supporting.append(f"Vessel trajectory directly traversed the probable spill origin distribution polygon.")
        elif d_km <= 5.0:
            supporting.append(f"Passed within close proximity ({d_km:.1f} km) of origin centroid.")
        elif d_km <= origin.uncertainty_radius_km:
            supporting.append(f"Navigated inside the 95% confidence uncertainty radius ({d_km:.1f} km <= {origin.uncertainty_radius_km:.1f} km).")
        else:
            contradictory.append(f"Remained outside the primary origin uncertainty cone ({d_km:.1f} km from centroid).")

        spatial_score = max(0.0, min(100.0, spatial_score))

        # =========================================================
        # 2. TEMPORAL SCORE (25% weight)
        # =========================================================
        t_cpa = filter_result.closest_approach_time
        win_start = origin.time_window_start.replace(tzinfo=datetime.timezone.utc) if origin.time_window_start.tzinfo is None else origin.time_window_start
        win_end = origin.time_window_end.replace(tzinfo=datetime.timezone.utc) if origin.time_window_end.tzinfo is None else origin.time_window_end

        if t_cpa:
            t_cpa_utc = t_cpa.replace(tzinfo=datetime.timezone.utc) if t_cpa.tzinfo is None else t_cpa
            if win_start <= t_cpa_utc <= win_end:
                # Inside physical release window
                midpoint = win_start + (win_end - win_start) / 2
                half_dur = (win_end - win_start).total_seconds() / 2.0
                dist_from_mid = abs((t_cpa_utc - midpoint).total_seconds())
                temporal_score = 92.0 + 8.0 * (1.0 - dist_from_mid / max(1.0, half_dur))
                supporting.append(f"Closest approach occurred at {t_cpa_utc.strftime('%H:%M UTC')}, coinciding directly with estimated release window.")
            else:
                # Outside release window: Gaussian decay with 3.5h sigma
                diff_sec = min(abs((t_cpa_utc - win_start).total_seconds()), abs((t_cpa_utc - win_end).total_seconds()))
                diff_hours = diff_sec / 3600.0
                temporal_score = 85.0 * math.exp(-(diff_hours ** 2) / (2.0 * (3.5 ** 2)))
                if diff_hours > 6.0:
                    contradictory.append(f"Transit closest approach was {diff_hours:.1f} hours outside the release window.")
                else:
                    uncertainties.append(f"Approach timestamp was slightly offset from release window by {diff_hours:.1f} hours.")
        else:
            temporal_score = 20.0
            contradictory.append("No timestamped AIS position recorded during the observation horizon.")

        temporal_score = max(0.0, min(100.0, temporal_score))

        # =========================================================
        # 3. TRAJECTORY CONSISTENCY (20% weight)
        # =========================================================
        # Compare vessel COG near origin to net drift vector and spill elongation
        vessel_cog = trajectory.avg_speed_knots  # fallback
        if trajectory.points:
            # Get COG near CPA
            cpa_pt = min(trajectory.points, key=lambda p: abs((p.timestamp.replace(tzinfo=datetime.timezone.utc) if p.timestamp.tzinfo is None else p.timestamp) - (t_cpa_utc if t_cpa else win_start)).total_seconds())
            vessel_cog = cpa_pt.cog

        cog_diff = abs(vessel_cog - net_drift_cog) % 360.0
        angle_err = min(cog_diff, 360.0 - cog_diff)

        # High alignment if course is within 45 degrees of drift / shipping lane axis
        if angle_err <= 30.0:
            trajectory_score = 85.0 + 15.0 * (1.0 - angle_err / 30.0)
            supporting.append(f"Vessel heading ({vessel_cog:.0f} deg) aligns with environmental drift axis ({net_drift_cog:.0f} deg).")
        elif angle_err <= 60.0:
            trajectory_score = 65.0 + 20.0 * (1.0 - (angle_err - 30.0) / 30.0)
            uncertainties.append(f"Moderate course deviation ({angle_err:.0f} deg) from prevailing drift corridor.")
        else:
            trajectory_score = max(30.0, 65.0 - (angle_err - 60.0) * 0.4)
            contradictory.append(f"Vessel course ({vessel_cog:.0f} deg) was cross-track or divergent from slick elongation axis.")

        trajectory_score = max(0.0, min(100.0, trajectory_score))

        # =========================================================
        # 4. BEHAVIORAL ANOMALY (15% weight)
        # =========================================================
        v_cpa = filter_result.speed_at_cpa_knots
        v_avg = trajectory.avg_speed_knots

        if v_avg >= 9.0 and v_cpa <= 6.0:
            # Noticeable speed drop near probable origin
            drop_pct = ((v_avg - v_cpa) / v_avg) * 100.0
            behaviour_score = min(98.0, 80.0 + drop_pct * 0.3)
            supporting.append(f"Significant speed drop detected near origin: slowed from cruise {v_avg:.1f} kt to {v_cpa:.1f} kt ({drop_pct:.0f}% reduction).")
        elif v_cpa <= 4.0 and filter_result.duration_in_zone_minutes >= 60.0:
            # Loitering behavior
            behaviour_score = 90.0
            supporting.append(f"Loitering pattern detected in origin sector ({filter_result.duration_in_zone_minutes:.0f} min duration).")
        elif abs(v_avg - v_cpa) <= 2.0:
            # Steady cruising speed maintained
            behaviour_score = 35.0
            contradictory.append(f"Maintained steady cruising speed ({v_cpa:.1f} kt) without anomalous speed drops.")
        else:
            behaviour_score = 50.0

        behaviour_score = max(0.0, min(100.0, behaviour_score))

        # =========================================================
        # 5. AIS EVIDENCE (10% weight)
        # =========================================================
        if trajectory.has_anomalous_gaps:
            blackouts = [g for g in trajectory.gaps if g.suspected_blackout]
            if blackouts:
                max_gap = max(g.duration_hours for g in blackouts)
                ais_score = min(98.0, 88.0 + max_gap * 2.5)
                supporting.append(f"Suspicious AIS transponder blackout recorded: transmitter deactivated for {max_gap:.1f}h while underway.")
            else:
                max_gap = max(g.duration_hours for g in trajectory.gaps)
                ais_score = 65.0
                uncertainties.append(f"Minor AIS latency / transmission gap of {max_gap:.1f}h observed.")
        else:
            ais_score = 25.0
            contradictory.append("Continuous, uninterrupted AIS transmission verified throughout the transit.")

        ais_score = max(0.0, min(100.0, ais_score))

        # =========================================================
        # COMPOSITE WEIGHTED SCORE
        # =========================================================
        final_score = (
            cls.WEIGHT_SPATIAL * spatial_score +
            cls.WEIGHT_TEMPORAL * temporal_score +
            cls.WEIGHT_TRAJECTORY * trajectory_score +
            cls.WEIGHT_BEHAVIOUR * behaviour_score +
            cls.WEIGHT_AIS * ais_score
        )

        uncertainties.append("Satellite wind vector variance (+/- 1.5 m/s) may influence drift accuracy bounds.")

        return AttributionScores(
            spatial_score=spatial_score,
            temporal_score=temporal_score,
            trajectory_score=trajectory_score,
            behaviour_score=behaviour_score,
            ais_score=ais_score,
            final_score=final_score,
            supporting_evidence=supporting,
            contradictory_evidence=contradictory,
            uncertainty_factors=uncertainties
        )
