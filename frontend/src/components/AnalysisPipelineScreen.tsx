"use client";

import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Compass,
  Wind,
  Ship,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  Crosshair,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export interface PipelineStep {
  id: number;
  title: string;
  subtitle: string;
  detail: string;
  icon: any;
  status: 'pending' | 'active' | 'complete';
}

interface AnalysisPipelineScreenProps {
  isAnalyzing: boolean;
  onComplete: () => void;
  isDemo?: boolean;
}

export const AnalysisPipelineScreen: React.FC<AnalysisPipelineScreenProps> = ({
  isAnalyzing,
  onComplete,
  isDemo = true,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPct, setProgressPct] = useState(0);

  const steps: PipelineStep[] = [
    {
      id: 1,
      title: "SAR IMAGE INGESTION & PREPROCESSING",
      subtitle: "Sentinel-1 C-Band Level-1 Ground Range Detected (GRD)",
      detail: "Radiometric calibration, speckle noise reduction, and VV/VH dual-polarization normalization applied across 10m grid.",
      icon: Satellite,
      status: currentStepIndex > 0 ? 'complete' : currentStepIndex === 0 ? 'active' : 'pending',
    },
    {
      id: 2,
      title: "OIL SLICK SEGMENTATION & GEOMETRY EXTRACTION",
      subtitle: "PyTorch U-Net Deep Learning / Morphological Sieve",
      detail: "Dark backscatter anomaly segmented: Surface Area 18.45 km², Perimeter 26.8 km, Elongation Ratio 2.85.",
      icon: Layers,
      status: currentStepIndex > 1 ? 'complete' : currentStepIndex === 1 ? 'active' : 'pending',
    },
    {
      id: 3,
      title: "OCEANOGRAPHIC & METOCEAN VECTOR INTEGRATION",
      subtitle: "INCOIS / ECMWF Surface Hydrodynamics",
      detail: "Resolved mean ocean surface current (0.14 m/s E, -0.31 m/s S) and wind leeway vector (3.77 m/s E, -6.13 m/s S).",
      icon: Wind,
      status: currentStepIndex > 2 ? 'complete' : currentStepIndex === 2 ? 'active' : 'pending',
    },
    {
      id: 4,
      title: "REVERSE LAGRANGIAN HINDCASTING (BACKTRACKING)",
      subtitle: "OpenDrift Reverse Hydrodynamic Diffusion Formulation",
      detail: "150 particles backtracked over 24.0h. Discovered probable discharge centroid (19.58°N, 71.32°E) with ±12.5 km uncertainty radius.",
      icon: Compass,
      status: currentStepIndex > 3 ? 'complete' : currentStepIndex === 3 ? 'active' : 'pending',
    },
    {
      id: 5,
      title: "TEMPORAL RELEASE WINDOW ESTIMATION",
      subtitle: "Kinematic Convergence & Slick Age Estimation",
      detail: "Synthesized release window: 12 AUG 2026, 02:10 UTC – 04:55 UTC (~14.5 hours prior to satellite pass).",
      icon: Activity,
      status: currentStepIndex > 4 ? 'complete' : currentStepIndex === 4 ? 'active' : 'pending',
    },
    {
      id: 6,
      title: "AIS TRAJECTORY RECONSTRUCTION & GAP ANALYSIS",
      subtitle: "Indian EEZ Commercial Corridors Telemetry Filter",
      detail: "4 vessels correlated in sector. Detected intentional 3.0-hour transponder blackout on Pacific Chemist (MMSI 419005678) during origin transit.",
      icon: Ship,
      status: currentStepIndex > 5 ? 'complete' : currentStepIndex === 5 ? 'active' : 'pending',
    },
    {
      id: 7,
      title: "5-FACTOR MULTI-CRITERIA ATTRIBUTION SCORING",
      subtitle: "Spatial, Temporal, Trajectory, Behavior & AIS Darkness Matrix",
      detail: "Pacific Chemist ranked #1 candidate with 89.4% attribution score (High Confidence). Normal traffic (Ever Apex 24.1%) eliminated.",
      icon: Crosshair,
      status: currentStepIndex > 6 ? 'complete' : currentStepIndex === 6 ? 'active' : 'pending',
    },
    {
      id: 8,
      title: "FORWARD COUNTERFACTUAL HYDRODYNAMIC VALIDATION",
      subtitle: "Physics-Based Hypothesis Verification",
      detail: "Simulated hypothetical discharge forward from Pacific Chemist's release point. Achieved IoU > 0.45 physical consistency against observed slick.",
      icon: ShieldCheck,
      status: currentStepIndex > 7 ? 'complete' : currentStepIndex === 7 ? 'active' : 'pending',
    },
  ];

  useEffect(() => {
    if (!isAnalyzing) return;

    const totalSteps = steps.length;
    const stepDuration = 900; // 900ms per step = ~7.2s total presentation

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < totalSteps - 1) {
          const next = prev + 1;
          setProgressPct(Math.round(((next + 1) / totalSteps) * 100));
          return next;
        } else {
          clearInterval(interval);
          setProgressPct(100);
          return prev;
        }
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isAnalyzing, steps.length]);

  if (!isAnalyzing) return null;

  const isAllComplete = currentStepIndex >= steps.length - 1 && progressPct === 100;

  return (
    <div
      id="analysis-pipeline-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050507]/90 backdrop-blur-xl animate-fade-in font-mono select-none"
    >
      <div className="w-full max-w-3xl bg-[rgba(12,9,18,0.95)] border border-[rgba(176,38,255,0.45)] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(157,0,255,0.3)] overflow-hidden flex flex-col relative max-h-[92vh]">
        {/* Reticle Brackets */}
        <div className="corner-reticle-tl" />
        <div className="corner-reticle-tr" />
        <div className="corner-reticle-bl" />
        <div className="corner-reticle-br" />

        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-[rgba(18,13,24,0.92)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(25,17,34,0.8)] border border-[rgba(176,38,255,0.50)] flex items-center justify-center text-[#D6A7FF] shadow-[0_0_15px_rgba(157,0,255,0.3)]">
              <Cpu className="w-5 h-5 text-[#B026FF] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#F2EDF7] tracking-wider uppercase">
                  MARIS Multi-Source Intelligence Pipeline
                </h3>
                <span className="px-2 py-0.5 text-[9px] rounded-full uppercase border font-bold text-purple-300 border-purple-500/40 bg-purple-950/60">
                  {isDemo ? "DEMO INVESTIGATION" : "LIVE SATELLITE PIPELINE"}
                </span>
              </div>
              <p className="text-xs text-[#81758F]">
                Correlating Satellite SAR Imagery &bull; Hydrodynamic Backtracking &bull; AIS Trajectories
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-black text-[#67E8F9]">{progressPct}%</span>
            <span className="text-[9px] text-[#81758F] block">EXECUTION</span>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="w-full h-1 bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#B026FF] via-[#67E8F9] to-[#34D399] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Pipeline Step Sequence */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'complete';
            const isActive = step.status === 'active';

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3.5 relative overflow-hidden ${
                  isActive
                    ? 'bg-[rgba(25,17,34,0.75)] border-[rgba(176,38,255,0.6)] shadow-[0_0_20px_rgba(157,0,255,0.2)] scale-[1.01]'
                    : isCompleted
                    ? 'bg-[rgba(15,12,20,0.55)] border-emerald-500/30 text-[#B9ADBF]'
                    : 'bg-[rgba(10,8,14,0.3)] border-[rgba(255,255,255,0.04)] text-[#81758F] opacity-60'
                }`}
              >
                {/* Step indicator circle */}
                <div
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs border ${
                    isCompleted
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : isActive
                      ? 'bg-[rgba(176,38,255,0.25)] border-[rgba(176,38,255,0.6)] text-[#E9D5FF] shadow-[0_0_10px_rgba(157,0,255,0.4)]'
                      : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[#81758F]'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isActive ? (
                    <Icon className="w-4 h-4 text-[#D6A7FF] animate-bounce" />
                  ) : (
                    <span>0{step.id}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold tracking-wide uppercase truncate ${
                        isActive ? 'text-white' : isCompleted ? 'text-[#F2EDF7]' : 'text-[#81758F]'
                      }`}
                    >
                      {step.title}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${
                        isCompleted
                          ? 'text-emerald-300 border-emerald-500/30 bg-emerald-950/40'
                          : isActive
                          ? 'text-purple-300 border-purple-500/40 bg-purple-950/60 animate-pulse'
                          : 'text-[#81758F] border-[rgba(255,255,255,0.05)]'
                      }`}
                    >
                      {isCompleted ? "VERIFIED" : isActive ? "PROCESSING..." : "QUEUED"}
                    </span>
                  </div>

                  <span className="text-[11px] text-[#9A8AA5] block mt-0.5 font-medium">
                    {step.subtitle}
                  </span>

                  {(isActive || isCompleted) && (
                    <p className="text-[10px] text-[#D9B8FF] mt-1.5 leading-relaxed bg-[rgba(10,8,14,0.6)] p-2 rounded-lg border border-[rgba(255,255,255,0.04)]">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[rgba(18,13,24,0.92)] border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="text-xs text-[#81758F]">
            {isAllComplete ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> All 8 Intelligence Verification Stages Complete
              </span>
            ) : (
              <span>Automated Forensic Analysis in Progress...</span>
            )}
          </div>

          <button
            type="button"
            disabled={!isAllComplete}
            onClick={onComplete}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              isAllComplete
                ? 'maris-btn-investigate shadow-[0_0_20px_rgba(157,0,255,0.6)] hover:scale-105'
                : 'bg-[rgba(255,255,255,0.05)] text-[#81758F] border border-[rgba(255,255,255,0.08)] cursor-not-allowed opacity-50'
            }`}
          >
            <span>Open Investigation Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
