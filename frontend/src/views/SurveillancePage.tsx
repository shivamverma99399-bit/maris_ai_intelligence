"use client";
import React, { useState, useMemo } from 'react';
import {
  Layers,
  Filter,
  Compass,
  Ship,
  Waves,
  MapPin,
  Eye,
  Radio,
  Share2,
  AlertTriangle,
  RotateCw,
  Satellite,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Incident, Vessel } from '../types';
import { EarthGlobe3D } from '../components/EarthGlobe3D';
import { INDIAN_VESSELS } from '../data/indianVessels';

interface SurveillancePageProps {
  incidents: Incident[];
  selectedIncident: Incident;
  onSelectIncident: (incident: Incident) => void;
  onInitiateInvestigation?: (incident: Incident) => void;
  vessels?: Vessel[];
  selectedVessel?: Vessel | null;
  onSelectVessel?: (vessel: Vessel) => void;
}

export const SurveillancePage: React.FC<SurveillancePageProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onInitiateInvestigation,
  vessels = INDIAN_VESSELS,
  selectedVessel,
  onSelectVessel,
}) => {
  // Layer toggles required:
  // AIS VESSELS, SHIPPING ROUTES, PORTS, OIL SPILLS, OCEAN CURRENTS, SATELLITE
  const [layers, setLayers] = useState({
    aisVessels: true,
    shippingRoutes: true,
    ports: true,
    oilSpills: true,
    oceanCurrents: true,
    satellite: true,
  });

  // Filter state required:
  // REGION: All, Arabian Sea, Bay of Bengal, Indian Ocean
  // VESSEL TYPE: All, Oil Tanker, Container, Cargo, Fishing, LNG, Bulk Carrier
  // SEVERITY: All, Critical, High Risk, Monitored
  const [regionFilter, setRegionFilter] = useState<'All' | 'Arabian Sea' | 'Bay of Bengal' | 'Indian Ocean'>('All');
  const [vesselTypeFilter, setVesselTypeFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Critical' | 'High Risk' | 'Monitored'>('All');

  const [isControlPanelOpen, setIsControlPanelOpen] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [targetRegion, setTargetRegion] = useState<'india' | 'atlantic' | null>('india');

  // Filter vessels according to filters
  const filteredVessels = useMemo(() => {
    if (!layers.aisVessels) return [];
    return vessels.filter((v) => {
      // Type filter
      if (vesselTypeFilter !== 'All') {
        if (!v.type.toLowerCase().includes(vesselTypeFilter.toLowerCase())) {
          return false;
        }
      }
      // Region filter
      if (regionFilter === 'Arabian Sea') {
        if (v.lng > 78) return false;
      } else if (regionFilter === 'Bay of Bengal') {
        if (v.lng < 78) return false;
      }
      return true;
    });
  }, [vessels, layers.aisVessels, vesselTypeFilter, regionFilter]);

  // Filter incidents according to filters
  const filteredIncidents = useMemo(() => {
    if (!layers.oilSpills) return [];
    return incidents.filter((inc) => {
      // Severity filter
      if (severityFilter === 'Critical' && inc.severity !== 'critical') return false;
      if (severityFilter === 'High Risk' && inc.severity !== 'high') return false;
      if (severityFilter === 'Monitored' && inc.severity !== 'medium' && inc.severity !== 'low') return false;

      // Region filter
      if (regionFilter === 'Arabian Sea') {
        if (inc.lng > 78) return false;
      } else if (regionFilter === 'Bay of Bengal') {
        if (inc.lng < 78) return false;
      }
      return true;
    });
  }, [incidents, layers.oilSpills, severityFilter, regionFilter]);

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 flex relative h-full w-full overflow-hidden select-none font-mono">
      {/* 3D Earth Globe Engine occupying full view */}
      <div className="absolute inset-0 z-0 bg-[#050508]">
        <EarthGlobe3D
          incidents={filteredIncidents}
          selectedIncident={selectedIncident}
          onSelectIncident={onSelectIncident}
          vessels={filteredVessels}
          selectedVessel={selectedVessel}
          onSelectVessel={onSelectVessel}
          isRotating={isRotating}
          targetRegion={targetRegion}
          onRegionFocused={() => setTargetRegion(null)}
        />
      </div>

      {/* Floating Top Surveillance Info Bar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsControlPanelOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl maris-glass-primary border border-[rgba(157,0,255,0.35)] text-xs font-bold text-[#F2EDF7] hover:border-[#B026FF] flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#B026FF]" />
            <span>MAP LAYERS & FILTERS</span>
            {isControlPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Quick Region Focus Pill */}
          <div className="hidden sm:flex items-center gap-1 bg-[rgba(12,10,18,0.85)] p-1 rounded-xl border border-[rgba(255,255,255,0.08)] backdrop-blur-md text-xs">
            <button
              type="button"
              onClick={() => {
                setTargetRegion('india');
                setRegionFilter('All');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                regionFilter === 'All' ? 'bg-[#B026FF] text-white font-bold' : 'text-[#81758F] hover:text-white'
              }`}
            >
              🇮🇳 All Indian Waters
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetRegion('india');
                setRegionFilter('Arabian Sea');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                regionFilter === 'Arabian Sea' ? 'bg-[#B026FF] text-white font-bold' : 'text-[#81758F] hover:text-white'
              }`}
            >
              Arabian Sea
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetRegion('india');
                setRegionFilter('Bay of Bengal');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                regionFilter === 'Bay of Bengal' ? 'bg-[#B026FF] text-white font-bold' : 'text-[#81758F] hover:text-white'
              }`}
            >
              Bay of Bengal
            </button>
          </div>
        </div>

        {/* Right Status Badge */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl maris-glass-primary border border-[rgba(255,255,255,0.08)] text-xs text-[#D9B8FF] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span className="hidden md:inline">SURVEILLANCE RADAR ACTIVE</span>
            <span className="text-[#67E8F9] font-bold">{filteredVessels.length} VESSELS</span>
          </div>

          <button
            type="button"
            onClick={() => setIsRotating((prev) => !prev)}
            title="Auto-Rotate Globe"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isRotating
                ? 'bg-[#B026FF] text-white border-[#C14CFF]'
                : 'maris-glass-primary text-[#81758F] hover:text-white border-[rgba(255,255,255,0.08)]'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating Map-Control Panel (Left Drawer/Flyout) */}
      {isControlPanelOpen && (
        <div className="absolute top-14 left-4 z-20 w-80 sm:w-88 max-h-[calc(100vh-130px)] overflow-y-auto maris-glass-primary rounded-2xl border border-[rgba(157,0,255,0.3)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-4 animate-fade-in backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#B026FF]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F2EDF7]">
                MAP CONTROLS
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsControlPanelOpen(false)}
              className="text-[#81758F] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MAP LAYERS (Required Toggles) */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#81758F] tracking-wider block">
              MAP LAYERS
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'aisVessels' as const, label: 'AIS VESSELS', icon: Ship },
                { key: 'shippingRoutes' as const, label: 'SHIPPING ROUTES', icon: Share2 },
                { key: 'ports' as const, label: 'PORTS', icon: MapPin },
                { key: 'oilSpills' as const, label: 'OIL SPILLS', icon: AlertTriangle },
                { key: 'oceanCurrents' as const, label: 'OCEAN CURRENTS', icon: Waves },
                { key: 'satellite' as const, label: 'SATELLITE', icon: Satellite },
              ].map(({ key, label, icon: Icon }) => {
                const isActive = layers[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleLayer(key)}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[rgba(157,0,255,0.25)] border-[#B026FF] text-[#F2EDF7] shadow-[0_0_8px_rgba(157,0,255,0.2)]'
                        : 'bg-[rgba(18,13,24,0.6)] border-[rgba(255,255,255,0.06)] text-[#81758F] hover:text-[#D9B8FF]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C14CFF]' : 'text-[#81758F]'}`} />
                      <span className="text-[10px] font-bold">{label}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-[#B026FF] text-white' : 'bg-[rgba(255,255,255,0.06)] text-[#81758F]'
                    }`}>
                      {isActive ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* REGION FILTER (Required: All, Arabian Sea, Bay of Bengal, Indian Ocean) */}
          <div className="space-y-1.5 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <span className="text-[10px] uppercase font-bold text-[#81758F] tracking-wider block">
              REGION
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(['All', 'Arabian Sea', 'Bay of Bengal', 'Indian Ocean'] as const).map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => {
                    setRegionFilter(reg);
                    setTargetRegion('india');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] transition-all cursor-pointer text-center ${
                    regionFilter === reg
                      ? 'bg-[rgba(157,0,255,0.35)] border border-[#C14CFF] text-white font-bold'
                      : 'bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] text-[#81758F] hover:text-white'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* VESSEL TYPE FILTER (Required: All, Oil Tanker, Container, Cargo, Fishing, LNG, Bulk Carrier) */}
          <div className="space-y-1.5 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <span className="text-[10px] uppercase font-bold text-[#81758F] tracking-wider block">
              VESSEL TYPE
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {['All', 'Oil Tanker', 'Container', 'Cargo', 'Fishing', 'LNG', 'Bulk Carrier'].map((vt) => (
                <button
                  key={vt}
                  type="button"
                  onClick={() => setVesselTypeFilter(vt)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] transition-all cursor-pointer text-center truncate ${
                    vesselTypeFilter === vt
                      ? 'bg-[rgba(6,182,212,0.25)] border border-[#06B6D4] text-[#67E8F9] font-bold'
                      : 'bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] text-[#81758F] hover:text-white'
                  }`}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>

          {/* SEVERITY FILTER (Required: All, Critical, High Risk, Monitored) */}
          <div className="space-y-1.5 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <span className="text-[10px] uppercase font-bold text-[#81758F] tracking-wider block">
              SEVERITY
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(['All', 'Critical', 'High Risk', 'Monitored'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] transition-all cursor-pointer text-center ${
                    severityFilter === sev
                      ? sev === 'Critical'
                        ? 'bg-[rgba(239,68,68,0.3)] border border-red-500 text-[#FF858D] font-bold'
                        : sev === 'High Risk'
                        ? 'bg-[rgba(245,158,11,0.3)] border border-amber-500 text-[#FDE047] font-bold'
                        : 'bg-[rgba(157,0,255,0.35)] border border-[#C14CFF] text-white font-bold'
                      : 'bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] text-[#81758F] hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Selected Vessel / Incident Heads-Up Banner at Bottom */}
      {(selectedVessel || selectedIncident) && (
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
          <div className="pointer-events-auto maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.35)] px-4 py-2.5 shadow-2xl flex items-center gap-4 flex-wrap max-w-2xl backdrop-blur-2xl">
            {selectedVessel ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(157,0,255,0.2)] border border-[#B026FF] flex items-center justify-center">
                  <Ship className="w-4 h-4 text-[#D9B8FF]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F2EDF7]">{selectedVessel.name}</div>
                  <div className="text-[10px] text-[#81758F]">
                    {selectedVessel.type} • {selectedVessel.speed} • Heading {selectedVessel.heading}
                  </div>
                </div>
                <div className="text-[11px] text-[#67E8F9] font-bold">
                  Dest: {selectedVessel.destination}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.2)] border border-red-500 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#FF858D]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F2EDF7]">{selectedIncident.id}</div>
                  <div className="text-[10px] text-[#81758F]">{selectedIncident.location}</div>
                </div>
                {onInitiateInvestigation && (
                  <button
                    type="button"
                    onClick={() => onInitiateInvestigation(selectedIncident)}
                    className="px-2.5 py-1 rounded-lg maris-btn-investigate text-[10px] font-bold text-white cursor-pointer"
                  >
                    INVESTIGATE
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
