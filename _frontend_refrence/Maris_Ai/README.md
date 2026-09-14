# MARIS - Maritime AI Intelligence

MARIS (Maritime AI Intelligence Surveillance) is an interactive maritime command center and oil-spill investigation simulation platform. It integrates satellite Synthetic Aperture Radar (SAR) detection, 3D oceanographic hindcast trajectory modeling, AIS automated identification system correlation, candidate vessel attribution, and forward drift forecasting.

---

## Tech Stack

- **React 19** – Component architecture, custom hooks, and state management
- **TypeScript 5.8** – Strict type definitions and safe data models
- **Vite 6** – Fast development server and optimized production bundler
- **Three.js & WebGL** – Interactive 3D Earth globe with custom shaders, procedural slick textures, and camera fly-overs
- **Tailwind CSS v4** – Modern utility-first styling with dark command-center aesthetics
- **Lucide React** – Clean operational maritime icons

---

## Installation

First, clone the repository:

```bash
git clone https://github.com/your-org/maris.git
cd maris
```

Install dependencies:

```bash
bun install
```

---

## Run Development Server

Start the local development server:

```bash
bun run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## Production Build

To build the production-ready bundle:

```bash
bun run build
```

To preview the production build locally:

```bash
bun run preview
```

---

## Project Structure

```
├── public/                 # Static assets and icons
├── src/
│   ├── components/         # 3D globe layer, HUD overlays, simulation briefings, panels
│   ├── data/               # Indian Ocean vessels, maritime routes, simulation scenarios
│   ├── hooks/              # Deterministic 8-stage investigation simulation engine hook
│   ├── pages/              # Fleet, Operations, Surveillance, Routes, Settings, Help
│   ├── types.ts            # Global TypeScript models for incidents, vessels, and simulation
│   ├── App.tsx             # Main command center layout and state orchestration
│   ├── main.tsx            # Application entry point
│   └── index.css           # Tailwind CSS directives and command center color themes
├── bun.lock                # Bun dependency lockfile
├── index.html              # HTML entry point with metadata tags
├── package.json            # Primary dependency manifest and scripts
├── requirements.txt        # Marker file (no Python dependencies required)
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build and Tailwind plugin configuration
```

---

## Environment Variables

Copy the example environment file if configuring deployment variables:

```bash
cp .env.example .env
```

MARIS operates as a client-side simulation platform and does not require third-party API keys to run the interactive 3D oil spill investigation demo.
