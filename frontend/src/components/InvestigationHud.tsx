"use client";

import React from 'react';
import { Play, Pause, RotateCcw, FastForward, CheckCircle, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { InvestigationStage, SimulationState } from '../types';
import { STAGE_DESCRIPTIONS } from '../data/simulationData';

interface InvestigationHudProps {
  simulationState: SimulationState;
  onPlayPause: () => void;
  onSkipStage: () => void;
  onReset: () => void;
  onStart: () => void;
  onSelectStage: (stage: InvestigationStage) => void;
}

export const InvestigationHud: React.FC<InvestigationHudProps> = ({
  simulationState,
  onPlayPause,
  onSkipStage,
  onReset,
  onStart,
  onSelectStage,
}) => {
  const { stage, isPlaying, attributionScore, simTimeUTC, stageProgress } = simulationState;
  const currentStageInfo = STAGE_DESCRIPTIONS.find((s) => s.stage === stage) || STAGE_DESCRIPTIONS[0];

  // If idle, render a floating Initiate Investigation banner at bottom-center of globe
  if (stage === 0) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[rgba(10,8,16,0.85)] border border-[rgba(176,38,255,0.45)] backdrop-blur-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(157,0,255,0.25)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#D9B8FF] uppercase">
              MARIS INVESTIGATION ENGINE
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgba(245,158,11,0.15)] text-[#FBBF24] border border-[rgba(245,158,11,0.3)]">
              DEMO / SIMULATED DATA
            </span>
          </div>

          <div className="h-4 w-px bg-[rgba(255,255,255,0.12)]" />

          <button
            type="button"
            id="btn-hud-initiate-investigation"
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl maris-btn-investigate text-white text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_20px_rgba(176,38,255,0.6)] hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>INITIATE INVESTIGATION</span>
          </button>
        </div>
      </div>
    );
  }

  // Active or Completed Simulation HUD Bar
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[92%] max-w-2xl flex flex-col items-center gap-1.5">
      {/* Primary HUD Card */}
      <div className="w-full rounded-2xl bg-[rgba(10,8,18,0.88)] border border-[rgba(176,38,255,0.45)] backdrop-blur-[24px] shadow-[0_16px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(157,0,255,0.25)] p-3 space-y-2">
        {/* Top Status Line */}
        <div className="flex items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.08)] pb-2">
          {/* Left: Stage Index & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[rgba(176,38,255,0.2)] border border-[rgba(176,38,255,0.6)] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(176,38,255,0.35)]">
              {stage === 9 ? (
                <CheckCircle className="w-4 h-4 text-[#34D399]" />
              ) : (
                <span className="text-xs font-mono font-bold text-[#E9D5FF]">{stage}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-mono font-bold text-[#F2EDF7] tracking-wide truncate">
                  {currentStageInfo.title}
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[rgba(176,38,255,0.25)] text-[#D6A7FF] border border-[rgba(176,38,255,0.4)]">
                  {currentStageInfo.tag}
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#9A8AA5] truncate max-w-sm">
                {currentStageInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Simulation Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {stage < 9 ? (
              <>
                <button
                  type="button"
                  id="btn-hud-play-pause"
                  onClick={onPlayPause}
                  aria-label={isPlaying ? 'Pause simulation' : 'Resume simulation'}
                  className="p-1.5 rounded-lg maris-btn-glass text-[#D6A7FF] hover:text-white cursor-pointer transition-all hover:border-[rgba(176,38,255,0.6)]"
                  title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-[#D6A7FF]" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-[#D6A7FF]" />
                  )}
                </button>

                <button
                  type="button"
                  id="btn-hud-skip"
                  onClick={onSkipStage}
                  aria-label="Skip to next stage"
                  className="p-1.5 rounded-lg maris-btn-glass text-[#D6A7FF] hover:text-white cursor-pointer transition-all hover:border-[rgba(176,38,255,0.6)] flex items-center gap-1 text-[10px] font-mono font-bold"
                  title="Skip Stage"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SKIP</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                id="btn-hud-restart"
                onClick={onStart}
                className="px-3 py-1 rounded-lg maris-btn-investigate text-white text-[11px] font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(176,38,255,0.6)]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>REPLAY DEMO</span>
              </button>
            )}

            <button
              type="button"
              id="btn-hud-reset"
              onClick={onReset}
              aria-label="Reset simulation"
              className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[#81758F] hover:text-[#FF858D] cursor-pointer transition-all"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Status Banner */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[rgba(18,13,26,0.6)] border border-[rgba(255,255,255,0.05)] text-[11px] font-mono">
          <div className="flex items-center gap-2 text-[#E9D5FF] font-semibold truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF] animate-pulse" />
            <span className="truncate">{currentStageInfo.statusText}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 pl-2">
            <span className="text-[10px] text-[#81758F] font-mono">
              TIME: <strong className="text-[#67E8F9]">{simTimeUTC}</strong>
            </span>
          </div>
        </div>

        {/* Interactive 8-Stage Step Navigation Pills */}
        <div className="pt-1 flex items-center justify-between gap-1">
          {STAGE_DESCRIPTIONS.filter((s) => s.stage >= 1 && s.stage <= 8).map((s) => {
            const isCurrent = stage === s.stage;
            const isPast = stage > s.stage;

            return (
              <button
                key={s.stage}
                type="button"
                id={`step-pill-${s.stage}`}
                onClick={() => onSelectStage(s.stage as InvestigationStage)}
                className={`flex-1 py-1 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer relative overflow-hidden text-center border ${
                  isCurrent
                    ? 'bg-[rgba(176,38,255,0.35)] text-white border-[#C04CFF] shadow-[0_0_10px_rgba(176,38,255,0.4)]'
                    : isPast
                    ? 'bg-[rgba(16,185,129,0.12)] text-[#34D399] border-[rgba(16,185,129,0.3)]'
                    : 'bg-[rgba(18,13,24,0.4)] text-[#81758F] border-[rgba(255,255,255,0.05)] hover:text-[#D6A7FF] hover:border-[rgba(176,38,255,0.3)]'
                }`}
                title={`Jump to Stage ${s.stage}: ${s.title}`}
              >
                {/* Progress fill bar on current stage */}
                {isCurrent && (
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[rgba(217,70,239,0.4)] pointer-events-none transition-all duration-100"
                    style={{ width: `${Math.round(stageProgress * 100)}%` }}
                  />
                )}
                <span className="relative z-10">S{s.stage}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mandatory Demo Disclaimer Tag */}
      <div className="px-3 py-0.5 rounded-full bg-[rgba(10,8,16,0.7)] backdrop-blur-md border border-[rgba(245,158,11,0.25)] text-[9px] font-mono text-[#FBBF24] tracking-wider uppercase flex items-center gap-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        <span>DEMO / SIMULATED DATA — MARIS ANALYTICAL RECONSTRUCTION WORKFLOW</span>
      </div>
    </div>
  );
};
