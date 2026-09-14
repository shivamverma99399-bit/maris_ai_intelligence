"use client";

import React from "react";
import { CandidateVessel } from "@/lib/api";
import { ShieldAlert, FileText, ChevronRight, Anchor, Navigation, Activity, Compass, Wind, AlertTriangle, ShieldCheck } from "lucide-react";

interface SuspectListProps {
  candidates: CandidateVessel[];
  selectedMmsi: number | null;
  onSelectVessel: (mmsi: number) => void;
  onOpenDossier: (mmsi: number) => void;
}

export const SuspectList: React.FC<SuspectListProps> = ({
  candidates,
  selectedMmsi,
  onSelectVessel,
  onOpenDossier,
}) => {
  const sortedCandidates = [...candidates].sort((a, b) => a.rank - b.rank);
  const topCandidate = sortedCandidates.length > 0 ? sortedCandidates[0] : null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#FF858D]";
    if (score >= 50) return "text-[#FDE047]";
    return "text-[#9A8AA5]";
  };

  const getScoreBarGradient = (score: number) => {
    if (score >= 80) return "bg-gradient-to-r from-[#B026FF] to-[#FF858D]";
    if (score >= 50) return "bg-gradient-to-r from-[#8A00E8] to-[#FDE047]";
    return "bg-gradient-to-r from-[#6D3A91] to-[#9A8AA5]";
  };

  return (
    <div className="flex flex-col h-full bg-[rgba(10,9,16,0.92)] border-l border-[rgba(157,0,255,0.22)] backdrop-blur-[20px] font-mono text-[#B9ADBF] relative overflow-hidden select-none">
      {/* Corner Reticle Brackets */}
      <div className="corner-reticle-tl" />
      <div className="corner-reticle-tr" />

      {/* Header */}
      <div className="p-4 bg-[rgba(18,13,24,0.88)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-[#F2EDF7] uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#B026FF]" />
            <span>Attribution Candidates ({sortedCandidates.length})</span>
          </h2>
          <p className="text-[10px] text-[#81758F] mt-0.5">
            5-Factor Multi-Criteria Culpability Scoring
          </p>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded bg-[rgba(176,38,255,0.18)] text-[#D6A7FF] border border-[rgba(176,38,255,0.4)] font-bold">
          DECISION SUPPORT
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* Metocean Forcing Card */}
        <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.65)] border border-[rgba(255,255,255,0.06)] space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#D6A7FF]">
            <span className="flex items-center gap-1.5 uppercase">
              <Wind className="w-3.5 h-3.5 text-[#67E8F9]" />
              Hydrodynamic Forcing
            </span>
            <span className="text-[#67E8F9]">ARABIAN SEA SECTOR</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
            <div className="p-2 rounded-lg bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)]">
              <span className="text-[#81758F] block">SURFACE CURRENT</span>
              <span className="text-white font-bold">0.34 m/s @ 048° (NE)</span>
            </div>
            <div className="p-2 rounded-lg bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)]">
              <span className="text-[#81758F] block">10M WIND LEEWAY</span>
              <span className="text-white font-bold">12.5 kn @ 245° (WSW)</span>
            </div>
          </div>
        </div>

        {/* Highest-Ranked Candidate Highlight Callout */}
        {topCandidate && (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[rgba(25,14,36,0.85)] to-[rgba(14,10,20,0.85)] border border-[rgba(176,38,255,0.6)] shadow-[0_0_20px_rgba(157,0,255,0.25)] space-y-2.5 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D9B8FF] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF858D] animate-ping" />
                HIGHEST-RANKED CANDIDATE
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300">
                HIGH CONFIDENCE
              </span>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {topCandidate.vessel_name}
                </h3>
                <span className="text-[11px] text-[#9A8AA5] block">
                  {topCandidate.vessel_type} &bull; Flag: {topCandidate.flag} &bull; MMSI {topCandidate.mmsi}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#FF858D] tracking-tight">
                  {topCandidate.final_score.toFixed(1)}%
                </span>
                <span className="text-[8px] text-[#81758F] block uppercase">ATTRIBUTION SCORE</span>
              </div>
            </div>

            <p className="text-[10px] text-[#E9D5FF] bg-[rgba(10,8,14,0.65)] p-2 rounded-lg border border-[rgba(255,255,255,0.05)] leading-relaxed">
              {topCandidate.explanation?.reason || "High spatial-temporal correlation with backtracked release cone and anomalous AIS transponder silence."}
            </p>

            <button
              type="button"
              onClick={() => onOpenDossier(topCandidate.mmsi)}
              className="w-full maris-btn-investigate py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(157,0,255,0.4)]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Inspect Legal Evidence Dossier</span>
            </button>
          </div>
        )}

        {/* Candidate Cards List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#81758F] px-1 uppercase tracking-wider">
            <span>Ranked Candidates ({sortedCandidates.length})</span>
            <span>Attribution Score</span>
          </div>

          {sortedCandidates.map((vessel) => {
            const isSelected = selectedMmsi === vessel.mmsi;
            const isTop = vessel.rank === 1;

            return (
              <div
                key={vessel.mmsi}
                onClick={() => onSelectVessel(vessel.mmsi)}
                className={`p-3 rounded-xl transition cursor-pointer border relative overflow-hidden ${
                  isSelected
                    ? "bg-[rgba(25,17,34,0.85)] border-[rgba(176,38,255,0.8)] shadow-[0_0_15px_rgba(157,0,255,0.25)]"
                    : "bg-[rgba(15,12,20,0.6)] hover:bg-[rgba(20,15,28,0.7)] border-[rgba(255,255,255,0.06)]"
                }`}
              >
                {/* Top Row: Rank, Name, Flag, Score */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs border ${
                        isTop
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-[rgba(255,255,255,0.04)] text-[#81758F] border-[rgba(255,255,255,0.08)]"
                      }`}
                    >
                      #{vessel.rank}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs tracking-tight flex items-center gap-1.5">
                        <span>{vessel.vessel_name}</span>
                        {vessel.is_synthetic && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                            EEZ AIS
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#81758F] flex items-center gap-1.5 mt-0.5">
                        <span>{vessel.vessel_type}</span>
                        <span>&bull;</span>
                        <span>{vessel.flag}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className={`text-base font-bold font-mono ${getScoreColor(vessel.final_score)}`}>
                      {vessel.final_score.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Score Progress Meter */}
                <div className="mt-2.5 w-full bg-[rgba(255,255,255,0.06)] h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBarGradient(vessel.final_score)} transition-all duration-300`}
                    style={{ width: `${Math.min(100, vessel.final_score)}%` }}
                  />
                </div>

                {/* Expanded Factor Breakdown */}
                {isSelected && (
                  <div className="mt-3 pt-2.5 border-t border-[rgba(255,255,255,0.06)] space-y-2 text-[10px] animate-fade-in">
                    <div className="grid grid-cols-5 gap-1 text-center">
                      <div className="p-1 rounded bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)]">
                        <span className="text-[#81758F] block text-[8px]">SPATIAL</span>
                        <span className="font-bold text-white">{vessel.spatial_score.toFixed(0)}</span>
                      </div>
                      <div className="p-1 rounded bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)]">
                        <span className="text-[#81758F] block text-[8px]">TEMPORAL</span>
                        <span className="font-bold text-white">{vessel.temporal_score.toFixed(0)}</span>
                      </div>
                      <div className="p-1 rounded bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)]">
                        <span className="text-[#81758F] block text-[8px]">TRAJ</span>
                        <span className="font-bold text-white">{vessel.trajectory_score.toFixed(0)}</span>
                      </div>
                      <div className="p-1 rounded bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)]">
                        <span className="text-[#81758F] block text-[8px]">BEHAV</span>
                        <span className="font-bold text-white">{vessel.behaviour_score.toFixed(0)}</span>
                      </div>
                      <div className="p-1 rounded bg-[rgba(10,8,14,0.6)] border border-[rgba(255,255,255,0.04)]">
                        <span className="text-[#81758F] block text-[8px]">AIS GAP</span>
                        <span className="font-bold text-[#FF858D]">{vessel.ais_score.toFixed(0)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDossier(vessel.mmsi);
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg bg-[rgba(176,38,255,0.15)] hover:bg-[rgba(176,38,255,0.3)] border border-[rgba(176,38,255,0.4)] text-[11px] font-bold text-[#E9D5FF] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open Full Forensic Dossier</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-3 rounded-xl bg-[rgba(14,10,20,0.85)] border border-[rgba(255,255,255,0.06)] text-[9px] text-[#81758F] leading-relaxed">
          <span className="font-bold text-[#D9B8FF] block mb-0.5 uppercase">Decision Support Disclaimer:</span>
          MARIS identifies the highest-ranked candidate based on available multi-source satellite and kinematic evidence. This is decision support and not a legal determination.
        </div>
      </div>
    </div>
  );
};
