import { Incident, OriginEstimate, CandidateVessel, VesselDossier, VesselTrajectory } from "./api";

export const DEMO_INCIDENT: Incident = {
  id: 1,
  incident_id: "INC-DEMO-2026",
  title: "Mumbai High Offshore Sector 4 Oil Slick Detection",
  status: "ANALYZED",
  observation_time: "2026-09-12T08:30:00Z",
  created_at: "2026-09-12T08:35:00Z",
  spills: [
    {
      id: 101,
      area_km2: 18.45,
      perimeter_km: 26.8,
      elongation: 2.85,
      confidence: 0.94,
      centroid_lat: 19.350,
      centroid_lon: 71.450,
      polygon_geojson: {
        type: "Polygon",
        coordinates: [
          [
            [71.410, 19.330],
            [71.435, 19.362],
            [71.470, 19.375],
            [71.492, 19.355],
            [71.475, 19.335],
            [71.440, 19.320],
            [71.410, 19.330]
          ]
        ]
      }
    }
  ]
};

export const DEMO_ORIGIN: OriginEstimate = {
  id: 201,
  incident_id: 1,
  probable_origin_lat: 19.280,
  probable_origin_lon: 71.320,
  uncertainty_radius_km: 4.8,
  confidence: 0.91,
  time_window_start: "2026-09-12T03:30:00Z",
  time_window_end: "2026-09-12T06:45:00Z",
  origin_geojson: {
    type: "Point",
    coordinates: [71.320, 19.280]
  }
};

export const DEMO_CANDIDATES: CandidateVessel[] = [
  {
    id: 1,
    incident_id: 1,
    mmsi: 419005678,
    vessel_name: "PACIFIC CHEMIST",
    vessel_type: "Chemical/Crude Tanker",
    flag: "Liberia",
    is_synthetic: true,
    spatial_score: 92.0,
    temporal_score: 88.5,
    trajectory_score: 85.0,
    behaviour_score: 92.0,
    ais_score: 96.3,
    final_score: 89.4,
    rank: 1,
    created_at: "2026-08-12T08:40:00Z",
    explanation: {
      risk_level: "HIGH_MATCH",
      reason: "Origin-zone transit overlap, 3.0-hour transponder blackout during release window, course alignment with slick major axis, and sudden speed reduction."
    }
  },
  {
    id: 2,
    incident_id: 1,
    mmsi: 419009999,
    vessel_name: "EVER APEX",
    vessel_type: "Container Ship",
    flag: "Panama",
    is_synthetic: true,
    spatial_score: 38.0,
    temporal_score: 28.0,
    trajectory_score: 30.0,
    behaviour_score: 15.0,
    ais_score: 10.0,
    final_score: 24.1,
    rank: 2,
    created_at: "2026-08-12T08:40:00Z",
    explanation: {
      risk_level: "LOW",
      reason: "Spatial proximity only. Continuous 19.2 kn cruising speed in outer commercial corridor with uninterrupted AIS transmission."
    }
  },
  {
    id: 3,
    incident_id: 1,
    mmsi: 419007777,
    vessel_name: "MARATHA PRIDE",
    vessel_type: "Bulk Carrier",
    flag: "India",
    is_synthetic: true,
    spatial_score: 25.0,
    temporal_score: 22.0,
    trajectory_score: 20.0,
    behaviour_score: 15.0,
    ais_score: 10.0,
    final_score: 18.7,
    rank: 3,
    created_at: "2026-08-12T08:40:00Z",
    explanation: {
      risk_level: "LOW",
      reason: "Weak temporal correlation. Crossed sector prior to estimated release window. Commercial transit behavior."
    }
  },
  {
    id: 4,
    incident_id: 1,
    mmsi: 419008888,
    vessel_name: "SAGAR KANYA",
    vessel_type: "Offshore Supply Vessel",
    flag: "India",
    is_synthetic: true,
    spatial_score: 15.0,
    temporal_score: 12.0,
    trajectory_score: 10.0,
    behaviour_score: 10.0,
    ais_score: 5.0,
    final_score: 11.2,
    rank: 4,
    created_at: "2026-08-12T08:40:00Z",
    explanation: {
      risk_level: "NEGLIGIBLE",
      reason: "No origin-window overlap. Stationary near platform infrastructure 14 km south-southeast of origin zone."
    }
  }
];

export const DEMO_DOSSIER_PACIFIC_CHEMIST: VesselDossier = {
  incident_id: "INC-DEMO-2026",
  mmsi: 419005678,
  vessel_name: "PACIFIC CHEMIST",
  vessel_type: "Chemical/Crude Tanker",
  flag: "Liberia",
  imo: "9487123",
  is_synthetic: true,
  rank: 1,
  final_score: 89.4,
  score_breakdown: {
    spatial_score: 92.0,
    temporal_score: 88.5,
    trajectory_score: 85.0,
    behaviour_score: 92.0,
    ais_score: 96.3,
    final_score: 89.4,
    rank: 1
  },
  closest_approach_distance_km: 1.12,
  closest_approach_time: "2026-08-12T04:15:00Z",
  duration_in_zone_minutes: 180,
  spill_compatibility: {
    slick_area_km2: 18.45,
    slick_perimeter_km: 26.8,
    estimated_discharge_tonnes: 185.0,
    risk_profile: "HIGH_MATCH",
    compatibility_assessment: "Chemical/Crude Tanker (DWT: 49,999 MT) is physically capable of discharging estimated ~185 metric tonnes of heavy crude/fuel slop during illegal tank cleaning operations."
  },
  supporting_evidence: [
    "Reconstructed AIS track intersects the probable origin uncertainty cone (19.58°N, 71.32°E) during the estimated release window.",
    "Intentional 3.0-hour AIS transponder blackout detected while crossing the discharge area.",
    "Speed drop anomaly: decelerated from 13.5 knots cruise to 4.2 knots during the release interval.",
    "Counterfactual hydrodynamic simulation matches satellite slick with strong physical consistency (IoU > 0.45)."
  ],
  contradictory_evidence: [
    "No emergency distress calls (Mayday/Pan-Pan) logged with Indian Coast Guard MRCC.",
    "Optical Sentinel-2 cloud cover prevented simultaneous visible verification of wake rainbow sheen."
  ],
  uncertainty_factors: [
    "OpenDrift reverse simulation carries ±1.5 km hydrodynamic uncertainty from regional tidal currents.",
    "Decision Support Disclaimer: MARIS identifies the highest-ranked candidate based on available multi-source evidence. This is decision support and not a legal determination."
  ],
  investigator_summary: "PACIFIC CHEMIST (MMSI: 419005678, Flag: Liberia) is the HIGHEST-RANKED CANDIDATE with an attribution score of 89.4% (HIGH CONFIDENCE). Multi-source analysis demonstrates origin-zone overlap, course alignment, speed drop anomaly, and intentional 3.0-hour AIS transponder silence.",
  timeline: [
    {
      timestamp: "2026-09-12T03:50:00Z",
      event_type: "TRANSIT",
      title: "Approach Transit",
      description: "Cruising south-southeast at steady speed of 13.8 kn, heading 162°.",
      latitude: 19.390,
      longitude: 71.260,
      sog_knots: 13.8,
      cog_degrees: 162.0
    },
    {
      timestamp: "2026-09-12T04:12:00Z",
      event_type: "ZONE_ENTRY",
      title: "Origin Buffer Zone Entry",
      description: "Crossed outer 4.8 km uncertainty perimeter of backtracked release envelope.",
      latitude: 19.325,
      longitude: 71.295,
      sog_knots: 12.4,
      cog_degrees: 158.0
    },
    {
      timestamp: "2026-09-12T04:28:00Z",
      event_type: "SPEED_ANOMALY",
      title: "Kinematic Speed Deceleration",
      description: "Vessel abruptly decelerated from 12.4 kn to 4.2 kn over an 8-minute interval without collision avoidance or weather alerts.",
      latitude: 19.298,
      longitude: 71.308,
      sog_knots: 4.2,
      cog_degrees: 155.0
    },
    {
      timestamp: "2026-09-12T04:42:00Z",
      event_type: "CPA_ORIGIN",
      title: "Closest Point of Approach (CPA)",
      description: "Passed within 0.85 km of the backtracked slick discharge centroid.",
      latitude: 19.282,
      longitude: 71.316,
      sog_knots: 4.5,
      cog_degrees: 154.0
    },
    {
      timestamp: "2026-09-12T04:45:00Z",
      event_type: "BLACKOUT_START",
      title: "AIS Signal Loss / Blackout Initiated",
      description: "Transponder transmissions ceased unexpectedly. Last broadcast coordinates recorded at edge of core discharge area.",
      latitude: 19.278,
      longitude: 71.320,
      sog_knots: 4.6,
      cog_degrees: 154.0
    },
    {
      timestamp: "2026-09-12T05:30:00Z",
      event_type: "BLACKOUT_END",
      title: "AIS Signal Resumed",
      description: "First transmission recovered after 45 minutes of silence at speed of 11.2 kn.",
      latitude: 19.230,
      longitude: 71.350,
      sog_knots: 11.2,
      cog_degrees: 150.0
    },
    {
      timestamp: "2026-09-12T05:34:00Z",
      event_type: "ZONE_EXIT",
      title: "Origin Buffer Zone Exit",
      description: "Exited the probable origin zone accelerating towards cruise speed of 14.1 kn.",
      latitude: 19.222,
      longitude: 71.356,
      sog_knots: 13.9,
      cog_degrees: 150.0
    }
  ],
  legal_disclaimer: "MARIS Decision-Support Statement: Attribution scores and forensic dossiers are probabilistic analytics computed from hydrodynamic back-drift simulations and AIS kinematic trajectories. They serve exclusively as investigatory leads and do not constitute formal legal proof of liability under maritime law (MARPOL 73/78 Annex I)."
};

export const DEMO_TRAJECTORIES: VesselTrajectory[] = [
  {
    mmsi: 419001234,
    vessel_name: "PACIFIC CHEMIST",
    vessel_type: "Crude/Chemical Tanker",
    flag: "Marshall Islands",
    is_synthetic: true,
    start_time: "2026-09-12T03:00:00Z",
    end_time: "2026-09-12T08:30:00Z",
    raw_point_count: 24,
    interpolated_point_count: 8,
    total_distance_km: 78.4,
    avg_speed_knots: 10.8,
    max_speed_knots: 14.2,
    min_speed_knots: 4.2,
    has_anomalous_gaps: true,
    gaps: [
      {
        mmsi: 419001234,
        start_time: "2026-09-12T04:45:00Z",
        end_time: "2026-09-12T05:30:00Z",
        duration_minutes: 45.0,
        start_lat: 19.278,
        start_lon: 71.320,
        end_lat: 19.230,
        end_lon: 71.350,
        distance_km: 6.2,
        estimated_speed_knots: 4.5,
        is_suspected_blackout: true
      }
    ],
    points: [
      { timestamp: "2026-09-12T03:15:00Z", latitude: 19.450, longitude: 71.220, sog: 13.9, cog: 162.0, heading: 162, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T03:30:00Z", latitude: 19.420, longitude: 71.240, sog: 13.8, cog: 162.0, heading: 162, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T03:50:00Z", latitude: 19.390, longitude: 71.260, sog: 13.8, cog: 162.0, heading: 162, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T04:12:00Z", latitude: 19.325, longitude: 71.295, sog: 12.4, cog: 158.0, heading: 158, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T04:28:00Z", latitude: 19.298, longitude: 71.308, sog: 4.2, cog: 155.0, heading: 155, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T04:42:00Z", latitude: 19.282, longitude: 71.316, sog: 4.5, cog: 154.0, heading: 154, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T04:45:00Z", latitude: 19.278, longitude: 71.320, sog: 4.6, cog: 154.0, heading: 154, is_interpolated: false, in_gap: true },
      { timestamp: "2026-09-12T05:00:00Z", latitude: 19.255, longitude: 71.335, sog: 4.5, cog: 152.0, heading: 152, is_interpolated: true, in_gap: true },
      { timestamp: "2026-09-12T05:15:00Z", latitude: 19.240, longitude: 71.343, sog: 4.5, cog: 151.0, heading: 151, is_interpolated: true, in_gap: true },
      { timestamp: "2026-09-12T05:30:00Z", latitude: 19.230, longitude: 71.350, sog: 11.2, cog: 150.0, heading: 150, is_interpolated: false, in_gap: true },
      { timestamp: "2026-09-12T05:45:00Z", latitude: 19.200, longitude: 71.370, sog: 14.0, cog: 150.0, heading: 150, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T06:15:00Z", latitude: 19.140, longitude: 71.410, sog: 14.1, cog: 150.0, heading: 150, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T07:00:00Z", latitude: 19.050, longitude: 71.470, sog: 14.1, cog: 150.0, heading: 150, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T08:00:00Z", latitude: 18.930, longitude: 71.550, sog: 14.2, cog: 150.0, heading: 150, is_interpolated: false, in_gap: false }
    ],
    geojson: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [71.220, 19.450],
          [71.240, 19.420],
          [71.260, 19.390],
          [71.295, 19.325],
          [71.308, 19.298],
          [71.316, 19.282],
          [71.320, 19.278],
          [71.335, 19.255],
          [71.343, 19.240],
          [71.350, 19.230],
          [71.370, 19.200],
          [71.410, 19.140],
          [71.470, 19.050],
          [71.550, 18.930]
        ]
      }
    }
  },
  {
    mmsi: 419005678,
    vessel_name: "EVER FORWARDER",
    vessel_type: "Container Ship",
    flag: "Panama",
    is_synthetic: true,
    start_time: "2026-09-12T03:00:00Z",
    end_time: "2026-09-12T08:30:00Z",
    raw_point_count: 18,
    interpolated_point_count: 0,
    total_distance_km: 110.5,
    avg_speed_knots: 18.2,
    max_speed_knots: 18.5,
    min_speed_knots: 17.9,
    has_anomalous_gaps: false,
    gaps: [],
    points: [
      { timestamp: "2026-09-12T03:15:00Z", latitude: 19.500, longitude: 71.180, sog: 18.2, cog: 140.0, heading: 140, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T04:15:00Z", latitude: 19.380, longitude: 71.300, sog: 18.1, cog: 140.0, heading: 140, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T05:15:00Z", latitude: 19.260, longitude: 71.420, sog: 18.3, cog: 140.0, heading: 140, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T06:15:00Z", latitude: 19.140, longitude: 71.540, sog: 18.2, cog: 140.0, heading: 140, is_interpolated: false, in_gap: false }
    ],
    geojson: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [71.180, 19.500],
          [71.300, 19.380],
          [71.420, 19.260],
          [71.540, 19.140]
        ]
      }
    }
  },
  {
    mmsi: 419009999,
    vessel_name: "MARATHA PRIDE",
    vessel_type: "Bulk Carrier",
    flag: "India",
    is_synthetic: true,
    start_time: "2026-09-12T03:00:00Z",
    end_time: "2026-09-12T08:30:00Z",
    raw_point_count: 14,
    interpolated_point_count: 0,
    total_distance_km: 65.2,
    avg_speed_knots: 11.4,
    max_speed_knots: 11.8,
    min_speed_knots: 11.0,
    has_anomalous_gaps: false,
    gaps: [],
    points: [
      { timestamp: "2026-09-12T03:15:00Z", latitude: 19.100, longitude: 71.200, sog: 11.4, cog: 75.0, heading: 75, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T04:45:00Z", latitude: 19.140, longitude: 71.350, sog: 11.5, cog: 75.0, heading: 75, is_interpolated: false, in_gap: false },
      { timestamp: "2026-09-12T06:15:00Z", latitude: 19.180, longitude: 71.500, sog: 11.3, cog: 75.0, heading: 75, is_interpolated: false, in_gap: false }
    ],
    geojson: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [71.200, 19.100],
          [71.350, 19.140],
          [71.500, 19.180]
        ]
      }
    }
  }
];
