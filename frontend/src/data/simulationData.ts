import { CandidateVessel } from '../types';

/**
 * MARIS Investigation Demo Simulation Dataset
 * Scenario: SPILL-042 in the Bay of Bengal / Indian Ocean
 * Deterministic mock data demonstrating the full oil spill investigation workflow.
 */

export const SIMULATION_INCIDENT = {
  id: 'SPILL-042',
  location: 'Bay of Bengal',
  coordinates: { lat: 14.85, lng: 88.25 },
  detectionConfidence: 92,
  estimatedAreaKm2: 42.8,
  estimatedAge: '4–7 hours',
  severity: 'HIGH',
  detectionTimeUTC: '14:50 UTC',
  sensor: 'Sentinel-1 SAR C-Band VV Polarimetric Backscatter',

  // Hindcast reconstructed probable origin
  originCoordinates: { lat: 14.20, lng: 87.50 },
  originConfidence: 81,
  originUncertaintyKm: 12,
  originTimeUTC: '10:24 UTC',

  // Metocean environmental drift
  driftDirection: 'NE (048°)',
  driftSpeedMps: 1.2,
  wind: 'WSW 14 kn',
  seaState: 'Moderate (SST 28.4°C)',

  // 12H Forward Forecast
  forecast12hAreaKm2: 67.4,
  forecastCoordinates: [
    { label: '+3 Hours', lat: 15.05, lng: 88.58, area: 48.6, time: '17:50 UTC' },
    { label: '+6 Hours', lat: 15.28, lng: 88.92, area: 55.2, time: '20:50 UTC' },
    { label: '+12 Hours', lat: 15.65, lng: 89.48, area: 67.4, time: '02:50 UTC' },
  ],
};

export const SIMULATION_CANDIDATES: CandidateVessel[] = [
  {
    id: 'cand-01',
    name: 'NORDIC STAR',
    type: 'Crude Oil Tanker',
    flag: 'Liberia 🇱🇷',
    imo: 'IMO 9482190',
    speed: '13.8 kn',
    heading: '062° NE',
    correlationScore: 92,
    isTarget: true,
    distanceFromOrigin: '2.1 km',
    timeAtOrigin: '10:24 UTC',
    status: 'Highest Correlation Candidate',
    trajectory: [
      [13.40, 86.20],
      [13.75, 86.80],
      [14.22, 87.52], // Point of closest approach (10:24 UTC)
      [14.70, 88.25],
      [15.25, 89.10],
      [15.80, 89.95],
    ],
  },
  {
    id: 'cand-02',
    name: 'OCEAN MERIDIAN',
    type: 'Bulk Carrier',
    flag: 'Panama 🇵🇦',
    imo: 'IMO 9610428',
    speed: '11.2 kn',
    heading: '095° E',
    correlationScore: 41,
    isTarget: false,
    distanceFromOrigin: '148 km',
    timeAtOrigin: '11:10 UTC',
    status: 'Excluded (Spatial Disparity)',
    trajectory: [
      [12.80, 84.50],
      [12.85, 86.00],
      [12.90, 87.80],
      [12.92, 89.50],
    ],
  },
  {
    id: 'cand-03',
    name: 'PACIFIC TRADER',
    type: 'Container Ship',
    flag: 'Singapore 🇸🇬',
    imo: 'IMO 9781034',
    speed: '17.5 kn',
    heading: '188° S',
    correlationScore: 28,
    isTarget: false,
    distanceFromOrigin: '210 km',
    timeAtOrigin: '09:45 UTC',
    status: 'Excluded (Temporal & Heading Mismatch)',
    trajectory: [
      [16.50, 88.10],
      [15.20, 88.00],
      [13.80, 87.90],
      [12.20, 87.80],
    ],
  },
  {
    id: 'cand-04',
    name: 'BLUE HORIZON',
    type: 'General Cargo',
    flag: 'Marshall Islands 🇲🇭',
    imo: 'IMO 9523819',
    speed: '12.0 kn',
    heading: '010° N',
    correlationScore: 19,
    isTarget: false,
    distanceFromOrigin: '265 km',
    timeAtOrigin: '12:00 UTC',
    status: 'Excluded (Late Window & Distance)',
    trajectory: [
      [12.00, 86.80],
      [13.50, 87.00],
      [15.00, 87.15],
      [16.80, 87.30],
    ],
  },
  {
    id: 'cand-05',
    name: 'SEA VOYAGER',
    type: 'Chemical Tanker',
    flag: 'Malta 🇲🇹',
    imo: 'IMO 9419082',
    speed: '10.5 kn',
    heading: '285° WNW',
    correlationScore: 14,
    isTarget: false,
    distanceFromOrigin: '310 km',
    timeAtOrigin: '08:30 UTC',
    status: 'Excluded (Out of Release Corridor)',
    trajectory: [
      [14.50, 91.00],
      [14.80, 89.50],
      [15.10, 88.00],
      [15.30, 86.20],
    ],
  },
];

export const CANDIDATE_VESSELS = SIMULATION_CANDIDATES;


export const STAGE_DESCRIPTIONS = [
  {
    stage: 0,
    title: 'STANDBY',
    subtitle: 'Ready to initiate investigation simulation',
    tag: 'IDLE',
  },
  {
    stage: 1,
    title: 'SATELLITE DETECTION',
    subtitle: 'Analyzing Sentinel-1 SAR imagery over the Bay of Bengal...',
    tag: 'STAGE 1 / 8',
    statusText: 'OIL SPILL DETECTED // 92% CONFIDENCE // 42.8 km²',
  },
  {
    stage: 2,
    title: 'SPILL CHARACTERIZATION',
    subtitle: 'Contour boundary delineation & thickness mapping',
    tag: 'STAGE 2 / 8',
    statusText: 'Area: 42.8 km² • Estimated Age: 4–7 hrs • Severity: HIGH',
  },
  {
    stage: 3,
    title: 'HINDCAST RECONSTRUCTION',
    subtitle: 'Reconstructing origin using ocean current & wind drift vectors',
    tag: 'STAGE 3 / 8',
    statusText: 'PROBABLE ORIGIN // 81% CONFIDENCE // ±12 km // 10:24 UTC',
  },
  {
    stage: 4,
    title: 'AIS RECONSTRUCTION',
    subtitle: 'Correlating historical vessel positions around release origin',
    tag: 'STAGE 4 / 8',
    statusText: 'RECONSTRUCTING AIS TRAFFIC // 5 POTENTIAL CANDIDATES',
  },
  {
    stage: 5,
    title: 'FILTER IRRELEVANT TRAFFIC',
    subtitle: 'Isolating high-correlation trajectories against dispersion model',
    tag: 'STAGE 5 / 8',
    statusText: '32 VESSELS ANALYZED • 5 CANDIDATES • 1 HIGH-CORRELATION',
  },
  {
    stage: 6,
    title: 'VESSEL ATTRIBUTION',
    subtitle: 'Computing multi-factor spatio-temporal attribution score',
    tag: 'STAGE 6 / 8',
    statusText: 'NORDIC STAR // 92% SOURCE CORRELATION',
  },
  {
    stage: 7,
    title: 'EXPLAINABLE RESULT',
    subtitle: 'Analytical attribution matrix & geometry alignment evidence',
    tag: 'STAGE 7 / 8',
    statusText: 'HIGHEST CORRELATION CANDIDATE (ANALYTICAL SIMULATION)',
  },
  {
    stage: 8,
    title: 'FUTURE 12H FORECAST',
    subtitle: 'Predicting future dispersion corridor (+3h, +6h, +12h)',
    tag: 'STAGE 8 / 8',
    statusText: 'PREDICTED DRIFT: NE // CURRENT 1.2 m/s // PREDICTED AREA 67.4 km²',
  },
  {
    stage: 9,
    title: 'SIMULATION COMPLETE',
    subtitle: 'MARIS Investigation Workflow Finished',
    tag: 'SUMMARY',
    statusText: 'INVESTIGATION COMPLETE // RESTART AVAILABLE',
  },
];
