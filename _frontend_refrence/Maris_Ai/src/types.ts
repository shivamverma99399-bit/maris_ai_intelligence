export interface Incident {
  id: string;
  incidentCode: string;
  time: string;
  timestamp: string;
  bleetioun?: string;
  location: string;
  statusBadge: string;
  status: string;
  incidentNumber: string;
  incidentCost: string;
  cost: number;
  maritimeTraffic: string;
  lat: number;
  latitude: number;
  lng: number;
  longitude: number;
  type: string;
  globeX: number;
  globeY: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  associatedRouteIds: string[];
  timelineHourStart: number; // hour (0-23) when incident began or peaked
  caprenisData: { time: string; value: number }[];
  graphsData: { time: string; value: number }[];
  nearestPort?: string;
  vesselsInArea?: number;
  estimatedSpillLiters?: string;
  currentVectorAngle?: number; // drift direction angle in degrees
  currentVectorName?: string;
  zone?: string;
  investigationDetails: {
    vesselName: string;
    imo: string;
    flag: string;
    cargoType: string;
    estimatedSpillVolume: string;
    containmentStatus: string;
    sensorTelemetry: string;
    windDriftVector: string;
    assignedUnits: string[];
  };
}

export interface Port {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  vessels: number;
  traffic: 'HIGH' | 'MODERATE' | 'CONGESTED';
  status: 'OPERATIONAL' | 'RESTRICTED';
  coast: 'West Coast' | 'East Coast';
  state: string;
}

export interface Vessel {
  id: string;
  name: string;
  type: 'Oil Tanker' | 'Container Ship' | 'LNG Carrier' | 'Bulk Carrier' | 'Cargo Ship' | 'Fishing Vessel';
  flag: string;
  speed: string;
  heading: string;
  headingDeg: number;
  destination: string;
  status: 'Underway' | 'Moored' | 'At Anchor' | 'Fishing';
  lat: number;
  lng: number;
  isFishing?: boolean;
  imo?: string;
  callSign?: string;
  dwt?: string;
  length?: string;
  cargo?: string;
  origin?: string;
  eta?: string;
  operator?: string;
}

export interface MaritimeZone {
  id: string;
  name: string;
  category: 'West Coast' | 'East Coast' | 'Waters' | 'Strait' | 'Gulf';
  lat: number;
  lng: number;
  description: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  incidentId?: string;
  unread: boolean;
  severity: 'critical' | 'warning' | 'info';
}

export type NavItem =
  | 'home'
  | 'surveillance'
  | 'fleet'
  | 'routes'
  | 'operations'
  | 'settings'
  | 'help'
  | 'logout'
  | 'incidents'
  | 'briefcase'
  | 'network'
  | 'calendar';

export interface MaritimeRoute {
  id: string;
  name: string;
  corridor: string;
  vessels: number;
  traffic: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'NORMAL' | 'MONITORED' | 'CONGESTED' | 'RESTRICTED';
  avgSpeed: string;
  origin: string;
  destination: string;
  description: string;
  coordinates: [number, number][]; // [lat, lng] points along route
  waypoints?: [number, number][]; // Alias for coordinates
  chokepoints?: string[];
  anomaliesCount?: number;
}

export interface OperationalEvent {
  id: string;
  time: string;
  title: string;
  category: 'SATELLITE' | 'AIS' | 'INCIDENT' | 'DISPERSION' | 'INVESTIGATION' | 'FLEET';
  severity: 'critical' | 'high' | 'medium' | 'info';
  location: string;
  description: string;
  telemetry: string;
  assignedUnit?: string;
  status: 'COMPLETED' | 'IN PROGRESS' | 'PENDING' | 'ALERT';
}

export interface AppSettings {
  general: {
    refreshRate: '5s' | '10s' | '30s' | '1m';
    mapProjection: '3D Globe' | '2D Mercator';
    defaultRegion: 'Indian Ocean' | 'Arabian Sea' | 'Bay of Bengal';
  };
  notifications: {
    criticalIncidents: boolean;
    oilSpillAlerts: boolean;
    vesselAnomalies: boolean;
    satelliteUpdates: boolean;
  };
  display: {
    darkMode: boolean;
    glassEffects: boolean;
    purpleGlow: boolean;
    animations: boolean;
  };
  data: {
    dataSource: 'DEMO / SIMULATED';
    aisSync: 'SIMULATED';
    satelliteSync: 'SIMULATED';
  };
}

export type GlobeViewMode = 'satellite' | 'ais_radar' | 'thermal_spill';

export type InvestigationStage =
  | 0 // Idle / Standby
  | 1 // Stage 1: SATELLITE DETECTION
  | 2 // Stage 2: SPILL CHARACTERIZATION
  | 3 // Stage 3: HINDCAST (ORIGIN RECONSTRUCTION)
  | 4 // Stage 4: AIS RECONSTRUCTION
  | 5 // Stage 5: FILTER IRRELEVANT TRAFFIC
  | 6 // Stage 6: VESSEL ATTRIBUTION
  | 7 // Stage 7: EXPLAINABLE RESULT
  | 8 // Stage 8: FUTURE FORECAST
  | 9; // Final State: INVESTIGATION COMPLETE

export interface CandidateVessel {
  id: string;
  name: string;
  type: string;
  flag: string;
  imo: string;
  speed: string;
  heading: string;
  correlationScore: number;
  isTarget: boolean;
  distanceFromOrigin: string; // e.g. "2.1 km"
  timeAtOrigin: string; // "10:24 UTC"
  trajectory: [number, number][]; // [lat, lng] points
  status: string;
}

export interface SimulationState {
  stage: InvestigationStage;
  isPlaying: boolean;
  attributionScore: number; // 45 -> 92
  timelineProgress: number; // 0 to 100
  simTimeUTC: string;
  stageProgress: number; // 0 to 1 inside current stage
}

