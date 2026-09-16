# MARIS — Deployment Guide (Vercel & Render)

This guide provides step-by-step instructions to deploy the **MARIS** Maritime AI Intelligence System to the cloud:
- **Backend + Database** on [Render](https://render.com)
- **Frontend** on [Vercel](https://vercel.com)

---

## 📁 Prepared Deployable Files

The following configuration files have been prepared and optimized in the repository:

| File | Target Platform | Description |
|---|---|---|
| [`render.yaml`](file:///c:/Users/shiva/Desktop/sih/render.yaml) | Render | Infrastructure Blueprint specifying FastAPI Docker Web Service and Managed PostgreSQL. |
| [`backend/Dockerfile`](file:///c:/Users/shiva/Desktop/sih/backend/Dockerfile) | Render | Production Python 3.12 container with dynamic `$PORT` evaluation and healthcheck probes. |
| [`frontend/vercel.json`](file:///c:/Users/shiva/Desktop/sih/frontend/vercel.json) | Vercel | Production Next.js 16 build specification and URL routing rules. |
| [`frontend/src/lib/api.ts`](file:///c:/Users/shiva/Desktop/sih/frontend/src/lib/api.ts) | Vercel | Auto-normalizes `NEXT_PUBLIC_API_URL` and features 15-30s resilient timeouts for cloud cold-starts. |

---

## Part 1: Deploy Backend & Database on Render

### Method A: 1-Click Render Blueprint (Recommended)

1. Push your latest code to your **GitHub repository**.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click the **"New +"** button at the top right and select **"Blueprint"**.
4. Connect your GitHub account and select your **MARIS repository**.
5. Render will detect [`render.yaml`](file:///c:/Users/shiva/Desktop/sih/render.yaml) and automatically configure:
   - **Web Service (`maris-backend`)**: Docker runtime, port auto-binding, health probe `/api/v1/health`.
   - **Database (`maris-postgres`)**: Free managed PostgreSQL database.
   - **Environment Variables**: Auto-wired `DATABASE_URL`, `ML_MODE=render`, and `ENVIRONMENT=production`.
6. Click **"Apply"**.
7. Once deployed, copy your service's live URL (e.g. `https://maris-backend.onrender.com`).

---

### Method B: Manual Web Service Setup (Without Blueprint)

If you prefer creating services manually on Render:

#### 1. Create a PostgreSQL Database
- Click **"New +"** → **"PostgreSQL"**.
- Name: `maris-postgres`
- Database: `maris_db`
- User: `maris_admin`
- Region: *Select closest region (e.g., Oregon / Frankfurt / Singapore)*
- Plan: **Free**
- Click **"Create Database"** and copy the **Internal Database URL** (or External if hosting outside Render).

#### 2. Create the Backend Web Service
- Click **"New +"** → **"Web Service"**.
- Connect your GitHub repository.
- **Runtime**: Select **Docker**.
- **Dockerfile Path**: `backend/Dockerfile`
- **Docker Context**: `backend`
- **Instance Type**: **Free**
- Under **Environment Variables**, add:
  | Key | Value |
  |---|---|
  | `ENVIRONMENT` | `production` |
  | `DEBUG` | `false` |
  | `ML_MODE` | `render` |
  | `RENDER_ML_API_URL` | `https://maris-oil-spill-api.onrender.com` |
  | `OCEAN_DATA_PROVIDER` | `cached` |
  | `DATABASE_URL` | *Paste your database URL from Step 1* |
- Under **Health Check Path**, enter: `/api/v1/health`
- Click **"Create Web Service"**.

---

## Part 2: Deploy Frontend on Vercel

1. Log in to [vercel.com](https://vercel.com) and click **"Add New..."** → **"Project"**.
2. Import your **MARIS GitHub repository**.
3. In the **Configure Project** screen:
   - **Project Name**: `maris-dashboard` (or your preferred name)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **"Edit"** and select **`frontend`** *(CRITICAL STEP)*.
4. Expand the **Environment Variables** section and add:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-backend-subdomain>.onrender.com` |
   *(Note: You can provide it with or without `/api/v1`; `frontend/src/lib/api.ts` automatically normalizes it).*
5. Click **"Deploy"**.
6. Vercel will build and deploy Next.js 16 with Turbopack in ~1 minute and provide a live URL (e.g. `https://maris-dashboard.vercel.app`).

---

## Part 3: Verification Checklist

Once both services are live:

1. **Test Backend Health**:
   Open in your browser:
   ```
   https://<your-backend-subdomain>.onrender.com/api/v1/health
   ```
   Expected response: `{"status":"ok","timestamp":"...","database":"connected"}`

2. **Test Interactive API Docs**:
   Open:
   ```
   https://<your-backend-subdomain>.onrender.com/api/v1/docs
   ```

3. **Seed Turn-Key Demo Scenario (Optional)**:
   In the `/docs` UI or via curl, send a POST request to seed Mumbai High incident `INC-DEMO-2026`:
   ```bash
   curl -X POST https://<your-backend-subdomain>.onrender.com/api/v1/incidents/demo/seed
   ```

4. **Verify Frontend UI**:
   Open your Vercel URL (`https://<your-project>.vercel.app`).
   - Incident telemetry banner displays detected slick area and release point.
   - Interactive Leaflet map renders SAR detection polygon, backward hindcast drift cone, and vessel tracks.
   - Suspect list ranks vessels with 5-factor scoring meters.
   - Clicking a suspect opens the court-admissible forensic evidence dossier.
