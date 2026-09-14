# MARIS — Maritime AI Intelligence System
### Autonomous Attribution of Marine Oil Slicks & Dark Vessel Identification
**Smart India Hackathon 2026 | National Technical Research Organisation (NTRO) | PS-26143**

[![Backend CI](https://img.shields.io/badge/Backend%20Tests-70%20Passed-brightgreen)](file:///c:/Users/shiva/Desktop/sih/backend/tests)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-teal)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black)](https://nextjs.org)
[![PostGIS](https://img.shields.io/badge/PostGIS-16--3.4-blue)](https://postgis.net)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20NTRO-red)](#)

---

## Executive Overview
**MARIS** (Maritime AI Intelligence System) is a sovereign intelligence platform engineered for the National Technical Research Organisation (NTRO) to autonomously attribute offshore marine oil slicks to perpetrator vessels across India's Exclusive Economic Zone (EEZ).

Combining satellite Synthetic Aperture Radar (SAR) segmentation, backward Lagrangian oceanographic drift modeling, kinematic AIS trajectory reconstruction, and multi-factor heuristic scoring, MARIS solves the *"dark vessel problem"*—identifying non-compliant or transponder-disabled tankers intentionally discharging bilge or tank-wash residues.

```
                  ┌───────────────────────────────┐
                  │   Satellite SAR Imagery /     │
                  │   GeoTIFF Sentinel-1 Ingestion│
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │    U-Net Deep Learning        │
                  │    Slick Segmentation Engine  │
                  │   (PyTorch / ONNX Runtime)    │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │  Reverse Lagrangian Hindcast  │
                  │  Backtracking Oil Drift Drift │
                  │   (Wind Leeway + Ocean Currents)
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Probable Release Origin Cone  │
                  │   (Latitude, Longitude, UTC)  │
                  └──────────────┬────────────────┘
                                 │
       ┌─────────────────────────┴─────────────────────────┐
       │                                                   │
       ▼                                                   ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│ Indian EEZ AIS Traffic Stream │        │  Counterfactual Hydrodynamic  │
│  - Blackout Detection (Gap)   │        │  Validation Simulation        │
│  - Kinematic Dead Reckoning   │        │  (Forward Drift Physical Fit) │
│  - Speed Drop Anomalies       │        └──────────────┬────────────────┘
└──────────────┬────────────────┘                       │
               │                                        │
               ▼                                        │
┌───────────────────────────────────────────────────┐   │
│   5-Factor Multi-Criteria Attribution Engine      │◄──┘
│   1. Spatial Proximity   (30%)                    │
│   2. Temporal Alignment  (25%)                    │
│   3. Trajectory Match    (20%)                    │
│   4. Speed Anomaly       (15%)                    │
│   5. AIS Blackout/Gap    (10%)                    │
└──────────────────────┬────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────┐
│   Court-Admissible Forensic Evidence Dossier      │
│   - Ranked Suspect List with Confidence Meters    │
│   - Chronological Multi-Sensor Timeline           │
│   - Physical Spill vs Tanker DWT Compatibility    │
│   - Interactive Next.js Tactical Map Display      │
└───────────────────────────────────────────────────┘
```

---

## Key Features

1. **AI/ML SAR Segmentation Engine (`app.engines.ml_unet`)**:
   - Deep PyTorch U-Net architecture with native ONNX Runtime acceleration.
   - Dual-channel SAR (VV/VH cross-polarization) image preprocessing with speckle filtering and Otsu-guided morphological fallback.
   - Computes geometric telemetry: slick surface area ($km^2$), perimeter ($km$), centroid coordinates, and major/minor elongation axes.

2. **Lagrangian Ocean Hydrodynamic Hindcast (`app.engines.drift_engine`)**:
   - Backward trajectory advection backtracking oil particles against regional vector fields ($V_{total} = V_{current} + 0.03 \cdot V_{wind}$).
   - Generates dynamic Gaussian expansion uncertainty buffers estimating the probable release coordinates and temporal release window.

3. **AIS Kinematic Reconstruction & Gap Analysis (`app.engines.ais_engine`)**:
   - Dead reckoning and geodesic interpolation across transponder loss zones.
   - Automatic classification of intentional AIS blackouts vs radio shadow dropouts.
   - Speed anomaly and loitering analysis detecting discharge maneuvers.

4. **Multi-Criteria Attribution Engine (`app.engines.attribution_engine`)**:
   - Weighted multi-factor matrix quantifying suspect culpability:
     - Spatial Proximity ($W_s = 0.30$)
     - Temporal Coincidence ($W_t = 0.25$)
     - Heading & Course Trajectory ($W_r = 0.20$)
     - Kinematic Speed Anomalies ($W_b = 0.15$)
     - Transponder Darkness ($W_a = 0.10$)

5. **Forward Counterfactual Validation (`app.engines.counterfactual_engine`)**:
   - Simulates a forward spill release from the suspect vessel's historical coordinates at the estimated release timestamp.
   - Computes Intersection-over-Union (IoU), centroid proximity, and Hausdorff distance against the observed satellite slick to mathematically corroborate physical consistency.

6. **Interactive Tactical Dashboard (`frontend/src`)**:
   - Built on Next.js 16 (Turbopack) and Leaflet with CartoDB dark maritime cartography.
   - Real-time layer controls (SAR polygon, backward drift particles, origin uncertainty buffer, vessel tracks).
   - Temporal scrubber for mission playback.
   - Slide-over forensic evidence dossier with chronological event breakdown.

---

## Quickstart Guide

### Option 1: One-Command Docker Compose (Recommended)

To start the complete sovereign stack (PostGIS + FastAPI backend + Next.js frontend):

```bash
# Clone and enter directory
git clone https://github.com/shivamverma99399-bit/BloodBridge_AI_x402_payment.git maris
cd maris

# Launch all microservices
docker compose up --build -d
```

Services will be accessible at:
- **Tactical Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### Option 2: Local Development Setup

#### 1. Backend (FastAPI + Python 3.12)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run full automated test suite (70 tests)
pytest

# Seed the Mumbai High turnkey demonstration scenario
python scripts/seed_demo.py

# Launch FastAPI development server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend (Next.js 16 + Tailwind CSS)
```bash
cd frontend

# Install packages
npm install

# Run production build validation
npm run build

# Start Next.js development server
npm run dev
```

The frontend dashboard will be running at [http://localhost:3000](http://localhost:3000).

---

## Turn-Key Demonstration Scenario

MARIS includes a pre-packaged, court-admissible forensic demonstration scenario based in the **Mumbai High Offshore Oil Field (19.35°N, 71.45°E)**:

- **Incident ID**: `INC-DEMO-2026`
- **Observed Slick**: 18.45 $km^2$ dark SAR anomaly detected 130 km offshore Mumbai.
- **Estimated Release**: 14.5 hours prior to observation at (19.58°N, 71.32°E).
- **Traffic Corridors**: 4 simultaneous vessels operating in the sector.
- **Top Suspect**: `Pacific Chemist` (MMSI `419005678`, Flag: Liberia, Chemical Tanker)
  - Intentionally deactivated AIS transponder for 3.0 hours while transiting through the probable origin cone.
  - Counterfactual forward simulation matches satellite slick with high physical consistency.

To reset or trigger the scenario programmatically:
```bash
curl -X POST "http://localhost:8000/api/v1/incidents/demo/seed?reset_if_exists=true"
```

Or query the full unified investigation payload:
```bash
curl "http://localhost:8000/api/v1/incidents/INC-DEMO-2026/investigation"
```

---

## API Architecture Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service and database connectivity health probe |
| `GET` | `/api/v1/incidents` | List all tracked maritime pollution incidents |
| `POST` | `/api/v1/incidents` | Ingest and register a newly detected oil spill |
| `POST` | `/api/v1/incidents/demo/seed` | Seed the turn-key Mumbai High scenario |
| `GET` | `/api/v1/incidents/{id}/investigation` | **Unified Pipeline Orchestrator** returning full analysis |
| `GET` | `/api/v1/origin/{incident_id}` | Retrieve backward drift origin estimate & release window |
| `GET` | `/api/v1/ais/trajectories/{incident_id}` | Fetch kinematic AIS trajectories of vessels in sector |
| `GET` | `/api/v1/candidates/{incident_id}` | Fetch ranked attribution suspect list |
| `GET` | `/api/v1/candidates/{incident_id}/dossier/{mmsi}` | Generate legal forensic dossier for suspect vessel |
| `GET` | `/api/v1/counterfactual/{incident_id}` | Retrieve or run counterfactual drift validation |
| `POST` | `/api/v1/ml/detect` | Upload SAR image (GeoTIFF/PNG) for U-Net segmentation |
| `GET` | `/api/v1/ml/info` | Inspect active ML model weights and acceleration runtime |

---

## Verification & Test Suite

The system includes a 100% passing test suite across all 70 unit and integration tests:

```
collected 70 items

tests\test_ais.py ..........                                             [ 14%]
tests\test_attribution.py ...                                            [ 18%]
tests\test_candidates.py ...                                             [ 22%]
tests\test_counterfactual.py ...                                         [ 27%]
tests\test_database.py ....                                              [ 32%]
tests\test_demo_hardening.py .....                                       [ 40%]
tests\test_drift.py ....                                                 [ 45%]
tests\test_environment.py ...                                            [ 50%]
tests\test_evidence.py ....                                              [ 55%]
tests\test_geospatial.py .....                                           [ 62%]
tests\test_health.py ..                                                  [ 65%]
tests\test_incidents.py ....                                             [ 71%]
tests\test_investigation.py ..                                           [ 74%]
tests\test_ml_adapter.py .......                                         [ 84%]
tests\test_models.py ...                                                 [ 88%]
tests\test_origin.py ...                                                 [ 92%]
tests\test_trajectories.py .....                                         [100%]

======================= 70 passed in 19.99s =======================
```

To run tests:
```bash
cd backend && pytest -v
```

---

## Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, GeoAlchemy2, Shapely, NumPy, Pandas, PyTorch, ONNX Runtime, OpenCV
- **Database**: PostgreSQL 16 + PostGIS 3.4 Spatial Extension
- **Frontend**: Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS, Leaflet, Lucide Icons
- **Deployment**: Docker, Docker Compose, Uvicorn, Nginx-ready multi-stage containers

---

## Confidentiality & Attribution
Developed for Smart India Hackathon 2026 under Problem Statement PS-26143 for the **National Technical Research Organisation (NTRO)**. All rights reserved.
