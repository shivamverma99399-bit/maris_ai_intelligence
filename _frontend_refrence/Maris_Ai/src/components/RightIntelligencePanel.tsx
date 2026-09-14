import React, { useState } from 'react';
import { Droplet, TrendingUp, BarChart2, Anchor, Ship, Wind, Navigation, Compass, Radio, ArrowLeft, ShieldCheck, MapPin, Play } from 'lucide-react';
import { Incident, Vessel, SimulationState, InvestigationStage } from '../types';
import { InvestigationBriefingPanel } from './InvestigationBriefingPanel';

interface RightIntelligencePanelProps {
  incident: Incident;
  onInitiateInvestigation: (incident: Incident) => void;
  timelineHour?: number;
  selectedVessel?: Vessel | null;
  onClearVessel?: () => void;
  onFocusVessel?: (vessel: Vessel) => void;
  simulationState?: SimulationState;
  onRestartSimulation?: () => void;
  onSelectStage?: (stage: InvestigationStage) => void;
}

export const RightIntelligencePanel: React.FC<RightIntelligencePanelProps> = ({
  incident,
  onInitiateInvestigation,
  timelineHour = 12,
  selectedVessel,
  onClearVessel,
  onFocusVessel,
  simulationState,
  onRestartSimulation,
  onSelectStage,
}) => {
  const [hoveredBar, setHoveredBar] = useState<{ time: string; value: number } | null>(null);
  const [hoveredGraphPoint, setHoveredGraphPoint] = useState<{
    time: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  // SVG dimensions for Line Chart
  const svgWidth = 240;
  const svgHeight = 75;
  const paddingX = 10;
  const paddingY = 8;

  // Compute points for SVG path
  const graphPoints = incident.graphsData.map((d, index) => {
    const x =
      paddingX +
      (index / (incident.graphsData.length - 1)) * (svgWidth - paddingX * 2);
    // scale max 1250
    const normalizedY = Math.min(1, Math.max(0, d.value / 1250));
    const y = svgHeight - paddingY - normalizedY * (svgHeight - paddingY * 2);
    return { x, y, time: d.time, value: d.value };
  });

  const pathD = graphPoints.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = graphPoints[idx - 1];
    const midX = (prev.x + pt.x) / 2;
    return `${acc} C ${midX},${prev.y} ${midX},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${graphPoints[graphPoints.length - 1].x},${svgHeight} L ${graphPoints[0].x},${svgHeight} Z`;

  // Determine which bar is closest to the scrubber timelineHour
  const activeBarIndex = Math.min(
    incident.caprenisData.length - 1,
    Math.floor((timelineHour / 24) * incident.caprenisData.length)
  );

  // ----------------------------------------------------
  // IF INVESTIGATION SIMULATION IS ACTIVE: RENDER BRIEFING
  // ----------------------------------------------------
  if (simulationState && simulationState.stage > 0) {
    return (
      <section
        id="right-incident-intelligence-panel"
        aria-label="Investigation Intelligence Briefing Panel"
        className="w-72 xl:w-80 shrink-0 flex flex-col h-full bg-[rgba(10,8,15,0.78)] backdrop-blur-[24px] border border-[rgba(176,38,255,0.35)] rounded-xl overflow-y-auto p-3.5 space-y-3 shadow-[0_15px_45px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] relative maris-edge-diffusion"
      >
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-[radial-gradient(circle,rgba(157,0,255,0.18)_0%,rgba(157,0,255,0.05)_35%,transparent_70%)]" />
        </div>
        <InvestigationBriefingPanel
          simulationState={simulationState}
          onRestart={onRestartSimulation || (() => {})}
          onSelectStage={onSelectStage || (() => {})}
        />
      </section>
    );
  }

  // ----------------------------------------------------
  // IF AN INDIAN VESSEL IS SELECTED: RENDER AIS DOSSIER
  // ----------------------------------------------------
  if (selectedVessel) {
    let typeBadgeColor = 'border-[rgba(6,182,212,0.4)] text-[#67E8F9] bg-[rgba(6,182,212,0.12)]';
    if (selectedVessel.type === 'Oil Tanker') {
      typeBadgeColor = 'border-[rgba(245,158,11,0.4)] text-[#FBBF24] bg-[rgba(245,158,11,0.12)]';
    } else if (selectedVessel.type === 'LNG Carrier') {
      typeBadgeColor = 'border-[rgba(16,185,129,0.4)] text-[#34D399] bg-[rgba(16,185,129,0.12)]';
    } else if (selectedVessel.name.includes('ICGS')) {
      typeBadgeColor = 'border-[rgba(192,132,252,0.4)] text-[#D8B4FE] bg-[rgba(192,132,252,0.15)]';
    }

    return (
      <section
        id="right-incident-intelligence-panel"
        aria-label="Vessel Telemetry Intelligence Panel"
        className="w-72 xl:w-80 shrink-0 flex flex-col h-full bg-[rgba(10,8,15,0.70)] backdrop-blur-[20px] border border-[rgba(6,182,212,0.3)] rounded-xl overflow-y-auto p-4 space-y-3.5 shadow-[0_15px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)] relative maris-edge-diffusion"
      >
        {/* Ambient cyan glow */}
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,rgba(6,182,212,0.04)_35%,transparent_70%)]" />
        </div>

        {/* Panel Header with back button */}
        <div className="pb-1 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            {onClearVessel && (
              <button
                type="button"
                onClick={onClearVessel}
                title="Back to Incident Intelligence"
                className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] text-[#81758F] hover:text-[#F2EDF7] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#67E8F9] font-mono">
              Vessel AIS Telemetry
            </h2>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgba(6,182,212,0.15)] text-[#67E8F9] border border-[rgba(6,182,212,0.3)]">
            LIVE FEED
          </span>
        </div>

        {/* Vessel Primary Card */}
        <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(6,182,212,0.25)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] relative z-10">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-[rgba(6,30,45,0.85)] border border-[rgba(6,182,212,0.45)] rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Ship className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-[#F2EDF7] tracking-wide truncate">
                  {selectedVessel.name}
                </h3>
                <span className="text-xs">🇮🇳</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-mono border ${typeBadgeColor}`}>
                  {selectedVessel.type}
                </span>
                <span className="text-[9px] font-mono text-[#6EE7B7] flex items-center gap-0.5">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> AIS Class A
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Navigational Specs Grid */}
        <div className="space-y-1.5 relative z-10">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#81758F] flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#38BDF8]" /> Real-time Navigation
          </h4>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2 rounded-lg bg-[rgba(18,13,24,0.5)] border border-[rgba(255,255,255,0.05)]">
              <div className="text-[9px] text-[#81758F]">SPEED (SOG)</div>
              <div className="text-xs font-bold text-[#67E8F9] mt-0.5">{selectedVessel.speed}</div>
            </div>
            <div className="p-2 rounded-lg bg-[rgba(18,13,24,0.5)] border border-[rgba(255,255,255,0.05)]">
              <div className="text-[9px] text-[#81758F]">HEADING (COG)</div>
              <div className="text-xs font-bold text-[#FDE047] mt-0.5">{selectedVessel.heading}</div>
            </div>
            <div className="p-2 rounded-lg bg-[rgba(18,13,24,0.5)] border border-[rgba(255,255,255,0.05)]">
              <div className="text-[9px] text-[#81758F]">POSITION LAT</div>
              <div className="text-xs font-bold text-[#E2E8F0] mt-0.5">{selectedVessel.lat.toFixed(4)}° N</div>
            </div>
            <div className="p-2 rounded-lg bg-[rgba(18,13,24,0.5)] border border-[rgba(255,255,255,0.05)]">
              <div className="text-[9px] text-[#81758F]">POSITION LNG</div>
              <div className="text-xs font-bold text-[#E2E8F0] mt-0.5">{selectedVessel.lng.toFixed(4)}° E</div>
            </div>
          </div>
        </div>

        {/* Voyage & Cargo Dossier */}
        <div className="p-2.5 rounded-xl bg-[rgba(18,13,24,0.55)] border border-[rgba(255,255,255,0.06)] space-y-2 relative z-10 text-[10.5px] font-mono">
          <div className="flex items-center justify-between pb-1 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[10px] uppercase text-[#81758F] font-bold">Voyage Manifest</span>
            <span className="text-[9px] text-[#6EE7B7] font-semibold">UNDERWAY // NORMAL</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#81758F]">Origin:</span>
            <span className="text-[#F2EDF7] font-semibold text-right">{selectedVessel.origin || 'Arabian Sea Corridor'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#81758F]">Destination:</span>
            <span className="text-[#FDE047] font-bold text-right">{selectedVessel.destination}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#81758F]">ETA:</span>
            <span className="text-[#67E8F9] text-right">{selectedVessel.eta || 'Within 24h'}</span>
          </div>
          {selectedVessel.cargo && (
            <div className="flex justify-between">
              <span className="text-[#81758F]">Cargo:</span>
              <span className="text-[#E2E8F0] text-right truncate max-w-[140px]">{selectedVessel.cargo}</span>
            </div>
          )}
          {selectedVessel.operator && (
            <div className="flex justify-between">
              <span className="text-[#81758F]">Operator:</span>
              <span className="text-[#D6A7FF] text-right truncate max-w-[140px]">{selectedVessel.operator}</span>
            </div>
          )}
        </div>

        {/* Vessel Registry Specs */}
        <div className="p-2.5 rounded-xl bg-[rgba(18,13,24,0.55)] border border-[rgba(255,255,255,0.06)] space-y-1.5 relative z-10 text-[10.5px] font-mono">
          <div className="flex justify-between text-[#81758F] text-[9.5px]">
            <span>IMO: <strong className="text-[#E2E8F0]">{selectedVessel.imo || '9253456'}</strong></span>
            <span>CALL SIGN: <strong className="text-[#E2E8F0]">{selectedVessel.callSign || 'ATWN'}</strong></span>
          </div>
          <div className="flex justify-between text-[#81758F] text-[9.5px]">
            <span>DWT: <strong className="text-[#E2E8F0]">{selectedVessel.dwt || '149,800 DWT'}</strong></span>
            <span>LENGTH: <strong className="text-[#E2E8F0]">{selectedVessel.length || '274m'}</strong></span>
          </div>
        </div>

        {/* Environmental Safety Status */}
        <div className="p-2.5 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.3)] flex items-center gap-2 relative z-10">
          <ShieldCheck className="w-5 h-5 text-[#34D399] shrink-0" />
          <div className="text-[10px] font-mono leading-tight">
            <span className="text-[#34D399] font-bold block">NO POLLUTION RISKS</span>
            <span className="text-[#94A3B8]">Safe distance from active slicks. SAR radar clear.</span>
          </div>
        </div>

        {/* Action Button: Re-focus on globe */}
        <div className="pt-1 relative z-10">
          <button
            type="button"
            onClick={() => onFocusVessel && onFocusVessel(selectedVessel)}
            className="w-full py-2 px-3 rounded-lg bg-[rgba(6,182,212,0.25)] hover:bg-[rgba(6,182,212,0.4)] border border-[rgba(6,182,212,0.5)] text-[#67E8F9] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            <Navigation className="w-3.5 h-3.5" />
            Focus Vessel on 3D Globe
          </button>
        </div>
      </section>
    );
  }

  // ----------------------------------------------------
  // STANDARD INCIDENT INTELLIGENCE PANEL
  // ----------------------------------------------------
  return (
    <section
      id="right-incident-intelligence-panel"
      aria-label="Incident Intelligence Panel"
      className="w-72 xl:w-80 shrink-0 flex flex-col h-full bg-[rgba(10,8,15,0.70)] backdrop-blur-[20px] border border-[rgba(139,35,204,0.25)] rounded-xl overflow-y-auto p-4 space-y-3.5 shadow-[0_15px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)] relative maris-edge-diffusion"
    >
      {/* Subtle ambient lighting behind panel */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-[radial-gradient(circle,rgba(157,0,255,0.12)_0%,rgba(157,0,255,0.04)_35%,transparent_70%)]" />
      </div>

      {/* Panel Main Title */}
      <div className="pb-1 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between relative z-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#D9B8FF]">
          Incident Intelligence
        </h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgba(176,38,255,0.15)] text-[#D6A7FF] border border-[rgba(176,38,255,0.3)]">
          DEMO DATA
        </span>
      </div>

      {/* Selected Incident Header Block */}
      <div className="p-2.5 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 bg-[rgba(25,17,34,0.85)] border border-[rgba(176,38,255,0.45)] rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(157,0,255,0.25)]">
            <Droplet className="w-5 h-5 text-[#C14CFF] fill-[#C14CFF]/35 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-mono font-bold text-[#F2EDF7] tracking-wider">
                {incident.id}
              </h3>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${
                  incident.severity === 'critical'
                    ? 'bg-[rgba(130,20,30,0.25)] border border-[rgba(255,70,80,0.65)] text-[#FF858D]'
                    : incident.severity === 'high'
                    ? 'bg-[rgba(70,40,15,0.35)] border border-[rgba(245,158,11,0.5)] text-[#FBBF24]'
                    : 'bg-[rgba(60,25,85,0.35)] border border-[rgba(176,38,255,0.45)] text-[#D6A7FF]'
                }`}
              >
                {incident.severity}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-ping" />
              <span className="text-[10px] font-mono uppercase font-bold text-[#C14CFF]">
                {incident.type.toUpperCase()}
              </span>
              <span className="text-[#3F2B56]">•</span>
              <span className="text-[10px] text-[#D6A7FF] font-mono truncate" title={incident.location}>
                {incident.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Information Grid: Status, Estimated Spill, Nearest Port, Vessels in Area, Traffic (Requirement 10) */}
      <div className="grid grid-cols-2 gap-2 relative z-10">
        {/* Status */}
        <div className="bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] p-2 rounded-lg border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(176,38,255,0.55)] transition-colors">
          <div className="text-[9px] text-[#81758F] uppercase mb-0.5 font-mono">Status</div>
          <div className="text-xs font-mono text-[#6EE7B7] truncate font-bold">
            {incident.status}
          </div>
        </div>

        {/* Severity */}
        <div className="bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] p-2 rounded-lg border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(176,38,255,0.55)] transition-colors">
          <div className="text-[9px] text-[#81758F] uppercase mb-0.5 font-mono">Severity</div>
          <div className="text-xs font-mono font-bold uppercase truncate text-[#FF858D]">
            {incident.severity}
          </div>
        </div>

        {/* Estimated Spill */}
        <div className="bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] p-2 rounded-lg border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(176,38,255,0.55)] transition-colors">
          <div className="text-[9px] text-[#81758F] uppercase mb-0.5 font-mono">Estimated Spill</div>
          <div className="text-xs font-mono text-[#F2EDF7] truncate font-bold text-[#FF858D]">
            {incident.estimatedSpillLiters || incident.incidentCost}
          </div>
        </div>

        {/* Maritime Traffic */}
        <div className="bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] p-2 rounded-lg border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(176,38,255,0.55)] transition-colors">
          <div className="text-[9px] text-[#81758F] uppercase mb-0.5 font-mono">Maritime Traffic</div>
          <div className="text-xs font-mono text-[#D6A7FF] truncate font-semibold">
            {incident.maritimeTraffic}
          </div>
        </div>

        {/* Nearest Port */}
        <div className="bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] p-2 rounded-lg border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(176,38,255,0.55)] transition-colors">
          <div className="text-[9px] text-[#81758F] uppercase mb-0.5 font-mono flex items-center gap-1">
            <Anchor className="w-2.5 h-2.5 text-[#67E8F9]" /> Nearest Port
          </div>
          <div className="text-xs font-mono text-[#67E8F9] truncate font-semibold">
            {incident.nearestPort || 'Rotterdam Port'}
          </div>
        </div>

        {/* Vessels In Area */}
        <div className="bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] p-2 rounded-lg border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(176,38,255,0.55)] transition-colors">
          <div className="text-[9px] text-[#81758F] uppercase mb-0.5 font-mono flex items-center gap-1">
            <Ship className="w-2.5 h-2.5 text-[#D9B8FF]" /> Vessels In Area
          </div>
          <div className="text-xs font-mono text-[#F2EDF7] truncate font-bold">
            {incident.vesselsInArea ?? 27}
          </div>
        </div>
      </div>

      {/* Ocean Current Vector Callout */}
      {incident.currentVectorName && (
        <div className="p-2 rounded-lg bg-[rgba(25,17,34,0.5)] border border-[rgba(176,38,255,0.2)] text-[10px] font-mono flex items-center justify-between">
          <span className="text-[#81758F] flex items-center gap-1">
            <Wind className="w-3 h-3 text-[#C084FC]" /> Current Vector:
          </span>
          <span className="text-[#D6A7FF] font-semibold">{incident.currentVectorName}</span>
        </div>
      )}

      {/* Action Button: Initiate Investigation (Requirement 10) */}
      <button
        id="btn-right-initiate-investigation"
        onClick={() => onInitiateInvestigation(incident)}
        className="w-full py-2.5 maris-btn-investigate rounded-lg text-xs font-bold uppercase tracking-widest text-white transition-all cursor-pointer active:scale-[0.99] relative z-10 flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(176,38,255,0.65)] hover:scale-102"
      >
        <Play className="w-3.5 h-3.5 fill-white text-white" />
        <span>INITIATE INVESTIGATION</span>
      </button>

      {/* Chart 1: Incident Caprenis (Interactive Bar Chart) */}
      <div className="space-y-2 p-2.5 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] relative group z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-[#9A8AA5] uppercase tracking-widest font-mono">
            <BarChart2 className="w-3.5 h-3.5 text-[#B026FF]" />
            <span>Incident Caprenis</span>
          </div>
          <span className="text-[9px] text-[#D6A7FF] font-mono font-bold bg-[rgba(25,17,34,0.7)] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.08)]">
            {hoveredBar ? `${hoveredBar.time}: ${hoveredBar.value}% AIS` : 'AIS-VOL'}
          </span>
        </div>

        {/* Bar Chart Canvas */}
        <div className="relative pt-1">
          <div className="flex items-end gap-1.5 h-16 w-full pl-6 pr-1">
            {incident.caprenisData.map((d, i) => {
              const heightPct = Math.max(12, Math.min(100, (d.value / 100) * 100));
              const isTimelineMatch = i === activeBarIndex;
              const isHovered = hoveredBar?.time === d.time;

              let barColor = '#47116F';
              let barShadow = 'none';

              if (isHovered || isTimelineMatch) {
                barColor = '#C14CFF';
                barShadow = '0 0 10px rgba(193, 76, 255, 0.7)';
              } else if (d.value >= 70) {
                barColor = '#A83BFF';
                barShadow = '0 0 6px rgba(168, 59, 255, 0.4)';
              } else if (d.value >= 40) {
                barColor = '#68139B';
              }

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end cursor-pointer"
                  onMouseEnter={() => setHoveredBar(d)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: barColor,
                      boxShadow: barShadow,
                    }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      isHovered ? 'scale-y-105' : ''
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Left Y-axis labels */}
          <div className="absolute left-0 top-1 bottom-4 flex flex-col justify-between text-[8px] font-mono text-[#81758F]">
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>

          {/* Bottom X-axis labels */}
          <div className="flex justify-between pl-6 pr-1 pt-1 text-[8px] font-mono text-[#81758F] border-t border-[rgba(139,35,204,0.25)]">
            <span>00:00</span>
            <span>08:00</span>
            <span>16:00</span>
            <span>22:00</span>
          </div>
        </div>
      </div>

      {/* Chart 2: Incident Graphs (Interactive Smooth Area/Line Chart) */}
      <div className="space-y-2 p-2.5 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-[#9A8AA5] uppercase tracking-widest font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-[#B026FF]" />
            <span>Incident Graphs</span>
          </div>
          <span className="text-[9px] text-[#D6A7FF] font-mono font-bold bg-[rgba(25,17,34,0.7)] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.08)]">
            {hoveredGraphPoint
              ? `${hoveredGraphPoint.time}: ${hoveredGraphPoint.value} BBL`
              : 'TELEMETRY'}
          </span>
        </div>

        {/* Line / Area Chart with Dynamic SVG & Crosshair */}
        <div className="relative pt-1">
          <div className="pl-6 h-16 w-full relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
                let closest = graphPoints[0];
                let minDiff = Math.abs(graphPoints[0].x - mouseX);
                graphPoints.forEach((pt) => {
                  const diff = Math.abs(pt.x - mouseX);
                  if (diff < minDiff) {
                    minDiff = diff;
                    closest = pt;
                  }
                });
                setHoveredGraphPoint(closest);
              }}
              onMouseLeave={() => setHoveredGraphPoint(null)}
            >
              <defs>
                <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(176, 38, 255, 0.30)" />
                  <stop offset="100%" stopColor="rgba(157, 0, 255, 0.02)" />
                </linearGradient>
                <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <line
                x1="0"
                y1={svgHeight * 0.25}
                x2={svgWidth}
                y2={svgHeight * 0.25}
                stroke="#28143D"
                strokeDasharray="2,3"
              />
              <line
                x1="0"
                y1={svgHeight * 0.5}
                x2={svgWidth}
                y2={svgHeight * 0.5}
                stroke="#28143D"
                strokeDasharray="2,3"
              />
              <line
                x1="0"
                y1={svgHeight * 0.75}
                x2={svgWidth}
                y2={svgHeight * 0.75}
                stroke="#28143D"
                strokeDasharray="2,3"
              />

              <path d={areaD} fill="url(#purpleAreaGrad)" />

              <path
                d={pathD}
                fill="none"
                stroke="#C14CFF"
                strokeWidth="2.2"
                filter="url(#purpleGlow)"
              />

              <line
                x1={paddingX + (timelineHour / 24) * (svgWidth - paddingX * 2)}
                y1="0"
                x2={paddingX + (timelineHour / 24) * (svgWidth - paddingX * 2)}
                y2={svgHeight}
                stroke="#A800FF"
                strokeWidth="1.2"
                strokeDasharray="3,3"
                opacity="0.85"
              />

              {hoveredGraphPoint && (
                <g>
                  <line
                    x1={hoveredGraphPoint.x}
                    y1="0"
                    x2={hoveredGraphPoint.x}
                    y2={svgHeight}
                    stroke="#D9B8FF"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.8"
                  />
                  <circle
                    cx={hoveredGraphPoint.x}
                    cy={hoveredGraphPoint.y}
                    r="4"
                    fill="#F2DFFF"
                    stroke="#C14CFF"
                    strokeWidth="2"
                    className="animate-ping"
                  />
                  <circle
                    cx={hoveredGraphPoint.x}
                    cy={hoveredGraphPoint.y}
                    r="3.5"
                    fill="#F2DFFF"
                    stroke="#C14CFF"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>
          </div>

          <div className="absolute left-0 top-1 bottom-4 flex flex-col justify-between text-[8px] font-mono text-[#81758F]">
            <span>1.2k</span>
            <span>600</span>
            <span>0</span>
          </div>

          <div className="flex justify-between pl-6 pr-1 pt-1 text-[8px] font-mono text-[#81758F] border-t border-[rgba(139,35,204,0.25)]">
            <span>00:00</span>
            <span>08:00</span>
            <span>16:00</span>
            <span>22:00</span>
          </div>
        </div>
      </div>
    </section>
  );
};
