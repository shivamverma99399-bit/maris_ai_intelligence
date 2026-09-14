"use client";
import React, { useState } from 'react';
import { Search, MoreVertical, Ship, Navigation } from 'lucide-react';
import { Incident, Vessel } from '../types';
import { IncidentCard } from './IncidentCard';
import { INDIAN_VESSELS } from '../data/indianVessels';

interface ActiveIncidentsPanelProps {
  incidents: Incident[];
  selectedIncident: Incident;
  onSelectIncident: (incident: Incident) => void;
  onInitiateInvestigation: (incident: Incident) => void;
  vessels?: Vessel[];
  selectedVessel?: Vessel | null;
  onSelectVessel?: (vessel: Vessel) => void;
  activeTab?: 'incidents' | 'vessels';
  onTabChange?: (tab: 'incidents' | 'vessels') => void;
}

export const ActiveIncidentsPanel: React.FC<ActiveIncidentsPanelProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onInitiateInvestigation,
  vessels = INDIAN_VESSELS,
  selectedVessel,
  onSelectVessel,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'incidents' | 'vessels'>('incidents');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTab = controlledTab ?? internalTab;
  const setTab = (tab: 'incidents' | 'vessels') => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const filteredIncidents = incidents.filter((inc) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    // Search against ID, location, status, date
    const matchesId = inc.id.toLowerCase().includes(q) || inc.incidentCode.toLowerCase().includes(q);
    const matchesLocation = inc.location.toLowerCase().includes(q);
    const matchesStatus =
      inc.status.toLowerCase().includes(q) ||
      inc.statusBadge.toLowerCase().includes(q) ||
      inc.severity.toLowerCase().includes(q);
    const matchesDate =
      inc.time.toLowerCase().includes(q) ||
      inc.timestamp.toLowerCase().includes(q);

    return matchesId || matchesLocation || matchesStatus || matchesDate;
  });

  const filteredVessels = vessels.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    return (
      v.name.toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q) ||
      v.destination.toLowerCase().includes(q) ||
      (v.operator && v.operator.toLowerCase().includes(q)) ||
      (v.cargo && v.cargo.toLowerCase().includes(q)) ||
      (v.imo && v.imo.toLowerCase().includes(q))
    );
  });

  return (
    <section
      id="active-incidents-panel"
      aria-label="Active Incidents Panel"
      className="w-full md:w-72 lg:w-76 xl:w-80 shrink-0 flex flex-col h-full maris-glass-primary maris-edge-diffusion rounded-xl overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.5)]"
    >
      {/* Panel Header */}
      <div className="p-3 pb-2 flex flex-col gap-2 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-[rgba(18,13,24,0.7)] border border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={() => setTab('incidents')}
              className={`px-2 py-1 rounded-md text-[10.5px] font-mono font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === 'incidents'
                  ? 'bg-[rgba(157,0,255,0.35)] text-[#FFFFFF] border border-[rgba(192,76,255,0.5)] shadow-[0_0_8px_rgba(157,0,255,0.35)]'
                  : 'text-[#81758F] hover:text-[#D9B8FF]'
              }`}
            >
              Incidents ({incidents.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('vessels')}
              className={`px-2 py-1 rounded-md text-[10.5px] font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'vessels'
                  ? 'bg-[rgba(6,182,212,0.25)] text-[#67E8F9] border border-[rgba(6,182,212,0.45)] shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                  : 'text-[#81758F] hover:text-[#67E8F9]'
              }`}
            >
              <span>🇮🇳 Indian Fleet</span>
              <span className="text-[9px] px-1 rounded bg-[rgba(255,255,255,0.08)]">
                {vessels.length}
              </span>
            </button>
          </div>
          <button
            type="button"
            id="incidents-menu-btn"
            aria-label="Active incidents options"
            className="p-1 text-[#81758F] hover:text-[#D9B8FF] transition-colors cursor-pointer rounded hover:bg-[rgba(255,255,255,0.04)]"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3.5 py-2.5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="relative flex items-center">
          <input
            id="search-incidents-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'incidents' ? "Search Incidents & Spills..." : "Search Indian Ships & AIS..."}
            aria-label="Search items"
            className="w-full bg-[rgba(18,13,24,0.65)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.08)] rounded-lg py-2 pl-3 pr-8 text-xs text-[#F2EDF7] focus:outline-none focus:border-[rgba(192,76,255,0.8)] focus:ring-1 focus:ring-[rgba(176,38,255,0.40)] placeholder:text-[#81758F] transition-all font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          />
          <Search className="w-3.5 h-3.5 absolute right-3 text-[#81758F] pointer-events-none" />
        </div>
      </div>

      {/* Scrollable Incident Cards List */}
      <div
        id="incident-cards-scroll-container"
        className="flex-1 overflow-y-auto p-3 space-y-2.5"
      >
        {activeTab === 'incidents' ? (
          <>
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                isSelected={selectedIncident.id === incident.id && !selectedVessel}
                onSelect={(inc) => {
                  onSelectIncident(inc);
                }}
                onInitiateInvestigation={onInitiateInvestigation}
              />
            ))}

            {/* Empty Search Result */}
            {filteredIncidents.length === 0 && (
              <div className="py-14 text-center text-xs text-gray-400 font-mono flex flex-col items-center justify-center gap-2">
                <span className="text-purple-400 text-sm font-bold">No incidents found</span>
                <span className="text-[11px] text-gray-500">Try searching another ID, location, or date</span>
              </div>
            )}
          </>
        ) : (
          <>
            {filteredVessels.map((vessel) => {
              const isSelected = selectedVessel?.id === vessel.id;
              let typeBadgeStyle = 'border-[rgba(6,182,212,0.4)] text-[#67E8F9] bg-[rgba(6,182,212,0.12)]';
              if (vessel.type === 'Oil Tanker') {
                typeBadgeStyle = 'border-[rgba(245,158,11,0.4)] text-[#FBBF24] bg-[rgba(245,158,11,0.12)]';
              } else if (vessel.type === 'LNG Carrier') {
                typeBadgeStyle = 'border-[rgba(16,185,129,0.4)] text-[#34D399] bg-[rgba(16,185,129,0.12)]';
              } else if (vessel.name.includes('ICGS')) {
                typeBadgeStyle = 'border-[rgba(192,132,252,0.4)] text-[#D8B4FE] bg-[rgba(192,132,252,0.15)]';
              }

              return (
                <div
                  key={vessel.id}
                  onClick={() => onSelectVessel && onSelectVessel(vessel)}
                  className={`p-3 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[rgba(6,30,45,0.75)] border-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]'
                      : 'bg-[rgba(18,13,24,0.62)] hover:bg-[rgba(25,18,35,0.78)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(6,182,212,0.35)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-1.5">
                      <Ship className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span className="font-bold text-xs text-[#F2EDF7] font-mono tracking-wide">
                        {vessel.name}
                      </span>
                    </div>
                    <span className="text-[10px]">🇮🇳</span>
                  </div>

                  <div className="mt-2 space-y-1.5 text-[10px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${typeBadgeStyle}`}>
                        {vessel.type}
                      </span>
                      <span className="text-[#67E8F9] font-bold">
                        {vessel.speed} • {vessel.heading}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#B9ADBF] pt-0.5">
                      <span className="text-[#81758F]">DESTINATION:</span>
                      <span className="text-right text-[#FDE047] font-semibold truncate max-w-[150px]">
                        {vessel.destination}
                      </span>
                    </div>

                    {vessel.cargo && (
                      <div className="flex justify-between text-[#B9ADBF]">
                        <span className="text-[#81758F]">CARGO:</span>
                        <span className="text-right text-[#E2E8F0] truncate max-w-[150px]">
                          {vessel.cargo}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-[rgba(255,255,255,0.05)] text-[9px]">
                      <span className="text-[#81758F]">
                        {vessel.lat.toFixed(2)}°N, {vessel.lng.toFixed(2)}°E
                      </span>
                      <span className="text-[#38BDF8] flex items-center gap-1 font-bold hover:underline">
                        <Navigation className="w-2.5 h-2.5" />
                        {isSelected ? 'TRACKING LIVE' : 'TRACK ON GLOBE'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredVessels.length === 0 && (
              <div className="py-14 text-center text-xs text-gray-400 font-mono flex flex-col items-center justify-center gap-2">
                <span className="text-cyan-400 text-sm font-bold">No Indian vessels found</span>
                <span className="text-[11px] text-gray-500">Try searching vessel name, cargo, or port</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
