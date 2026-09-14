import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, Play } from 'lucide-react';
import { Incident } from '../types';

interface IncidentCardProps {
  incident: Incident;
  isSelected: boolean;
  onSelect: (incident: Incident) => void;
  onInitiateInvestigation: (incident: Incident) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  isSelected,
  onSelect,
  onInitiateInvestigation,
}) => {
  const severityBadgeClass =
    incident.severity === 'critical'
      ? 'bg-[rgba(130,20,30,0.20)] border border-[rgba(255,70,80,0.55)] text-[#FF858D]'
      : incident.severity === 'high'
      ? 'bg-[rgba(70,40,15,0.3)] border border-[rgba(245,158,11,0.4)] text-[#FBBF24]'
      : 'bg-[rgba(40,20,61,0.4)] border border-[rgba(139,35,204,0.4)] text-[#D9B8FF]';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(incident);
    }
  };

  return (
    <article
      id={`incident-card-${incident.id}`}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Incident ${incident.id}, status ${incident.statusBadge}, location ${incident.location}`}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(incident)}
      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#B026FF] ${
        isSelected
          ? 'maris-incident-card-selected'
          : 'maris-incident-card-normal'
      }`}
    >
      {/* Top Header: ID, Severity Indicator & Status Pill */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-mono font-bold text-[#F2EDF7] tracking-wide">
            {incident.id}
          </span>
          {incident.severity === 'critical' && (
            <AlertOctagon className="w-3.5 h-3.5 text-[#FF858D] animate-pulse" aria-label="Critical Severity" />
          )}
          {incident.severity === 'high' && (
            <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" aria-label="High Severity" />
          )}
          {incident.severity === 'medium' && (
            <ShieldCheck className="w-3.5 h-3.5 text-[#C14CFF]" aria-label="Medium Severity" />
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${severityBadgeClass}`}
        >
          {incident.statusBadge}
        </span>
      </div>

      {/* Key-Value Telemetry Metadata */}
      <div className="space-y-1.5 text-[11px] mb-3.5 font-mono">
        <div className="flex justify-between items-center">
          <span className="text-[#81758F]">Incident:</span>
          <span className="text-[#F2EDF7] font-medium">{incident.incidentCode}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#81758F]">Time:</span>
          <span className="text-[#B9ADBF]">{incident.time}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#81758F]">Location:</span>
          <span
            className="text-[#D6A7FF] font-medium truncate max-w-[155px] text-right"
            title={incident.location}
          >
            {incident.location}
          </span>
        </div>
      </div>

      {/* Action Button: Initiate Investigation */}
      <button
        type="button"
        id={`btn-investigate-${incident.id}`}
        aria-label={`Initiate investigation for incident ${incident.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(incident);
          onInitiateInvestigation(incident);
        }}
        className={`w-full py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
          isSelected
            ? 'maris-btn-investigate shadow-[0_0_15px_rgba(176,38,255,0.6)]'
            : 'maris-btn-glass text-[#D9B8FF] hover:text-[#FFFFFF] active:scale-[0.99]'
        }`}
      >
        <Play className="w-3 h-3 fill-current" />
        <span>Initiate Investigation</span>
      </button>
    </article>
  );
};
