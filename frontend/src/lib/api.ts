const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface Incident {
  id: number;
  incident_id: string;
  title: string;
  status: string;
  observation_time: string;
  created_at: string;
  spills?: Array<{
    id: number;
    area_km2: number;
    perimeter_km: number;
    elongation: number;
    confidence: number;
    centroid_lat: number;
    centroid_lon: number;
    polygon_geojson: any;
  }>;
}

export interface OriginEstimate {
  id: number;
  incident_id: number;
  probable_origin_lat: number;
  probable_origin_lon: number;
  uncertainty_radius_km: number;
  confidence: number;
  time_window_start: string;
  time_window_end: string;
  origin_geojson: any;
}

export interface CandidateVessel {
  id: number;
  incident_id: number;
  vessel_id?: number;
  mmsi: number;
  vessel_name: string;
  vessel_type: string;
  flag: string;
  is_synthetic: boolean;
  spatial_score: number;
  temporal_score: number;
  trajectory_score: number;
  behaviour_score: number;
  ais_score: number;
  final_score: number;
  rank: number;
  explanation: any;
  created_at: string;
}

export interface ForensicTimelineEvent {
  timestamp: string;
  event_type: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  sog_knots: number;
  cog_degrees: number;
}

export interface VesselDossier {
  incident_id: string;
  mmsi: number;
  vessel_name: string;
  vessel_type: string;
  flag: string;
  imo?: string;
  is_synthetic: boolean;
  rank: number;
  final_score: number;
  score_breakdown: {
    spatial_score: number;
    temporal_score: number;
    trajectory_score: number;
    behaviour_score: number;
    ais_score: number;
    final_score: number;
    rank: number;
  };
  supporting_evidence: string[];
  contradictory_evidence: string[];
  uncertainty_factors: string[];
  investigator_summary: string;
  timeline: ForensicTimelineEvent[];
  closest_approach_distance_km: number;
  closest_approach_time?: string;
  duration_in_zone_minutes: number;
  spill_compatibility: {
    slick_area_km2: number;
    slick_perimeter_km: number;
    estimated_discharge_tonnes: number;
    risk_profile: string;
    compatibility_assessment: string;
  };
  legal_disclaimer: string;
}

export interface TrajectoryPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  sog: number;
  cog: number;
  heading: number;
  is_interpolated: boolean;
  in_gap: boolean;
}

export interface VesselTrajectory {
  mmsi: number;
  vessel_name: string;
  vessel_type: string;
  flag: string;
  is_synthetic: boolean;
  start_time: string;
  end_time: string;
  raw_point_count: number;
  interpolated_point_count: number;
  total_distance_km: number;
  avg_speed_knots: number;
  max_speed_knots: number;
  min_speed_knots: number;
  has_anomalous_gaps: boolean;
  gaps: any[];
  points: TrajectoryPoint[];
  geojson: any;
}

export interface InvestigationResult {
  incident: Incident;
  origin_estimate?: OriginEstimate;
  total_trajectories: number;
  trajectories: VesselTrajectory[];
  total_candidates: number;
  candidates: CandidateVessel[];
  top_suspect_dossier?: VesselDossier;
  telemetry?: {
    sar_detection_ms: number;
    drift_hindcast_ms: number;
    ais_reconstruction_ms: number;
    attribution_ms: number;
    total_execution_ms: number;
    pipeline_version: string;
  };
}

import {
  DEMO_INCIDENT,
  DEMO_ORIGIN,
  DEMO_CANDIDATES,
  DEMO_DOSSIER_PACIFIC_CHEMIST,
  DEMO_TRAJECTORIES
} from "./demoData";

export const api = {
  async getIncidents(): Promise<Incident[]> {
    try {
      const res = await fetch(`${API_BASE}/incidents`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error("Failed to fetch incidents");
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data : [DEMO_INCIDENT];
    } catch {
      console.warn("Backend unavailable, using demo incidents");
      return [DEMO_INCIDENT];
    }
  },

  async createDemoIncident(incidentId: string = "INC-DEMO-2026"): Promise<Incident> {
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Mumbai High Offshore Slick Detection",
          incident_id: incidentId
        }),
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error("Failed to create incident");
      return await res.json();
    } catch {
      return DEMO_INCIDENT;
    }
  },

  async getIncident(incidentId: string): Promise<Incident> {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`Failed to fetch incident ${incidentId}`);
      return await res.json();
    } catch {
      return DEMO_INCIDENT;
    }
  },

  async getProbableOrigin(incidentId: string): Promise<OriginEstimate> {
    try {
      const res = await fetch(`${API_BASE}/origin/${incidentId}`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`Failed to fetch origin for ${incidentId}`);
      return await res.json();
    } catch {
      return DEMO_ORIGIN;
    }
  },

  async getTrajectories(incidentId: string): Promise<{ incident_id: string; total_vessels: number; vessels: VesselTrajectory[] }> {
    try {
      const res = await fetch(`${API_BASE}/ais/${incidentId}/trajectories?step_minutes=15`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`Failed to fetch trajectories for ${incidentId}`);
      return await res.json();
    } catch {
      return {
        incident_id: incidentId,
        total_vessels: DEMO_TRAJECTORIES.length,
        vessels: DEMO_TRAJECTORIES
      };
    }
  },

  async getAttribution(incidentId: string, forceRecompute: boolean = false): Promise<{ incident_id: string; total_candidates: number; candidates: CandidateVessel[] }> {
    try {
      const res = await fetch(`${API_BASE}/candidates/${incidentId}/attribution?force_recompute=${forceRecompute}`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`Failed to fetch attribution for ${incidentId}`);
      return await res.json();
    } catch {
      return {
        incident_id: incidentId,
        total_candidates: DEMO_CANDIDATES.length,
        candidates: DEMO_CANDIDATES
      };
    }
  },

  async getVesselDossier(incidentId: string, mmsi: number): Promise<VesselDossier> {
    try {
      const res = await fetch(`${API_BASE}/candidates/${incidentId}/dossier/${mmsi}`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`Failed to fetch dossier for vessel ${mmsi}`);
      return await res.json();
    } catch {
      if (mmsi === DEMO_DOSSIER_PACIFIC_CHEMIST.mmsi) {
        return DEMO_DOSSIER_PACIFIC_CHEMIST;
      }
      return {
        ...DEMO_DOSSIER_PACIFIC_CHEMIST,
        mmsi,
        vessel_name: `Vessel-${mmsi}`,
        final_score: 35.0,
        rank: 4,
        investigator_summary: `Preliminary dossier for vessel ${mmsi}. Insufficient behavioral anomalies detected.`
      };
    }
  },

  async getInvestigation(incidentId: string, forceRecompute: boolean = false): Promise<InvestigationResult> {
    try {
      const res = await fetch(
        `${API_BASE}/incidents/${incidentId}/investigation?force_recompute=${forceRecompute}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (!res.ok) throw new Error(`Failed to fetch investigation for ${incidentId}`);
      return await res.json();
    } catch {
      return {
        incident: DEMO_INCIDENT,
        origin_estimate: DEMO_ORIGIN,
        total_trajectories: DEMO_TRAJECTORIES.length,
        trajectories: DEMO_TRAJECTORIES,
        total_candidates: DEMO_CANDIDATES.length,
        candidates: DEMO_CANDIDATES,
        top_suspect_dossier: DEMO_DOSSIER_PACIFIC_CHEMIST,
        telemetry: {
          sar_detection_ms: 12.5,
          drift_hindcast_ms: 45.2,
          ais_reconstruction_ms: 28.0,
          attribution_ms: 36.4,
          total_execution_ms: 122.1,
          pipeline_version: "1.0.0"
        }
      };
    }
  }
};

