"use client";
import React, { useState } from 'react';
import {
  Share2,
  Navigation,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Activity,
  Compass,
  ArrowRight,
  ShieldAlert,
  Waves,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { MaritimeRoute } from '../types';
import { MARITIME_ROUTES } from '../data/maritimeRoutes';

interface RoutesPageProps {
  onFocusRouteOnGlobe?: (route: MaritimeRoute) => void;
}

export const RoutesPage: React.FC<RoutesPageProps> = ({ onFocusRouteOnGlobe }) => {
  const [selectedRoute, setSelectedRoute] = useState<MaritimeRoute>(MARITIME_ROUTES[0]);
  const [filterCorridor, setFilterCorridor] = useState<string>('ALL');

  const filteredRoutes = MARITIME_ROUTES.filter((r) => {
    if (filterCorridor === 'ALL') return true;
    return r.corridor.toLowerCase().includes(filterCorridor.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-5 max-w-[1700px] w-full mx-auto animate-fade-in">
      {/* Header & Simulated Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(157,0,255,0.14)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#F2EDF7] font-mono">
              Maritime Routes & Corridors
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(176,38,255,0.2)] border border-[rgba(176,38,255,0.45)] text-[#E9D5FF] tracking-wider">
              DEMO / SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-[#81758F] font-mono mt-0.5">
            Strategic sea lines of communication (SLOC), energy supply arteries & chokepoint telemetry in the Indian Ocean
          </p>
        </div>

        {/* Live Traffic Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgba(18,13,24,0.65)] border border-[rgba(255,255,255,0.08)] font-mono text-xs text-[#D9B8FF]">
          <span className="w-2 h-2 rounded-full bg-[#B026FF] animate-ping" />
          <span>VESSEL ROUTE CORRELATION: 99.4% REAL-TIME</span>
        </div>
      </div>

      {/* Top Route Statistics Cards (Required: ACTIVE ROUTES 18, VESSELS ON ROUTES 742, HIGH TRAFFIC ROUTES 6, ANOMALIES 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        <div className="p-3.5 rounded-xl maris-glass-card border border-[rgba(157,0,255,0.25)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#81758F]">
            Active Routes
          </div>
          <div className="text-2xl font-bold font-mono text-[#F2EDF7] mt-1 flex items-baseline justify-between">
            <span>18</span>
            <Share2 className="w-4 h-4 text-[#B026FF] opacity-70" />
          </div>
          <div className="text-[10px] font-mono text-[#6EE7B7] mt-1">
            Major shipping corridors
          </div>
        </div>

        <div className="p-3.5 rounded-xl maris-glass-card border border-[rgba(6,182,212,0.25)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#81758F]">
            Vessels on Routes
          </div>
          <div className="text-2xl font-bold font-mono text-[#67E8F9] mt-1 flex items-baseline justify-between">
            <span>742</span>
            <Navigation className="w-4 h-4 text-[#06B6D4] opacity-70" />
          </div>
          <div className="text-[10px] font-mono text-[#81758F] mt-1">
            Transiting active corridors
          </div>
        </div>

        <div className="p-3.5 rounded-xl maris-glass-card border border-[rgba(245,158,11,0.25)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#81758F]">
            High Traffic Routes
          </div>
          <div className="text-2xl font-bold font-mono text-[#FDE047] mt-1 flex items-baseline justify-between">
            <span>6</span>
            <Activity className="w-4 h-4 text-[#EAB308] opacity-70" />
          </div>
          <div className="text-[10px] font-mono text-[#81758F] mt-1">
            Density &gt; 80 vessels / corridor
          </div>
        </div>

        <div className="p-3.5 rounded-xl maris-glass-card border border-[rgba(239,68,68,0.3)] relative overflow-hidden bg-[rgba(239,68,68,0.05)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#F87171]">
            Anomalies Detected
          </div>
          <div className="text-2xl font-bold font-mono text-[#FF858D] mt-1 flex items-baseline justify-between">
            <span>4</span>
            <AlertTriangle className="w-4 h-4 text-[#EF4444] animate-pulse" />
          </div>
          <div className="text-[10px] font-mono text-[#F87171] mt-1">
            Ballast discharge & deviation
          </div>
        </div>
      </div>

      {/* Main Content Area: Interactive India Route Map + Table + Details */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Left Column: Interactive India-Centered Route Map */}
        <div className="flex-1 flex flex-col min-h-0 maris-glass-primary rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-2xl relative">
          <div className="p-3 bg-[rgba(18,13,24,0.7)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#B026FF]" />
              <span className="text-xs font-mono font-bold text-[#F2EDF7] uppercase tracking-wider">
                India Maritime Corridor Visualizer
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#D6A7FF]">
              SELECTED: {selectedRoute.name}
            </span>
          </div>

          {/* Map Display Canvas/SVG Area */}
          <div className="flex-1 relative bg-[#040306] overflow-hidden flex items-center justify-center p-4">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-radar-grid opacity-30 pointer-events-none" />

            <svg
              viewBox="0 0 900 560"
              className="w-full h-full max-h-[520px] select-none"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))' }}
            >
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8A00E8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.8" />
                </linearGradient>
                <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {/* Ocean Boundaries / Background Ambient */}
              <rect x="0" y="0" width="900" height="560" fill="transparent" />

              {/* Simplified Geometric Continental Coastlines for India & Surroundings */}
              {/* Arabian Peninsula */}
              <path
                d="M 60 120 L 160 140 L 220 200 L 210 260 L 140 310 L 80 290 Z"
                fill="rgba(30, 20, 45, 0.45)"
                stroke="rgba(157, 0, 255, 0.25)"
                strokeWidth="1.2"
              />
              <text x="120" y="220" fill="rgba(180, 160, 210, 0.4)" fontSize="11" fontFamily="monospace">
                ARABIAN PENINSULA
              </text>

              {/* Indian Subcontinent Triangle */}
              <path
                d="M 370 70 L 460 60 L 580 90 L 620 170 L 590 270 L 520 410 L 480 430 L 460 380 L 410 290 L 370 200 L 350 140 Z"
                fill="rgba(36, 18, 56, 0.65)"
                stroke="rgba(192, 76, 255, 0.6)"
                strokeWidth="1.8"
                filter="url(#purpleGlow)"
              />
              <text x="470" y="240" fill="#F2EDF7" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                INDIA 🇮🇳
              </text>

              {/* Sri Lanka Island */}
              <ellipse
                cx="525"
                cy="465"
                rx="22"
                ry="34"
                fill="rgba(42, 22, 65, 0.7)"
                stroke="rgba(192, 76, 255, 0.5)"
                strokeWidth="1.5"
              />
              <text x="525" y="470" fill="rgba(217, 184, 255, 0.7)" fontSize="9" fontFamily="monospace" textAnchor="middle">
                SRI LANKA
              </text>

              {/* Southeast Asia / Malacca Entrance */}
              <path
                d="M 760 180 L 820 220 L 840 310 L 810 420 L 760 480 L 730 400 L 750 310 Z"
                fill="rgba(30, 20, 45, 0.45)"
                stroke="rgba(157, 0, 255, 0.25)"
                strokeWidth="1.2"
              />
              <text x="770" y="340" fill="rgba(180, 160, 210, 0.4)" fontSize="11" fontFamily="monospace">
                SOUTHEAST ASIA
              </text>

              {/* Waters Labels */}
              <text x="270" y="320" fill="rgba(103, 232, 249, 0.35)" fontSize="13" fontFamily="monospace" fontWeight="bold">
                ARABIAN SEA
              </text>
              <text x="630" y="310" fill="rgba(103, 232, 249, 0.35)" fontSize="13" fontFamily="monospace" fontWeight="bold">
                BAY OF BENGAL
              </text>
              <text x="460" y="520" fill="rgba(217, 184, 255, 0.35)" fontSize="13" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                INDIAN OCEAN
              </text>

              {/* Major Maritime Corridors Drawn as Vector Paths */}
              {/* 1. Persian Gulf -> Arabian Sea -> Mumbai */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedRoute(MARITIME_ROUTES[0])}
              >
                <path
                  d="M 190 190 Q 280 270 410 290"
                  fill="none"
                  stroke={selectedRoute.id === 'ROUTE-01' ? '#00F0FF' : 'rgba(176, 38, 255, 0.6)'}
                  strokeWidth={selectedRoute.id === 'ROUTE-01' ? '4' : '2'}
                  strokeDasharray={selectedRoute.id === 'ROUTE-01' ? '8,4' : 'none'}
                />
                <circle cx="190" cy="190" r="4" fill="#00F0FF" />
                <circle cx="410" cy="290" r="5" fill="#B026FF" />
              </g>

              {/* 2. Mumbai -> Gulf */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedRoute(MARITIME_ROUTES[1])}
              >
                <path
                  d="M 410 290 Q 300 240 210 180"
                  fill="none"
                  stroke={selectedRoute.id === 'ROUTE-02' ? '#FDE047' : 'rgba(157, 0, 255, 0.4)'}
                  strokeWidth={selectedRoute.id === 'ROUTE-02' ? '4' : '1.8'}
                  strokeDasharray="6,4"
                />
              </g>

              {/* 3. Chennai -> Singapore (Bay of Bengal to Malacca) */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedRoute(MARITIME_ROUTES[2])}
              >
                <path
                  d="M 520 370 Q 640 400 780 440"
                  fill="none"
                  stroke={selectedRoute.id === 'ROUTE-03' ? '#00F0FF' : 'rgba(176, 38, 255, 0.6)'}
                  strokeWidth={selectedRoute.id === 'ROUTE-03' ? '4' : '2'}
                  strokeDasharray={selectedRoute.id === 'ROUTE-03' ? '8,4' : 'none'}
                />
                <circle cx="520" cy="370" r="5" fill="#B026FF" />
                <circle cx="780" cy="440" r="5" fill="#00F0FF" />
              </g>

              {/* 4. Kochi -> Colombo */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedRoute(MARITIME_ROUTES[3])}
              >
                <path
                  d="M 470 410 L 515 450"
                  fill="none"
                  stroke={selectedRoute.id === 'ROUTE-04' ? '#FDE047' : 'rgba(234, 179, 8, 0.6)'}
                  strokeWidth={selectedRoute.id === 'ROUTE-04' ? '4' : '2'}
                />
                <circle cx="470" cy="410" r="4" fill="#EAB308" />
                <circle cx="515" cy="450" r="4" fill="#EAB308" />
              </g>

              {/* 5. Suez -> Arabian Sea -> India */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedRoute(MARITIME_ROUTES[4])}
              >
                <path
                  d="M 120 280 Q 240 330 380 230"
                  fill="none"
                  stroke={selectedRoute.id === 'ROUTE-05' ? '#00F0FF' : 'rgba(157, 0, 255, 0.5)'}
                  strokeWidth={selectedRoute.id === 'ROUTE-05' ? '4' : '2'}
                  strokeDasharray="6,4"
                />
              </g>

              {/* 6. East Africa -> India */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedRoute(MARITIME_ROUTES[5])}
              >
                <path
                  d="M 80 440 Q 280 460 470 410"
                  fill="none"
                  stroke={selectedRoute.id === 'ROUTE-06' ? '#34D399' : 'rgba(16, 185, 129, 0.5)'}
                  strokeWidth={selectedRoute.id === 'ROUTE-06' ? '4' : '2'}
                />
              </g>

              {/* 7. Bay of Bengal -> Southeast Asia */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedRoute(MARITIME_ROUTES[6])}
              >
                <path
                  d="M 600 210 Q 690 320 770 420"
                  fill="none"
                  stroke={selectedRoute.id === 'ROUTE-07' ? '#00F0FF' : 'rgba(176, 38, 255, 0.5)'}
                  strokeWidth={selectedRoute.id === 'ROUTE-07' ? '4' : '2'}
                />
              </g>

              {/* Chokepoint Markers */}
              <g>
                {/* Strait of Hormuz */}
                <circle cx="195" cy="180" r="7" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="1.5" />
                <text x="195" y="165" fill="#FF858D" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  HORMUZ CHOKEPOINT
                </text>

                {/* Malacca Strait Entrance */}
                <circle cx="775" cy="435" r="7" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="1.5" />
                <text x="775" y="455" fill="#FF858D" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  MALACCA CHOKEPOINT
                </text>

                {/* Mumbai Port */}
                <circle cx="410" cy="290" r="4" fill="#B026FF" />
                <text x="410" y="280" fill="#E9D5FF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  MUMBAI
                </text>

                {/* Chennai Port */}
                <circle cx="520" cy="370" r="4" fill="#B026FF" />
                <text x="530" y="370" fill="#E9D5FF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  CHENNAI
                </text>
              </g>
            </svg>

            {/* Quick Corridor Filter Pills Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between flex-wrap gap-2 pointer-events-auto">
              <div className="flex items-center gap-1.5 overflow-x-auto bg-[rgba(10,8,15,0.85)] p-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] backdrop-blur-md">
                {['ALL', 'Arabian Sea', 'Southeast Asia', 'Sri Lanka', 'East Africa'].map((corridor) => (
                  <button
                    key={corridor}
                    type="button"
                    onClick={() => setFilterCorridor(corridor)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                      filterCorridor === corridor
                        ? 'bg-[rgba(157,0,255,0.4)] text-white border border-[#C14CFF]'
                        : 'text-[#81758F] hover:text-[#D9B8FF]'
                    }`}
                  >
                    {corridor}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-mono text-[#81758F] bg-[rgba(10,8,15,0.85)] px-2.5 py-1.5 rounded-xl border border-[rgba(255,255,255,0.08)]">
                CLICK ANY CORRIDOR TO HIGHLIGHT
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Route Table & Selected Corridor Telemetry */}
        <div className="w-full lg:w-[480px] xl:w-[540px] flex flex-col gap-3 min-h-0">
          {/* Route Table (Required examples: Arabian Sea Corridor, Mumbai -> Gulf, Chennai -> Singapore, Kochi -> Colombo) */}
          <div className="flex-1 flex flex-col min-h-0 maris-glass-primary rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-2xl">
            <div className="p-3 bg-[rgba(18,13,24,0.7)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#D6A7FF] uppercase tracking-wider">
                Corridor Navigation Telemetry
              </span>
              <span className="text-[10px] font-mono text-[#81758F]">
                {filteredRoutes.length} ROUTES ACTIVE
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="sticky top-0 bg-[rgba(12,10,18,0.95)] backdrop-blur-md text-[#81758F] uppercase text-[10px] tracking-wider border-b border-[rgba(255,255,255,0.08)]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">ROUTE</th>
                    <th className="py-2.5 px-2 font-semibold">VESSELS</th>
                    <th className="py-2.5 px-2 font-semibold">TRAFFIC</th>
                    <th className="py-2.5 px-3 font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {filteredRoutes.map((route) => {
                    const isSelected = selectedRoute.id === route.id;
                    const isMonitored = route.status === 'MONITORED';

                    return (
                      <tr
                        key={route.id}
                        onClick={() => setSelectedRoute(route)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[rgba(157,0,255,0.22)] text-white'
                            : 'hover:bg-[rgba(255,255,255,0.03)] text-[#F2EDF7]'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span className="truncate max-w-[170px]">{route.name}</span>
                          </div>
                          <div className="text-[10px] text-[#81758F] truncate max-w-[170px]">
                            {route.corridor}
                          </div>
                        </td>

                        <td className="py-2.5 px-2 font-bold text-[#67E8F9]">
                          {route.vessels}
                        </td>

                        <td className="py-2.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            route.traffic === 'HIGH'
                              ? 'bg-[rgba(245,158,11,0.15)] text-[#FDE047] border border-[rgba(245,158,11,0.3)]'
                              : 'bg-[rgba(6,182,212,0.15)] text-[#67E8F9] border border-[rgba(6,182,212,0.3)]'
                          }`}>
                            {route.traffic}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isMonitored
                              ? 'bg-[rgba(239,68,68,0.18)] text-[#F87171] border border-[rgba(239,68,68,0.4)]'
                              : 'bg-[rgba(16,185,129,0.15)] text-[#34D399] border border-[rgba(16,185,129,0.35)]'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${isMonitored ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                            {route.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Route Detailed Glass Dossier */}
          {selectedRoute && (
            <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.25)] p-3.5 space-y-2.5 font-mono text-xs shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  <h3 className="font-bold text-sm text-[#F2EDF7]">{selectedRoute.name}</h3>
                  <p className="text-[10px] text-[#81758F]">{selectedRoute.corridor}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-[rgba(157,0,255,0.2)] text-[#D6A7FF] border border-[rgba(176,38,255,0.4)] text-[10px] font-bold">
                  AVG {selectedRoute.avgSpeed}
                </span>
              </div>

              <p className="text-[11px] text-[#B9ADBF] leading-relaxed">
                {selectedRoute.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)]">
                  <span className="text-[9px] text-[#81758F] block">ORIGIN</span>
                  <span className="text-[#F2EDF7] font-semibold">{selectedRoute.origin}</span>
                </div>
                <div className="p-2 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)]">
                  <span className="text-[9px] text-[#81758F] block">DESTINATION</span>
                  <span className="text-[#67E8F9] font-semibold">{selectedRoute.destination}</span>
                </div>
              </div>

              {selectedRoute.chokepoints && selectedRoute.chokepoints.length > 0 && (
                <div className="p-2 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)]">
                  <span className="text-[9px] text-[#81758F] block mb-1">MONITORED CHOKEPOINTS</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedRoute.chokepoints.map((cp) => (
                      <span key={cp} className="px-1.5 py-0.5 rounded bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#FF858D] text-[10px]">
                        {cp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {onFocusRouteOnGlobe && (
                <button
                  type="button"
                  onClick={() => onFocusRouteOnGlobe(selectedRoute)}
                  className="w-full py-2 rounded-lg maris-btn-investigate font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Inspect Route on 3D Globe</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
