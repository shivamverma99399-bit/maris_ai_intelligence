import React, { useState } from 'react';
import {
  Ship,
  Search,
  Filter,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronRight,
  X,
  Compass,
  Anchor,
  Clock,
  MapPin,
} from 'lucide-react';
import { Vessel } from '../types';
import { INDIAN_VESSELS } from '../data/indianVessels';

interface FleetPageProps {
  onSelectVesselOnGlobe?: (vessel: Vessel) => void;
  onNavigateToSurveillance?: (vessel: Vessel) => void;
}

export const FleetPage: React.FC<FleetPageProps> = ({
  onSelectVesselOnGlobe,
  onNavigateToSurveillance,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(INDIAN_VESSELS[0]);

  const filteredVessels = INDIAN_VESSELS.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.destination.toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q) ||
      (v.operator && v.operator.toLowerCase().includes(q)) ||
      (v.cargo && v.cargo.toLowerCase().includes(q)) ||
      (v.imo && v.imo.toLowerCase().includes(q)) ||
      (v.flag && v.flag.toLowerCase().includes(q));

    const matchesType =
      selectedType === 'ALL' || v.type.toLowerCase().includes(selectedType.toLowerCase());

    const matchesStatus =
      selectedStatus === 'ALL' || v.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-5 max-w-[1700px] w-full mx-auto animate-fade-in">
      {/* Header & Simulated Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(157,0,255,0.14)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#F2EDF7] font-mono">
              Fleet Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(176,38,255,0.2)] border border-[rgba(176,38,255,0.45)] text-[#E9D5FF] tracking-wider">
              DEMO / SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-[#81758F] font-mono mt-0.5">
            Real-time AIS transponder feeds across Indian Exclusive Economic Zone (EEZ) & international corridors
          </p>
        </div>

        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgba(18,13,24,0.65)] border border-[rgba(255,255,255,0.08)] font-mono text-xs text-[#D9B8FF]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>AIS RECEIVERS: 48 COASTAL STATIONS ONLINE</span>
        </div>
      </div>

      {/* Top Stat Cards (Required: VESSELS TRACKED 1,284, ACTIVE 934, ANCHORED 217, ALERT 27) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        <div className="p-3.5 rounded-xl maris-glass-card border border-[rgba(157,0,255,0.25)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#81758F]">
            Vessels Tracked
          </div>
          <div className="text-2xl font-bold font-mono text-[#F2EDF7] mt-1 flex items-baseline justify-between">
            <span>1,284</span>
            <Ship className="w-4 h-4 text-[#B026FF] opacity-70" />
          </div>
          <div className="text-[10px] font-mono text-[#6EE7B7] mt-1 flex items-center gap-1">
            <span>↑ 100% AIS Coverage</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl maris-glass-card border border-[rgba(6,182,212,0.25)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#81758F]">
            Active Underway
          </div>
          <div className="text-2xl font-bold font-mono text-[#67E8F9] mt-1 flex items-baseline justify-between">
            <span>934</span>
            <Navigation className="w-4 h-4 text-[#06B6D4] opacity-70" />
          </div>
          <div className="text-[10px] font-mono text-[#81758F] mt-1">
            72.7% of monitored fleet
          </div>
        </div>

        <div className="p-3.5 rounded-xl maris-glass-card border border-[rgba(245,158,11,0.25)] relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#81758F]">
            Anchored / Moored
          </div>
          <div className="text-2xl font-bold font-mono text-[#FDE047] mt-1 flex items-baseline justify-between">
            <span>217</span>
            <Anchor className="w-4 h-4 text-[#EAB308] opacity-70" />
          </div>
          <div className="text-[10px] font-mono text-[#81758F] mt-1">
            Major anchorages & ports
          </div>
        </div>

        <div className="p-3.5 rounded-xl maris-glass-card border border-[rgba(239,68,68,0.3)] relative overflow-hidden bg-[rgba(239,68,68,0.05)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#F87171]">
            Alert / Monitored
          </div>
          <div className="text-2xl font-bold font-mono text-[#FF858D] mt-1 flex items-baseline justify-between">
            <span>27</span>
            <AlertTriangle className="w-4 h-4 text-[#EF4444] animate-pulse" />
          </div>
          <div className="text-[10px] font-mono text-[#F87171] mt-1">
            Course deviation / slick proximity
          </div>
        </div>
      </div>

      {/* Main Content Area: Table + Right-Side Intelligence Panel */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Left Side: Table & Search Controls */}
        <div className="flex-1 flex flex-col min-h-0 maris-glass-primary rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-2xl">
          {/* Table Filter Controls */}
          <div className="p-3 sm:p-4 border-b border-[rgba(255,255,255,0.06)] flex flex-wrap items-center justify-between gap-3 bg-[rgba(18,13,24,0.5)]">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vessel name, IMO, cargo, flag, or destination..."
                className="w-full bg-[rgba(10,8,15,0.85)] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 pl-9 pr-4 text-xs font-mono text-[#F2EDF7] focus:outline-none focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF]"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#81758F]" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#81758F] hover:text-[#F2EDF7]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
              {['ALL', 'Oil Tanker', 'Container', 'Cargo', 'LNG Carrier'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedType === type
                      ? 'bg-[rgba(157,0,255,0.35)] text-white border border-[#C14CFF] shadow-[0_0_10px_rgba(157,0,255,0.3)]'
                      : 'text-[#81758F] hover:text-[#D9B8FF] hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
                  }`}
                >
                  {type === 'ALL' ? 'All Types' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="sticky top-0 bg-[rgba(12,10,18,0.95)] backdrop-blur-md text-[#81758F] uppercase text-[10px] tracking-wider border-b border-[rgba(255,255,255,0.08)] z-10">
                <tr>
                  <th className="py-3 px-4 font-semibold">VESSEL</th>
                  <th className="py-3 px-3 font-semibold">TYPE</th>
                  <th className="py-3 px-3 font-semibold">FLAG</th>
                  <th className="py-3 px-3 font-semibold">SPEED</th>
                  <th className="py-3 px-3 font-semibold">HEADING</th>
                  <th className="py-3 px-3 font-semibold">LOCATION</th>
                  <th className="py-3 px-3 font-semibold">DESTINATION</th>
                  <th className="py-3 px-4 font-semibold">STATUS</th>
                  <th className="py-3 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                {filteredVessels.map((vessel) => {
                  const isSelected = selectedVessel?.id === vessel.id;
                  let typeStyle = 'text-[#67E8F9] bg-[rgba(6,182,212,0.1)] border-[rgba(6,182,212,0.3)]';
                  if (vessel.type === 'Oil Tanker') {
                    typeStyle = 'text-[#FBBF24] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)]';
                  } else if (vessel.type === 'LNG Carrier') {
                    typeStyle = 'text-[#34D399] bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)]';
                  }

                  const isAlert = vessel.name.includes('Sentinel') || vessel.name.includes('Demo') || vessel.speed === '0.0 kn';

                  return (
                    <tr
                      key={vessel.id}
                      onClick={() => setSelectedVessel(vessel)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-[rgba(157,0,255,0.16)] text-white'
                          : 'hover:bg-[rgba(255,255,255,0.03)] text-[#F2EDF7]'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold">
                        <div className="flex items-center gap-2">
                          <Ship className="w-3.5 h-3.5 text-[#B026FF] group-hover:scale-110 transition-transform" />
                          <span className="truncate max-w-[160px]">{vessel.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeStyle}`}>
                          {vessel.type}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[#B9ADBF] whitespace-nowrap">
                        {vessel.flag}
                      </td>

                      <td className="py-3 px-3 text-[#67E8F9] font-bold">
                        {vessel.speed}
                      </td>

                      <td className="py-3 px-3 text-[#FDE047]">
                        {vessel.heading}
                      </td>

                      <td className="py-3 px-3 text-[#B9ADBF] text-[11px]">
                        {vessel.lat.toFixed(2)}°N, {vessel.lng.toFixed(2)}°E
                      </td>

                      <td className="py-3 px-3 text-[#F2EDF7] font-semibold">
                        {vessel.destination}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isAlert
                            ? 'bg-[rgba(239,68,68,0.18)] text-[#F87171] border border-[rgba(239,68,68,0.4)]'
                            : 'bg-[rgba(16,185,129,0.15)] text-[#34D399] border border-[rgba(16,185,129,0.35)]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                          {isAlert ? 'ACTIVE' : vessel.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVessel(vessel);
                            if (onNavigateToSurveillance) onNavigateToSurveillance(vessel);
                            else if (onSelectVesselOnGlobe) onSelectVesselOnGlobe(vessel);
                          }}
                          className="px-2 py-1 rounded bg-[rgba(157,0,255,0.2)] hover:bg-[rgba(157,0,255,0.4)] border border-[rgba(176,38,255,0.4)] text-[#D6A7FF] hover:text-white transition-all text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <span>SURVEILLANCE</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredVessels.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#81758F]">
                      No vessels matching "{searchQuery}" in simulated AIS database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right-Side Selected Vessel Intelligence Panel (as specified by prompt) */}
        {selectedVessel && (
          <div className="w-full lg:w-80 xl:w-96 maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.25)] p-4 flex flex-col gap-3.5 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#10B981] animate-pulse" />
                <span className="text-xs font-bold font-mono text-[#D6A7FF] uppercase tracking-wider">
                  Vessel Intelligence Dossier
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(6,182,212,0.15)] text-[#67E8F9] border border-[rgba(6,182,212,0.3)]">
                AIS CLASS A
              </span>
            </div>

            {/* Vessel Identity */}
            <div className="p-3.5 rounded-xl bg-[rgba(18,13,24,0.7)] border border-[rgba(255,255,255,0.06)] space-y-2 font-mono">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#F2EDF7] tracking-wide">
                    {selectedVessel.name}
                  </h3>
                  <p className="text-xs text-[#81758F]">{selectedVessel.type} • {selectedVessel.flag}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[rgba(157,0,255,0.2)] border border-[rgba(176,38,255,0.4)] flex items-center justify-center">
                  <Ship className="w-4 h-4 text-[#D6A7FF]" />
                </div>
              </div>

              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#81758F] text-[10px] block">IMO NUMBER</span>
                  <span className="text-[#F2EDF7] font-semibold">{selectedVessel.imo || '9382104'}</span>
                </div>
                <div>
                  <span className="text-[#81758F] text-[10px] block">CALL SIGN</span>
                  <span className="text-[#F2EDF7] font-semibold">{selectedVessel.callSign || 'VTDS'}</span>
                </div>
              </div>
            </div>

            {/* Live Navigation Telemetry */}
            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#81758F] font-bold">
                Navigation & Position
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[rgba(18,13,24,0.5)] border border-[rgba(255,255,255,0.06)]">
                  <div className="text-[9px] text-[#81758F]">SPEED (SOG)</div>
                  <div className="text-sm font-bold text-[#67E8F9] mt-0.5">{selectedVessel.speed}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[rgba(18,13,24,0.5)] border border-[rgba(255,255,255,0.06)]">
                  <div className="text-[9px] text-[#81758F]">HEADING (COG)</div>
                  <div className="text-sm font-bold text-[#FDE047] mt-0.5">{selectedVessel.heading}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[rgba(18,13,24,0.5)] border border-[rgba(255,255,255,0.06)]">
                  <div className="text-[9px] text-[#81758F]">CURRENT LAT</div>
                  <div className="text-xs font-bold text-[#E2E8F0] mt-0.5">{selectedVessel.lat.toFixed(4)}° N</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[rgba(18,13,24,0.5)] border border-[rgba(255,255,255,0.06)]">
                  <div className="text-[9px] text-[#81758F]">CURRENT LNG</div>
                  <div className="text-xs font-bold text-[#E2E8F0] mt-0.5">{selectedVessel.lng.toFixed(4)}° E</div>
                </div>
              </div>
            </div>

            {/* Voyage Details */}
            <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] font-mono text-xs space-y-2">
              <span className="text-[10px] uppercase text-[#81758F] font-bold block pb-1 border-b border-[rgba(255,255,255,0.06)]">
                Voyage & Manifest
              </span>
              <div className="flex justify-between">
                <span className="text-[#81758F]">Destination:</span>
                <span className="text-[#FDE047] font-bold text-right">{selectedVessel.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#81758F]">Departure Origin:</span>
                <span className="text-[#F2EDF7] text-right">{selectedVessel.origin || 'Strait of Hormuz'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#81758F]">Estimated Arrival:</span>
                <span className="text-[#67E8F9] text-right">{selectedVessel.eta || 'Today 18:00 UTC'}</span>
              </div>
              {selectedVessel.cargo && (
                <div className="flex justify-between">
                  <span className="text-[#81758F]">Cargo Manifest:</span>
                  <span className="text-[#E2E8F0] text-right max-w-[170px] truncate">{selectedVessel.cargo}</span>
                </div>
              )}
            </div>

            {/* Risk Assessment & Track History */}
            <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] font-mono text-xs space-y-2">
              <span className="text-[10px] uppercase text-[#81758F] font-bold block pb-1 border-b border-[rgba(255,255,255,0.06)]">
                Risk & Anomaly Analysis
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[#81758F]">Environmental Risk:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(16,185,129,0.15)] text-[#34D399] border border-[rgba(16,185,129,0.3)]">
                  LOW RISK (NOMINAL)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#81758F]">SAR Radar Proximity:</span>
                <span className="text-[#D6A7FF] font-semibold">14.2 km to nearest slick</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#81758F]">Track History:</span>
                <span className="text-[#67E8F9]">24h Continuous AIS</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToSurveillance) onNavigateToSurveillance(selectedVessel);
                  else if (onSelectVesselOnGlobe) onSelectVesselOnGlobe(selectedVessel);
                }}
                className="w-full py-2.5 px-3 rounded-lg maris-btn-investigate text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Track on Surveillance Globe</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
