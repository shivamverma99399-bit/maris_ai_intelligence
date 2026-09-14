"use client";
import React from 'react';
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
} from 'lucide-react';
import { SimulationState, InvestigationStage } from '../types';
import { CANDIDATE_VESSELS, STAGE_DESCRIPTIONS } from '../data/simulationData';

interface InvestigationBriefingPanelProps {
  simulationState: SimulationState;
  onRestart: () => void;
  onSelectStage: (stage: InvestigationStage) => void;
}

export const InvestigationBriefingPanel: React.FC<InvestigationBriefingPanelProps> = ({
  simulationState,
  onRestart,
  onSelectStage,
}) => {
  const { stage, attributionScore, simTimeUTC, stageProgress } = simulationState;
  const currentStageInfo = STAGE_DESCRIPTIONS.find((s) => s.stage === stage) || STAGE_DESCRIPTIONS[0];

  return (
    <div className="w-full flex flex-col space-y-3 font-mono text-[#B9ADBF]">
      {/* Simulation Banner with Mandatory Disclaimer */}
      <div className="p-2.5 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-wider">
            SIMULATION MODE
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[rgba(245,158,11,0.15)] text-[#FDE68A] border border-[rgba(245,158,11,0.3)]">
          DEMO / SIMULATED DATA
        </span>
      </div>

      {/* Stage Header Card */}
      <div className="p-3.5 rounded-xl bg-[rgba(18,13,24,0.75)] border border-[rgba(176,38,255,0.4)] shadow-[0_0_20px_rgba(157,0,255,0.15)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#D6A7FF] tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF]" />
            STAGE {stage} OF 8
          </span>
          <span className="text-[10px] font-bold text-[#67E8F9] bg-[rgba(6,182,212,0.15)] px-2 py-0.5 rounded border border-[rgba(6,182,212,0.3)]">
            {simTimeUTC}
          </span>
        </div>

        <h3 className="text-sm font-bold text-[#F2EDF7] tracking-wide">
          {currentStageInfo.title}
        </h3>
        <p className="text-xs text-[#9A8AA5] leading-relaxed">
          {currentStageInfo.subtitle}
        </p>

        {/* Stage Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#B026FF] via-[#D946EF] to-[#67E8F9] transition-all duration-150"
            style={{ width: `${Math.round(stageProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* =======================================================
          STAGE 1: SATELLITE DETECTION
          ======================================================= */}
      {stage === 1 && (
        <div className="p-3.5 rounded-xl bg-[rgba(15,10,22,0.65)] border border-[rgba(255,255,255,0.08)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D6A7FF]">
            <Satellite className="w-4 h-4 text-[#B026FF]" />
            <span>SATELLITE ANALYSIS</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[rgba(25,17,34,0.6)] border border-[rgba(176,38,255,0.25)] space-y-1.5">
            <div className="text-[11px] text-[#E9D5FF] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B026FF] animate-ping" />
              <span>Analyzing SAR imagery... (Sentinel-1 C-Band)</span>
            </div>
            <p className="text-[10px] text-[#81758F]">
              Normalized radar backscatter anomaly detected across sea surface. Dark patch signature indicates damping of capillary-gravity waves by hydrocarbon slick.
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">STATUS:</span>
              <span className="text-[#34D399] font-bold">OIL SPILL DETECTED</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">DETECTION CONFIDENCE:</span>
              <span className="text-[#67E8F9] font-bold">92% CONFIDENCE</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-[#81758F]">ESTIMATED SURFACE AREA:</span>
              <span className="text-[#FBBF24] font-bold">42.8 km²</span>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          STAGE 2: SPILL CHARACTERIZATION
          ======================================================= */}
      {stage === 2 && (
        <div className="p-3.5 rounded-xl bg-[rgba(15,10,22,0.65)] border border-[rgba(255,255,255,0.08)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FBBF24]">
            <Layers className="w-4 h-4 text-[#F59E0B]" />
            <span>SPILL CHARACTERIZATION</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#B9ADBF]">ORGANIC SLICK PERIMETER</span>
              <span className="text-[#FBBF24] font-bold">42.8 km²</span>
            </div>
            <p className="text-[10px] text-[#9A8AA5]">
              Asymmetrical elongated morphology consistent with hydrodynamic shear. Optical sheen matches medium-heavy crude petroleum emulsion.
            </p>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">ESTIMATED SLICK AGE:</span>
              <span className="text-[#E9D5FF] font-bold">4 – 7 hours</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">INCIDENT SEVERITY:</span>
              <span className="text-[#F87171] font-bold uppercase">HIGH SEVERITY</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#81758F]">FORMATION:</span>
              <span className="text-[#FBBF24] font-bold">Amber/Orange Sheen</span>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          STAGE 3: HINDCAST (ORIGIN RECONSTRUCTION)
          ======================================================= */}
      {stage === 3 && (
        <div className="p-3.5 rounded-xl bg-[rgba(15,10,22,0.65)] border border-[rgba(255,255,255,0.08)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C084FC]">
            <Compass className="w-4 h-4 text-[#B026FF]" />
            <span>RECONSTRUCTING ORIGIN (HINDCAST)</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(176,38,255,0.25)] space-y-2">
            <p className="text-[10px] text-[#B9ADBF]">
              Simulating reverse trajectory using Lagrangian particle backtrack with ocean surface currents and wind drift vectors.
            </p>
            {/* Reverse Timeline Sequence as requested */}
            <div className="flex items-center justify-between text-[11px] font-bold text-[#D6A7FF] bg-[rgba(0,0,0,0.3)] p-1.5 rounded">
              <span>14:50</span>
              <span className="text-[#B026FF]">↓</span>
              <span>13:30</span>
              <span className="text-[#B026FF]">↓</span>
              <span>12:00</span>
              <span className="text-[#B026FF]">↓</span>
              <span className="text-[#34D399]">10:24</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[rgba(176,38,255,0.1)] border border-[rgba(176,38,255,0.3)] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#E9D5FF] font-bold">PROBABLE ORIGIN</span>
              <span className="text-[#34D399] font-bold">81% CONFIDENCE</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#B9ADBF]">
              <span>RELEASE WINDOW:</span>
              <span className="text-white font-bold">10:24 UTC</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#B9ADBF]">
              <span>UNCERTAINTY RADIUS:</span>
              <span className="text-[#D6A7FF] font-bold">±12 km</span>
            </div>
            <p className="text-[9px] text-[#9A8AA5] pt-0.5">
              Violet probability field mapped to 14.20° N, 87.50° E.
            </p>
          </div>
        </div>
      )}

      {/* =======================================================
          STAGE 4: AIS RECONSTRUCTION
          ======================================================= */}
      {stage === 4 && (
        <div className="p-3.5 rounded-xl bg-[rgba(15,10,22,0.65)] border border-[rgba(255,255,255,0.08)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#67E8F9]">
            <Ship className="w-4 h-4 text-[#06B6D4]" />
            <span>RECONSTRUCTING AIS TRAFFIC</span>
          </div>

          <p className="text-[10px] text-[#9A8AA5]">
            Querying terrestrial and satellite AIS logs during the 09:30–11:30 UTC release window within 50 nautical miles of the probable origin.
          </p>

          <div className="space-y-1.5">
            {CANDIDATE_VESSELS.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-2 rounded bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{v.flag}</span>
                    <span>{v.name}</span>
                  </div>
                  <div className="text-[9px] text-[#81758F]">
                    {v.type} • {v.speed} • {v.heading}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#D6A7FF] bg-[rgba(176,38,255,0.15)] px-2 py-0.5 rounded">
                  {v.distanceFromOrigin}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================
          STAGE 5: FILTER IRRELEVANT TRAFFIC
          ======================================================= */}
      {stage === 5 && (
        <div className="p-3.5 rounded-xl bg-[rgba(15,10,22,0.65)] border border-[rgba(255,255,255,0.08)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D6A7FF]">
            <Search className="w-4 h-4 text-[#B026FF]" />
            <span>AIS CORRELATION FILTER</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)]">
              <div className="text-sm font-bold text-white">32</div>
              <div className="text-[8px] text-[#81758F]">VESSELS ANALYZED</div>
            </div>
            <div className="p-2 rounded bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)]">
              <div className="text-sm font-bold text-[#FBBF24]">5</div>
              <div className="text-[8px] text-[#81758F]">POTENTIAL CANDIDATES</div>
            </div>
            <div className="p-2 rounded bg-[rgba(176,38,255,0.15)] border border-[rgba(176,38,255,0.35)]">
              <div className="text-sm font-bold text-[#34D399]">1</div>
              <div className="text-[8px] text-[#D6A7FF]">HIGH-CORRELATION</div>
            </div>
          </div>

          <p className="text-[10px] text-[#9A8AA5]">
            Low-correlation vessels faded out: vessels outside the spatiotemporal boundary or moving counter to slick dispersion are excluded from candidate ranking.
          </p>

          <div className="p-2.5 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(16,185,129,0.3)] flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white">NORDIC STAR</div>
              <div className="text-[9px] text-[#34D399]">Top Correlation Match (2.1 km CPA)</div>
            </div>
            <span className="text-xs font-bold text-[#34D399] bg-[rgba(16,185,129,0.15)] px-2 py-0.5 rounded">
              ISOLATED
            </span>
          </div>
        </div>
      )}

      {/* =======================================================
          STAGE 6: VESSEL ATTRIBUTION
          ======================================================= */}
      {stage === 6 && (
        <div className="p-3.5 rounded-xl bg-[rgba(15,10,22,0.65)] border border-[rgba(255,255,255,0.08)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D6A7FF]">
            <Crosshair className="w-4 h-4 text-[#B026FF]" />
            <span>VESSEL ATTRIBUTION SCORING</span>
          </div>

          {/* Animated Attribution Score Gauge (45% -> 92%) */}
          <div className="p-3 rounded-xl bg-[rgba(18,13,24,0.8)] border border-[rgba(176,38,255,0.4)] text-center space-y-1">
            <div className="text-[10px] text-[#81758F] uppercase tracking-wider">
              NORDIC STAR (IMO 9418294)
            </div>
            <div className="text-3xl font-extrabold text-[#D6A7FF] tracking-tight font-mono">
              {attributionScore}%
            </div>
            <div className="text-[10px] font-bold text-[#34D399] uppercase">
              {attributionScore >= 90 ? '92% SOURCE CORRELATION' : 'COMPUTING CORRELATION MATRIX...'}
            </div>
          </div>

          {/* Breakdown criteria */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">Spatial Match:</span>
              <span className="text-[#34D399] font-bold">94%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">Temporal Match:</span>
              <span className="text-[#67E8F9] font-bold">91%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">Trajectory Match:</span>
              <span className="text-[#D6A7FF] font-bold">88%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#81758F]">Behaviour Anomaly:</span>
              <span className="text-[#FBBF24] font-bold">76%</span>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          STAGE 7: EXPLAINABLE RESULT
          ======================================================= */}
      {stage === 7 && (
        <div className="p-3.5 rounded-xl bg-[rgba(15,10,22,0.65)] border border-[rgba(255,255,255,0.08)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E9D5FF]">
              <ShieldCheck className="w-4 h-4 text-[#34D399]" />
              <span>WHY NORDIC STAR?</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-[rgba(176,38,255,0.15)] text-[#D6A7FF] border border-[rgba(176,38,255,0.3)]">
              EXPLAINABLE AI
            </span>
          </div>

          {/* Explainable Checklist as requested */}
          <div className="p-2.5 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] space-y-2 text-[11px]">
            <div className="flex items-start gap-2 text-[#E9D5FF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 mt-0.5" />
              <span>Within 2.1 km of probable origin</span>
            </div>
            <div className="flex items-start gap-2 text-[#E9D5FF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 mt-0.5" />
              <span>Present during estimated release window</span>
            </div>
            <div className="flex items-start gap-2 text-[#E9D5FF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 mt-0.5" />
              <span>Trajectory aligns with reconstructed origin</span>
            </div>
            <div className="flex items-start gap-2 text-[#E9D5FF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 mt-0.5" />
              <span>Heading consistent with spill geometry</span>
            </div>
            <div className="flex items-start gap-2 text-[#E9D5FF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 mt-0.5" />
              <span>Simulated release shows strong overlap</span>
            </div>
          </div>

          {/* Mandatory Attribution Framing as requested */}
          <div className="p-2.5 rounded-lg bg-[rgba(6,182,212,0.08)] border border-[rgba(6,182,212,0.25)] text-[10px] text-[#A5F3FC] leading-relaxed">
            <strong>CLASSIFICATION:</strong> HIGHEST CORRELATION CANDIDATE
            <p className="text-[9px] text-[#81758F] mt-1">
              Note: MARIS provides probabilistic hydrodynamic and spatial correlation. This is an analytical simulation for maritime authority review, not legal attribution.
            </p>
          </div>
        </div>
      )}

      {/* =======================================================
          STAGE 8: FUTURE FORECAST
          ======================================================= */}
      {stage === 8 && (
        <div className="p-3.5 rounded-xl bg-[rgba(15,10,22,0.65)] border border-[rgba(255,255,255,0.08)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#67E8F9]">
            <TrendingUp className="w-4 h-4 text-[#06B6D4]" />
            <span>RUN 12H FORECAST</span>
          </div>

          <p className="text-[10px] text-[#9A8AA5]">
            Forward Lagrangian advection and weathering simulation based on GFS wind forecast and HYCOM ocean current models.
          </p>

          <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
            <span className="flex-1 py-1 text-center rounded bg-[rgba(6,182,212,0.15)] text-[#67E8F9] border border-[rgba(6,182,212,0.3)]">
              +3 HOURS
            </span>
            <span className="flex-1 py-1 text-center rounded bg-[rgba(6,182,212,0.2)] text-[#67E8F9] border border-[rgba(6,182,212,0.4)]">
              +6 HOURS
            </span>
            <span className="flex-1 py-1 text-center rounded bg-[rgba(176,38,255,0.25)] text-[#E9D5FF] border border-[rgba(176,38,255,0.5)]">
              +12 HOURS
            </span>
          </div>

          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">PREDICTED DRIFT:</span>
              <span className="text-[#E9D5FF] font-bold">Northeast (NE)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">OCEAN CURRENT:</span>
              <span className="text-[#67E8F9] font-bold">1.2 m/s</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[#81758F]">SURFACE WIND:</span>
              <span className="text-[#FBBF24] font-bold">WSW 14 kn</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#81758F]">PREDICTED AREA:</span>
              <span className="text-[#F87171] font-bold">67.4 km²</span>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          STAGE 9: FINAL STATE / INVESTIGATION COMPLETE
          ======================================================= */}
      {stage === 9 && (
        <div className="p-3.5 rounded-xl bg-[rgba(18,13,26,0.85)] border border-[rgba(16,185,129,0.4)] shadow-[0_0_25px_rgba(16,185,129,0.2)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#34D399]">
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
            <span>MARIS INVESTIGATION COMPLETE</span>
          </div>

          <div className="text-[11px] font-bold text-white">
            SPILL-042 / BAY OF BENGAL
          </div>

          <div className="space-y-1.5 text-xs p-2.5 rounded-lg bg-[rgba(12,9,18,0.7)] border border-[rgba(255,255,255,0.06)]">
            <div className="flex justify-between py-0.5">
              <span className="text-[#81758F]">OIL SPILL:</span>
              <span className="text-[#34D399] font-bold">92% DETECTION CONFIDENCE</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-[#81758F]">PROBABLE ORIGIN:</span>
              <span className="text-[#D6A7FF] font-bold">81% CONFIDENCE (10:24 UTC)</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-[#81758F]">TOP SOURCE CANDIDATE:</span>
              <span className="text-[#67E8F9] font-bold">NORDIC STAR (92%)</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-[#81758F]">12H FORECAST:</span>
              <span className="text-[#FBBF24] font-bold">67.4 km²</span>
            </div>
          </div>

          <button
            type="button"
            id="btn-restart-investigation"
            onClick={onRestart}
            className="w-full py-2.5 rounded-lg maris-btn-investigate text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(176,38,255,0.6)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESTART INVESTIGATION</span>
          </button>
        </div>
      )}
    </div>
  );
};
