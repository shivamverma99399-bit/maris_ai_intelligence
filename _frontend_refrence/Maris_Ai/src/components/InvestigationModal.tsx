import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Ship,
  Wind,
  Radio,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  Play,
} from 'lucide-react';
import { Incident } from '../types';

interface InvestigationModalProps {
  incident: Incident | null;
  onClose: () => void;
  onSuccess: (incident: Incident) => void;
}

export const InvestigationModal: React.FC<InvestigationModalProps> = ({
  incident,
  onClose,
  onSuccess,
}) => {
  const [isStarting, setIsStarting] = useState(false);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!incident) return null;

  const handleStartInvestigation = () => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      onSuccess(incident);
      onClose();
    }, 600);
  };

  const severityBadgeColor =
    incident.severity === 'critical'
      ? 'text-red-300 border-red-500/40 bg-red-950/60'
      : incident.severity === 'high'
      ? 'text-amber-300 border-amber-500/40 bg-amber-950/60'
      : 'text-purple-300 border-purple-500/40 bg-purple-950/60';

  return (
    <div
      id="investigation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        id="investigation-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[rgba(12,9,18,0.85)] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(157,0,255,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden flex flex-col font-mono text-[#B9ADBF] backdrop-blur-[24px] relative animate-fade-in"
      >
        {/* Reticles */}
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#B026FF] pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#B026FF] pointer-events-none" />
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#B026FF] pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#B026FF] pointer-events-none" />

        {/* Modal Header: Title as specified: "Initiate Investigation" */}
        <div className="p-5 bg-[rgba(18,13,24,0.85)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(25,17,34,0.8)] border border-[rgba(176,38,255,0.50)] flex items-center justify-center text-[#D6A7FF] shadow-[0_0_15px_rgba(157,0,255,0.3)]">
              <ShieldAlert className="w-5 h-5 text-[#B026FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#F2EDF7] tracking-wider">
                  Initiate Investigation
                </h3>
                <span
                  className={`px-2 py-0.5 text-[9px] rounded-full uppercase border font-bold ${severityBadgeColor}`}
                >
                  {incident.severity}
                </span>
              </div>
              <p className="text-xs text-[#81758F]">
                MARIS Autonomous Surface & Satellite Dispatch Protocol
              </p>
            </div>
          </div>

          <button
            id="modal-close-btn"
            onClick={onClose}
            aria-label="Close Investigation Briefing"
            className="p-1.5 rounded-lg text-[#81758F] hover:text-[#F2EDF7] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Primary Incident Parameters Required by User */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="text-[10px] text-[#81758F] uppercase block mb-1">Incident ID</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#F2EDF7] tracking-wide">{incident.id}</span>
                <span className="text-[10px] text-[#D6A7FF]">({incident.incidentCode})</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="text-[10px] text-[#81758F] uppercase block mb-1">Location</span>
              <span className="text-xs text-[#D6A7FF] font-semibold block truncate" title={incident.location}>
                {incident.location}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="text-[10px] text-[#81758F] uppercase block mb-1">Timestamp</span>
              <span className="text-xs text-[#F2EDF7] block truncate">{incident.time}</span>
            </div>

            <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="text-[10px] text-[#81758F] uppercase block mb-1">Estimated Cost</span>
              <span className="text-xs font-bold text-[#F2EDF7] block">{incident.incidentCost} USD</span>
            </div>

            <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="text-[10px] text-[#81758F] uppercase block mb-1">Maritime Traffic</span>
              <span className="text-xs text-[#D6A7FF] block">{incident.maritimeTraffic}</span>
            </div>

            <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="text-[10px] text-[#81758F] uppercase block mb-1">Severity</span>
              <div className="flex items-center gap-1.5">
                {incident.severity === 'critical' && (
                  <AlertOctagon className="w-3.5 h-3.5 text-[#FF858D]" />
                )}
                {incident.severity === 'high' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" />
                )}
                {incident.severity === 'medium' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D6A7FF]" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-[#F2EDF7]">
                  {incident.severity}
                </span>
              </div>
            </div>
          </div>

          {/* Target Vessel & Cargo Telemetry */}
          <div className="p-3.5 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] space-y-2">
            <h4 className="text-xs font-bold text-[#D6A7FF] flex items-center gap-2">
              <Ship className="w-4 h-4 text-[#B026FF]" /> TARGET VESSEL & CARGO REGISTRY
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 text-xs">
              <div>
                <span className="text-[#81758F]">Vessel: </span>
                <span className="text-[#F2EDF7] font-semibold">{incident.investigationDetails.vesselName}</span>
              </div>
              <div>
                <span className="text-[#81758F]">IMO Registry: </span>
                <span className="text-[#F2EDF7]">{incident.investigationDetails.imo}</span>
              </div>
              <div>
                <span className="text-[#81758F]">Flag State: </span>
                <span className="text-[#F2EDF7]">{incident.investigationDetails.flag}</span>
              </div>
              <div>
                <span className="text-[#81758F]">Cargo Type: </span>
                <span className="text-[#FBBF24]">{incident.investigationDetails.cargoType}</span>
              </div>
            </div>
          </div>

          {/* Environmental Dispersion & Metocean Feeds */}
          <div className="p-3.5 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] space-y-2">
            <h4 className="text-xs font-bold text-[#D6A7FF] flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#B026FF]" /> DISPERSION DYNAMICS & RADAR INTELLIGENCE
            </h4>
            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-[#81758F] block text-[10px] uppercase">Sensor Payload Correlation:</span>
                <p className="text-[#B9ADBF] mt-0.5">{incident.investigationDetails.sensorTelemetry}</p>
              </div>
              <div>
                <span className="text-[#81758F] block text-[10px] uppercase">Metocean Drift Vector:</span>
                <p className="text-[#B9ADBF] mt-0.5">{incident.investigationDetails.windDriftVector}</p>
              </div>
              <div>
                <span className="text-[#81758F] block text-[10px] uppercase">Containment Status:</span>
                <p className="text-[#FBBF24] font-semibold mt-0.5">
                  {incident.investigationDetails.containmentStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Deployed SAR & Containment Units */}
          <div className="p-3.5 rounded-xl bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] space-y-2">
            <h4 className="text-xs font-bold text-[#D6A7FF] flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#B026FF]" /> DESIGNATED INCIDENT UNITS
            </h4>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {incident.investigationDetails.assignedUnits.map((unit, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-[rgba(25,17,34,0.8)] text-xs text-[#D6A7FF] border border-[rgba(255,255,255,0.08)] font-mono"
                >
                  {unit}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-[rgba(18,13,24,0.85)] border-t border-[rgba(255,255,255,0.06)] flex items-center justify-end gap-3">
          <button
            id="btn-modal-cancel"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-[#B9ADBF] hover:text-[#F2EDF7] maris-btn-glass transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-modal-start-investigation"
            onClick={handleStartInvestigation}
            disabled={isStarting}
            className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white maris-btn-investigate transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Initiating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Investigation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
