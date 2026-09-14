import { MaritimeRoute } from '../types';

export const MARITIME_ROUTES: MaritimeRoute[] = [
  {
    id: 'ROUTE-01',
    name: 'Arabian Sea Corridor',
    corridor: 'Persian Gulf → Arabian Sea → India',
    vessels: 184,
    traffic: 'HIGH',
    status: 'NORMAL',
    avgSpeed: '14.2 kn',
    origin: 'Strait of Hormuz',
    destination: 'Mumbai / JNPT (India)',
    description: 'Vital crude energy artery connecting Gulf oil refineries directly to Western Indian ports.',
    coordinates: [
      [26.56, 56.25], // Hormuz
      [24.12, 59.80], // Gulf of Oman
      [21.50, 64.20], // Mid Arabian Sea
      [19.20, 70.50], // Approaches to Mumbai
      [18.95, 72.82], // JNPT / Mumbai
    ],
    chokepoints: ['Strait of Hormuz', 'Mumbai Deep Channel'],
    anomaliesCount: 1,
  },
  {
    id: 'ROUTE-02',
    name: 'Mumbai → Gulf',
    corridor: 'Persian Gulf → Arabian Sea → India',
    vessels: 96,
    traffic: 'HIGH',
    status: 'MONITORED',
    avgSpeed: '13.8 kn',
    origin: 'Mumbai / Gujarat Ports',
    destination: 'Fujairah / Jebel Ali',
    description: 'High-density tanker and bulk cargo corridor monitored for ballast wash discharges and traffic lanes.',
    coordinates: [
      [18.95, 72.82],
      [20.40, 68.90],
      [23.10, 63.40],
      [25.15, 56.40],
    ],
    chokepoints: ['Gulf of Kutch convergence', 'Fujairah Anchorage'],
    anomaliesCount: 2,
  },
  {
    id: 'ROUTE-03',
    name: 'Chennai → Singapore',
    corridor: 'India → Southeast Asia',
    vessels: 74,
    traffic: 'MEDIUM',
    status: 'NORMAL',
    avgSpeed: '16.5 kn',
    origin: 'Chennai Port (India)',
    destination: 'Port of Singapore',
    description: 'Major container liner trunk connecting eastern India across the Bay of Bengal into the Malacca Strait.',
    coordinates: [
      [13.08, 80.29],
      [10.50, 85.20],
      [7.20, 93.80],
      [5.60, 98.40],
      [1.30, 103.85],
    ],
    chokepoints: ['Six Degree Channel', 'Malacca Strait Entrance'],
    anomaliesCount: 0,
  },
  {
    id: 'ROUTE-04',
    name: 'Kochi → Colombo',
    corridor: 'India → Sri Lanka',
    vessels: 51,
    traffic: 'MEDIUM',
    status: 'NORMAL',
    avgSpeed: '15.1 kn',
    origin: 'Kochi Port / ICTT (India)',
    destination: 'Colombo Harbor (Sri Lanka)',
    description: 'Key feeder link connecting southwest India transshipment traffic directly to Colombo hub.',
    coordinates: [
      [9.96, 76.27],
      [8.08, 77.55], // Cape Comorin
      [7.20, 79.20],
      [6.94, 79.86], // Colombo
    ],
    chokepoints: ['Gulf of Mannar Boundary', 'Palk Strait Inflow'],
    anomaliesCount: 0,
  },
  {
    id: 'ROUTE-05',
    name: 'Suez → Arabian Sea → India',
    corridor: 'Suez → Arabian Sea → India',
    vessels: 112,
    traffic: 'HIGH',
    status: 'MONITORED',
    avgSpeed: '15.4 kn',
    origin: 'Bab-el-Mandeb Strait',
    destination: 'Mundra & Kandla (India)',
    description: 'Europe and Mediterranean container & petrochemical trade route traversing the Gulf of Aden.',
    coordinates: [
      [12.58, 43.35], // Bab el Mandeb
      [13.80, 50.10], // Gulf of Aden
      [16.20, 58.40], // Arabian Sea
      [20.50, 66.80],
      [22.84, 69.70], // Mundra
    ],
    chokepoints: ['Bab-el-Mandeb', 'Socotra Passage'],
    anomaliesCount: 1,
  },
  {
    id: 'ROUTE-06',
    name: 'East Africa → India Energy Trunk',
    corridor: 'East Africa → Arabian Sea → India',
    vessels: 65,
    traffic: 'MEDIUM',
    status: 'NORMAL',
    avgSpeed: '12.9 kn',
    origin: 'Mombasa / Dar es Salaam',
    destination: 'Mangalore / Kochi (India)',
    description: 'Mozambique Channel & East African minerals and LNG gas corridor heading into peninsular India.',
    coordinates: [
      [-4.05, 39.66], // Mombasa
      [0.80, 52.30],
      [6.50, 65.10],
      [9.96, 76.27], // Kochi
      [12.91, 74.85], // Mangalore
    ],
    chokepoints: ['Equatorial Current Confluence'],
    anomaliesCount: 0,
  },
  {
    id: 'ROUTE-07',
    name: 'Bay of Bengal → Southeast Asia',
    corridor: 'Bay of Bengal → Southeast Asia',
    vessels: 88,
    traffic: 'HIGH',
    status: 'NORMAL',
    avgSpeed: '14.8 kn',
    origin: 'Kolkata / Haldia (India)',
    destination: 'Port Klang / Malacca',
    description: 'Bulk raw material and container freight route servicing ASEAN industrial corridors.',
    coordinates: [
      [21.10, 88.05],
      [16.40, 89.80],
      [11.80, 93.50], // Andaman Passage
      [5.90, 98.20],
      [2.99, 101.39], // Port Klang
    ],
    chokepoints: ['Preparis Channel', 'Ten Degree Channel'],
    anomaliesCount: 0,
  },
  {
    id: 'ROUTE-08',
    name: 'Visakhapatnam → Singapore',
    corridor: 'India → Southeast Asia',
    vessels: 72,
    traffic: 'MEDIUM',
    status: 'NORMAL',
    avgSpeed: '14.0 kn',
    origin: 'Visakhapatnam (India)',
    destination: 'Singapore',
    description: 'Industrial heavy machinery, steel, and chemical container shipping route.',
    coordinates: [
      [17.68, 83.21],
      [13.50, 87.20],
      [8.00, 93.90],
      [2.10, 102.50],
      [1.30, 103.85],
    ],
    chokepoints: ['Great Nicobar Channel'],
    anomaliesCount: 0,
  },
];
