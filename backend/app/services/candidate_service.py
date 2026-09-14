import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.candidate import CandidateVessel
from app.repositories.incident_repository import IncidentRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.ais_repository import AisRepository
from app.services.origin_service import OriginService
from app.services.ais_service import AisService
from app.engines.candidate_filter import CandidateFilterEngine, CandidateFilterResult
from app.engines.attribution_engine import AttributionEngine, AttributionScores
from app.schemas.attribution import CandidateVesselResponse, IncidentCandidatesResponse
from app.core.logging import logger

class CandidateService:
    """Orchestrator for spatiotemporal filtering, attribution scoring, persistence, and retrieval of suspect vessels."""

    def __init__(self, db: Session):
        self.db = db
        self.incident_repo = IncidentRepository()
        self.candidate_repo = CandidateRepository()
        self.ais_repo = AisRepository()
        self.origin_service = OriginService(db)
        self.ais_service = AisService(db)

    def filter_and_persist_candidates(
        self,
        incident_id: str,
        force_recompute: bool = False,
        spatial_buffer_km: float = 5.0,
        temporal_buffer_hours: float = 2.0
    ) -> IncidentCandidatesResponse:
        """Filters vessels intersecting probable origin, computes multi-factor attribution scores, and persists ranked records."""
        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        # Check existing candidates in DB
        existing = self.candidate_repo.get_by_incident_id(self.db, incident.id)
        if existing and not force_recompute:
            return self._build_response(incident_id, existing)

        # Retrieve origin estimate and reconstructed trajectories
        origin = self.origin_service.get_or_create_origin_estimate(incident_id)
        trajectories = self.ais_service.get_incident_trajectories(incident_id)
        traj_map = {t.mmsi: t for t in trajectories}
        spill = incident.spills[0] if incident.spills else None

        # Run spatiotemporal filtering
        filter_results = CandidateFilterEngine.filter_candidates(
            origin=origin,
            trajectories=trajectories,
            spatial_buffer_km=spatial_buffer_km,
            temporal_buffer_hours=temporal_buffer_hours
        )

        # Delete previous records if recomputing
        if existing:
            self.candidate_repo.delete_by_incident_id(self.db, incident.id)

        candidate_models: List[CandidateVessel] = []

        for r in filter_results:
            vessel = self.ais_repo.get_vessel_by_mmsi(self.db, r.mmsi)
            traj = traj_map.get(r.mmsi)
            if not traj:
                continue

            # Compute multi-factor physics & behavioral attribution scores
            attribution = AttributionEngine.compute_attribution(
                filter_result=r,
                trajectory=traj,
                origin=origin,
                spill=spill,
                net_drift_cog=32.0
            )

            # Combined explanation metadata
            merged_explanation = {
                **r.to_dict(),
                **attribution.to_explanation_dict()
            }

            cand = CandidateVessel(
                incident_id=incident.id,
                vessel_id=vessel.id if vessel else None,
                mmsi=r.mmsi,
                spatial_score=attribution.spatial_score,
                temporal_score=attribution.temporal_score,
                trajectory_score=attribution.trajectory_score,
                behaviour_score=attribution.behaviour_score,
                ais_score=attribution.ais_score,
                final_score=attribution.final_score,
                rank=1,
                explanation=merged_explanation
            )
            candidate_models.append(cand)

        # Sort candidate models by final_score descending
        candidate_models.sort(key=lambda c: c.final_score, reverse=True)
        for idx, c in enumerate(candidate_models):
            c.rank = idx + 1

        self.candidate_repo.create_batch(self.db, candidate_models)
        logger.info(f"Persisted {len(candidate_models)} scored attribution candidates for incident '{incident_id}'")

        return self._build_response(incident_id, candidate_models)

    def get_attribution_ranking(
        self,
        incident_id: str,
        force_recompute: bool = False
    ) -> IncidentCandidatesResponse:
        """Returns ordered suspect rank list with multi-factor forensic breakdown cards."""
        return self.filter_and_persist_candidates(
            incident_id=incident_id,
            force_recompute=force_recompute
        )

    def get_vessel_dossier(self, incident_id: str, mmsi: int):
        """Retrieves full investigator forensic dossier for a specific candidate vessel."""
        from app.engines.evidence_engine import EvidenceEngine

        incident = self.incident_repo.get_by_incident_id(self.db, incident_id)
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        # Ensure candidates are computed
        self.filter_and_persist_candidates(incident_id)

        candidates = self.candidate_repo.get_by_incident_id(self.db, incident.id)
        candidate = next((c for c in candidates if c.mmsi == mmsi), None)
        if not candidate:
            raise ValueError(f"Candidate vessel with MMSI {mmsi} not found for incident '{incident_id}'.")

        origin = self.origin_service.get_or_create_origin_estimate(incident_id)
        trajectories = self.ais_service.get_incident_trajectories(incident_id)
        trajectory = next((t for t in trajectories if t.mmsi == mmsi), None)
        if not trajectory:
            raise ValueError(f"Trajectory for vessel MMSI {mmsi} not found.")

        spill = incident.spills[0] if incident.spills else None

        return EvidenceEngine.generate_dossier(
            incident_id=incident_id,
            candidate=candidate,
            trajectory=trajectory,
            origin=origin,
            spill=spill
        )


    def _build_response(self, incident_id: str, candidates: List[CandidateVessel]) -> IncidentCandidatesResponse:
        res_list = []
        qualified_count = 0
        for c in candidates:
            v_name = c.vessel.vessel_name if c.vessel else f"Vessel-{c.mmsi}"
            v_type = c.vessel.vessel_type if c.vessel else "Unknown"
            v_flag = c.vessel.flag if c.vessel else "Unknown"
            v_synth = c.vessel.is_synthetic if c.vessel else False

            is_qual = c.explanation.get("is_qualified", False) if c.explanation else False
            if is_qual:
                qualified_count += 1

            res_list.append(CandidateVesselResponse(
                id=c.id,
                incident_id=c.incident_id,
                vessel_id=c.vessel_id,
                mmsi=c.mmsi,
                spatial_score=c.spatial_score,
                temporal_score=c.temporal_score,
                trajectory_score=c.trajectory_score,
                behaviour_score=c.behaviour_score,
                ais_score=c.ais_score,
                final_score=c.final_score,
                rank=c.rank,
                explanation=c.explanation,
                created_at=c.created_at,
                vessel_name=v_name,
                vessel_type=v_type,
                flag=v_flag,
                is_synthetic=v_synth
            ))

        return IncidentCandidatesResponse(
            incident_id=incident_id,
            total_candidates=len(res_list),
            qualified_count=qualified_count,
            candidates=res_list
        )
