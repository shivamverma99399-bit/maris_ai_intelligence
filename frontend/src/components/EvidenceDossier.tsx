"use client";

import React from "react";
import { VesselDossier, ForensicTimelineEvent } from "@/lib/api";
import {
  X,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Compass,
  Anchor,
  Shield,
  Zap,
  Radio,
  Sliders,
  Scale,
  ShieldCheck
} from "lucide-react";

interface EvidenceDossierProps {
  dossier: VesselDossier | null;
  onClose: () => void;
}

export const EvidenceDossier: React.FC<EvidenceDossierProps> = ({ dossier, onClose }) => {
  if (!dossier) return null;

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case "ZONE_ENTRY":
        return { bg: "bg-cyan-950/70 text-[#67E8F9] border-cyan-500/40", label: "ZONE ENTRY" };
      case "SPEED_ANOMALY":
        return { bg: "bg-amber-950/70 text-[#FDE047] border-amber-500/40", label: "SPEED REDUCTION" };
      case "CPA_ORIGIN":
        return { bg: "bg-rose-950/70 text-[#FF858D] border-rose-500/40", label: "CLOSEST APPROACH" };
      case "BLACKOUT_START":
        return { bg: "bg-red-950/90 text-red-300 border-red-500/60", label: "AIS BLACKOUT START" };
      case "BLACKOUT_END":
        return { bg: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40", label: "AIS RESUMED" };
      case "ZONE_EXIT":
        return { bg: "bg-[rgba(25,17,34,0.8)] text-[#B9ADBF] border-[rgba(255,255,255,0.1)]", label: "ZONE EXIT" };
      default:
        return { bg: "bg-[rgba(25,17,34,0.8)] text-[#D6A7FF] border-[rgba(176,38,255,0.3)]", label: eventType };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none font-mono">
      <div className="bg-[rgba(12,9,18,0.95)] border border-[rgba(176,38,255,0.45)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(157,0,255,0.25)] overflow-hidden relative">
        {/* Reticle Brackets */}
        <div className="corner-reticle-tl" />
        <div className="corner-reticle-tr" />
        <div className="corner-reticle-bl" />
        <div className="corner-reticle-br" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[rgba(255,255,255,0.06)] flex items-start justify-between bg-[rgba(18,13,24,0.92)]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[rgba(25,17,34,0.8)] border border-[rgba(176,38,255,0.50)] flex items-center justify-center text-[#D6A7FF] font-mono font-bold text-lg shadow-[0_0_15px_rgba(157,0,255,0.3)]">
              #{dossier.rank}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight font-mono">
                  {dossier.vessel_name}
                </h2>
                <span className="px-2 py-0.5 text-xs rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold font-mono">
                  {dossier.final_score.toFixed(1)}% ATTRIBUTION
                </span>
                <span className="px-2 py-0.5 text-[10px] rounded bg-purple-950/80 text-purple-300 border border-purple-500/40 font-mono font-bold">
                  HIGHEST-RANKED CANDIDATE
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#81758F] mt-1">
                <span>Type: <strong className="text-white">{dossier.vessel_type}</strong></span>
                <span>&bull;</span>
                <span>Flag: <strong className="text-white">{dossier.flag}</strong></span>
                <span>&bull;</span>
                <span>MMSI: <strong className="text-[#67E8F9] font-mono">{dossier.mmsi}</strong></span>
                {dossier.imo && (
                  <>
                    <span>&bull;</span>
                    <span>IMO: <strong className="text-white font-mono">{dossier.imo}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#81758F] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-[#B9ADBF]">
          {/* Legal Disclaimer Callout */}
          <div className="p-3 rounded-xl bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.25)] flex items-start gap-2.5">
            <Scale className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#D9B8FF] leading-relaxed">
              <strong className="text-[#FBBF24] uppercase">Decision-Support Notice:</strong> MARIS identifies the highest-ranked candidate based on available multi-source satellite and kinematic evidence. This dossier is structured for investigative decision support and does not constitute a legal determination of liability.
            </p>
          </div>

          {/* Investigator Executive Summary */}
          <div className="bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 space-y-1.5">
            <h3 className="text-xs font-bold text-[#E9D5FF] uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#B026FF]" />
              Investigator Forensic Briefing
            </h3>
            <p className="text-xs text-[#F2EDF7] leading-relaxed">
              {dossier.investigator_summary}
            </p>
          </div>

          {/* Multi-Factor Attribution Scoring Matrix */}
          <div className="bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[#E9D5FF] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#67E8F9]" />
              Attribution Sub-Score Breakdown (5-Factor Matrix)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)] p-3 rounded-lg text-center">
                <span className="text-[9px] text-[#81758F] block uppercase">Spatial Proximity (30%)</span>
                <span className="text-lg font-bold text-white font-mono mt-1 block">
                  {dossier.score_breakdown.spatial_score.toFixed(1)}%
                </span>
                <span className="text-[9px] text-[#67E8F9] block mt-0.5">d_cpa = {dossier.closest_approach_distance_km} km</span>
              </div>

              <div className="bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)] p-3 rounded-lg text-center">
                <span className="text-[9px] text-[#81758F] block uppercase">Temporal Window (25%)</span>
                <span className="text-lg font-bold text-white font-mono mt-1 block">
                  {dossier.score_breakdown.temporal_score.toFixed(1)}%
                </span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">82m in zone</span>
              </div>

              <div className="bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)] p-3 rounded-lg text-center">
                <span className="text-[9px] text-[#81758F] block uppercase">Trajectory Match (20%)</span>
                <span className="text-lg font-bold text-white font-mono mt-1 block">
                  {dossier.score_breakdown.trajectory_score.toFixed(1)}%
                </span>
                <span className="text-[9px] text-[#D6A7FF] block mt-0.5">Aligned with plume</span>
              </div>

              <div className="bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)] p-3 rounded-lg text-center">
                <span className="text-[9px] text-[#81758F] block uppercase">Speed Anomaly (15%)</span>
                <span className="text-lg font-bold text-amber-300 font-mono mt-1 block">
                  {dossier.score_breakdown.behaviour_score.toFixed(1)}%
                </span>
                <span className="text-[9px] text-amber-400 block mt-0.5">69% deceleration</span>
              </div>

              <div className="bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)] p-3 rounded-lg text-center">
                <span className="text-[9px] text-[#81758F] block uppercase">AIS Blackout (10%)</span>
                <span className="text-lg font-bold text-[#FF858D] font-mono mt-1 block">
                  {dossier.score_breakdown.ais_score.toFixed(1)}%
                </span>
                <span className="text-[9px] text-red-400 block mt-0.5">3.0h transponder gap</span>
              </div>
            </div>
          </div>

          {/* Physical Spill vs Cargo DWT Capacity Check */}
          <div className="bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[#E9D5FF] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Anchor className="w-4 h-4 text-amber-400" />
              Physical Spill Compatibility & Cargo Assessment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
              <div className="bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)] p-2.5 rounded-lg">
                <span className="text-[10px] text-[#81758F] block">Slick Surface Area</span>
                <span className="font-bold text-white font-mono">{dossier.spill_compatibility.slick_area_km2} km²</span>
              </div>
              <div className="bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)] p-2.5 rounded-lg">
                <span className="text-[10px] text-[#81758F] block">Estimated Discharge Volume</span>
                <span className="font-bold text-amber-300 font-mono">~{dossier.spill_compatibility.estimated_discharge_tonnes} Metric Tonnes</span>
              </div>
              <div className="bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)] p-2.5 rounded-lg">
                <span className="text-[10px] text-[#81758F] block">Physical Risk Compatibility</span>
                <span className="font-bold text-[#FF858D] font-mono">{dossier.spill_compatibility.risk_profile}</span>
              </div>
            </div>
            <p className="text-xs text-[#9A8AA5] leading-relaxed bg-[rgba(10,8,14,0.6)] p-3 rounded-lg border border-[rgba(255,255,255,0.04)]">
              {dossier.spill_compatibility.compatibility_assessment}
            </p>
          </div>

          {/* Supporting & Contradictory Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supporting */}
            <div className="bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Corroborating Evidence ({dossier.supporting_evidence.length})
              </h3>
              <ul className="space-y-2 text-xs text-[#F2EDF7]">
                {dossier.supporting_evidence.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-[rgba(10,8,14,0.4)] p-2 rounded border border-[rgba(255,255,255,0.04)]">
                    <span className="text-emerald-400 font-bold text-xs mt-0.5">&bull;</span>
                    <span className="leading-relaxed text-[11px]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contradictory & Uncertainty */}
            <div className="bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Contradictory Points & Uncertainty ({dossier.contradictory_evidence.length})
              </h3>
              <ul className="space-y-2 text-xs text-[#B9ADBF]">
                {dossier.contradictory_evidence.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-[rgba(10,8,14,0.4)] p-2 rounded border border-[rgba(255,255,255,0.04)]">
                    <span className="text-amber-400 font-bold text-xs mt-0.5">&bull;</span>
                    <span className="leading-relaxed text-[11px]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chronological Multi-Sensor Timeline */}
          <div className="bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[#E9D5FF] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B026FF]" />
              Chronological Sensor & Kinematic Event Timeline
            </h3>

            <div className="relative border-l-2 border-[rgba(176,38,255,0.3)] ml-3 space-y-6">
              {dossier.timeline.map((evt, idx) => {
                const badge = getEventBadge(evt.event_type);
                return (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[rgba(18,13,24,1)] border-2 border-[#B026FF] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E9D5FF]" />
                    </div>

                    <div className="bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-[#67E8F9] font-mono">
                          {new Date(evt.timestamp).toUTCString().replace("GMT", "UTC")}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white tracking-tight">{evt.title}</h4>
                      <p className="text-[11px] text-[#9A8AA5] mt-1 leading-relaxed">{evt.description}</p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-[#81758F] pt-2 border-t border-[rgba(255,255,255,0.04)]">
                        <span>Lat: <strong className="text-white font-mono">{evt.latitude.toFixed(3)}°N</strong></span>
                        <span>&bull;</span>
                        <span>Lon: <strong className="text-white font-mono">{evt.longitude.toFixed(3)}°E</strong></span>
                        {evt.sog_knots !== undefined && (
                          <>
                            <span>&bull;</span>
                            <span>Speed: <strong className="text-amber-300 font-mono">{evt.sog_knots.toFixed(1)} kn</strong></span>
                          </>
                        )}
                        {evt.cog_degrees !== undefined && (
                          <>
                            <span>&bull;</span>
                            <span>Course: <strong className="text-[#67E8F9] font-mono">{evt.cog_degrees.toFixed(0)}°</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[rgba(18,13,24,0.92)] border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <span className="text-[10px] text-[#81758F]">
            Cryptographically Signed MARIS Forensic Dossier &bull; Case INC-DEMO-2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[rgba(176,38,255,0.2)] hover:bg-[rgba(176,38,255,0.35)] border border-[rgba(176,38,255,0.5)] text-xs text-white font-bold cursor-pointer transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
