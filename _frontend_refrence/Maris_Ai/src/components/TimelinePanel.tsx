import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Activity,
  RotateCcw,
  FastForward,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { timelineTicks } from '../mockData';
import { InvestigationStage, SimulationState } from '../types';

export interface TimelineMarker {
  time: string;
  pct: number;
  label: string;
  stage: InvestigationStage;
  tagColor?: string;
}

export const INVESTIGATION_TIMELINE_MARKERS: TimelineMarker[] = [
  { time: '08:00', pct: 10, label: 'SURVEILLANCE', stage: 1, tagColor: '#9A8AA5' },
  { time: '10:24', pct: 28, label: 'POSSIBLE RELEASE', stage: 3, tagColor: '#34D399' },
  { time: '12:00', pct: 44, label: 'HINDCAST', stage: 3, tagColor: '#C084FC' },
  { time: '14:00', pct: 60, label: 'CURRENT STATE', stage: 2, tagColor: '#67E8F9' },
  { time: '14:50', pct: 72, label: 'SATELLITE DETECTION', stage: 1, tagColor: '#FBBF24' },
  { time: '16:00', pct: 88, label: 'FORECAST', stage: 8, tagColor: '#D946EF' },
];

interface TimelinePanelProps {
  sliderPosition: number;
  onSliderChange: (pos: number) => void;
  scrubbedTime: string;
  activityLabel: string;
  simulationState?: SimulationState;
  onStartSimulation?: () => void;
  onPlayPauseSimulation?: () => void;
  onSkipSimulationStage?: () => void;
  onResetSimulation?: () => void;
  onReplaySimulation?: () => void;
  onSelectSimulationStage?: (stage: InvestigationStage) => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  sliderPosition,
  onSliderChange,
  scrubbedTime,
  activityLabel,
  simulationState,
  onStartSimulation,
  onPlayPauseSimulation,
  onSkipSimulationStage,
  onResetSimulation,
  onReplaySimulation,
  onSelectSimulationStage,
}) => {
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);
  const [liveSystemTime, setLiveSystemTime] = useState('04:32:11');
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const isSimActive = simulationState && simulationState.stage > 0;
  const currentSimStage = simulationState?.stage || 0;

  // Live wall clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveSystemTime(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Standard playback timer when simulation is not active
  useEffect(() => {
    if (!isPlayingLocal || isSimActive) return;
    const interval = setInterval(() => {
      const next = sliderPosition + 1;
      onSliderChange(next > 100 ? 0 : next);
    }, 300);
    return () => clearInterval(interval);
  }, [isPlayingLocal, isSimActive, onSliderChange, sliderPosition]);

  const updatePositionFromClientX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const newPos = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      onSliderChange(newPos);
    },
    [onSliderChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    updatePositionFromClientX(e.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (isDraggingRef.current) {
        updatePositionFromClientX(moveEvent.clientX);
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleStepLeft = () => {
    onSliderChange(Math.max(0, sliderPosition - 5));
  };

  const handleStepRight = () => {
    onSliderChange(Math.min(100, sliderPosition + 5));
  };

  return (
    <footer
      id="bottom-timeline-panel"
      aria-label="Timeline Navigation Panel"
      className="w-full shrink-0 border border-[rgba(255,255,255,0.08)] bg-[rgba(12,9,17,0.80)] backdrop-blur-[24px] rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center px-3 sm:px-5 py-2.5 z-10 select-none gap-2.5 sm:gap-4 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      {/* Subtle ambient lighting behind timeline */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/4 -top-12 w-96 h-24 bg-[radial-gradient(circle,rgba(157,0,255,0.14)_0%,rgba(157,0,255,0.06)_28%,transparent_68%)]" />
      </div>

      {/* Left Column: Title, Playback Controls or SIMULATION CONTROLS */}
      <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#9A8AA5] font-mono flex items-center gap-1.5">
              <span>Timeline</span>
              <span className="text-[#D6A7FF] font-bold">[{scrubbedTime}]</span>
            </h3>
            {isSimActive && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[rgba(176,38,255,0.2)] text-[#D6A7FF] border border-[rgba(176,38,255,0.4)] font-mono font-bold">
                SIM S{currentSimStage}
              </span>
            )}
          </div>

          {/* Controls toolbar */}
          <div className="flex items-center space-x-1.5 mt-1">
            {/* Step Left */}
            <button
              id="timeline-left-btn"
              onClick={handleStepLeft}
              aria-label="Previous timeline frame"
              className="p-1 maris-btn-glass rounded text-[#B9ADBF] hover:text-[#F2EDF7] cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Play / Pause toggle */}
            {isSimActive ? (
              <button
                onClick={onPlayPauseSimulation}
                aria-label={simulationState?.isPlaying ? 'Pause simulation' : 'Resume simulation'}
                className="p-1 maris-btn-glass rounded text-[#D6A7FF] hover:text-white cursor-pointer"
                title={simulationState?.isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
              >
                {simulationState?.isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-[#D6A7FF]" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsPlayingLocal(!isPlayingLocal)}
                aria-label={isPlayingLocal ? 'Pause timeline' : 'Play timeline'}
                className="p-1 maris-btn-glass rounded text-[#B9ADBF] hover:text-[#F2EDF7] cursor-pointer"
              >
                {isPlayingLocal ? <Pause className="w-3.5 h-3.5 text-[#D6A7FF]" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Step Right */}
            <button
              id="timeline-right-btn"
              onClick={handleStepRight}
              aria-label="Next timeline frame"
              className="p-1 maris-btn-glass rounded text-[#B9ADBF] hover:text-[#F2EDF7] cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Simulation-specific buttons */}
            {isSimActive && (
              <>
                <button
                  type="button"
                  id="btn-timeline-skip"
                  onClick={onSkipSimulationStage}
                  className="p-1 maris-btn-glass rounded text-[#D6A7FF] hover:text-white cursor-pointer flex items-center gap-1 text-[9px] font-mono font-bold"
                  title="Skip to Next Stage"
                >
                  <FastForward className="w-3 h-3" />
                  <span className="hidden sm:inline">SKIP</span>
                </button>

                <button
                  type="button"
                  id="btn-timeline-reset"
                  onClick={onResetSimulation}
                  className="p-1 rounded bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] text-[#81758F] hover:text-[#FF858D] cursor-pointer"
                  title="Reset Investigation"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </>
            )}

            {!isSimActive && onStartSimulation && (
              <button
                type="button"
                id="btn-timeline-start-sim"
                onClick={onStartSimulation}
                className="px-2.5 py-0.5 rounded maris-btn-investigate text-white text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(176,38,255,0.5)] hover:scale-105 transition-all"
              >
                <Play className="w-2.5 h-2.5 fill-white" />
                <span>START SIM</span>
              </button>
            )}
          </div>
        </div>

        {/* Activity readout on mobile */}
        <div className="sm:hidden flex items-center gap-1 text-[10px] font-mono text-[#D6A7FF] bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] px-2 py-1 rounded border border-[rgba(255,255,255,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Activity className="w-3 h-3 text-[#B026FF] animate-pulse" />
          <span className="truncate max-w-[140px]">{activityLabel}</span>
        </div>
      </div>

      {/* Center: Full-Width Scrubber Track with Investigation Milestone Markers */}
      <div className="flex-1 px-1 sm:px-4 min-w-0 relative z-10">
        <div className="relative py-1 flex flex-col justify-center">
          {/* Milestone Tag Badges above track */}
          <div className="relative h-4 w-full mb-1 pointer-events-none hidden md:block">
            {INVESTIGATION_TIMELINE_MARKERS.map((m, idx) => {
              const isNearest = Math.abs(sliderPosition - m.pct) < 6;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSliderChange(m.pct);
                    if (onSelectSimulationStage) onSelectSimulationStage(m.stage);
                  }}
                  className={`pointer-events-auto absolute -translate-x-1/2 -top-1 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded transition-all cursor-pointer whitespace-nowrap border ${
                    isNearest
                      ? 'bg-[rgba(176,38,255,0.35)] text-white border-[#C04CFF] shadow-[0_0_8px_rgba(176,38,255,0.5)] scale-105'
                      : 'bg-[rgba(12,9,18,0.7)] text-[#9A8AA5] border-[rgba(255,255,255,0.08)] hover:text-[#D6A7FF]'
                  }`}
                  style={{ left: `${m.pct}%` }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Track Bar with Pointer Drag Support & Accessible Keyboard Sliders */}
          <div
            ref={trackRef}
            id="timeline-track-container"
            role="slider"
            tabIndex={0}
            aria-label="Maritime Incident Timeline Scrubber"
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={scrubbedTime}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                onSliderChange(Math.max(0, sliderPosition - (e.shiftKey ? 10 : 2)));
              } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                onSliderChange(Math.min(100, sliderPosition + (e.shiftKey ? 10 : 2)));
              } else if (e.key === 'Home') {
                e.preventDefault();
                onSliderChange(0);
              } else if (e.key === 'End') {
                e.preventDefault();
                onSliderChange(100);
              }
            }}
            onPointerDown={handlePointerDown}
            className="w-full h-2.5 bg-[rgba(16,13,23,0.85)] rounded-full relative cursor-pointer group border border-[rgba(255,255,255,0.08)] touch-none py-1 focus-visible:ring-2 focus-visible:ring-[#B026FF] focus-visible:outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
          >
            {/* Active Purple Passed Segment */}
            <div
              style={{ width: `${sliderPosition}%` }}
              className="absolute left-0 top-0 h-full maris-timeline-bar rounded-l-full pointer-events-none"
            />

            {/* Marker tick notches along the track */}
            {INVESTIGATION_TIMELINE_MARKERS.map((m, idx) => (
              <div
                key={idx}
                style={{ left: `${m.pct}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-[rgba(255,255,255,0.25)] pointer-events-none z-1"
              />
            ))}

            {/* Glowing Scrubber Needle Handle */}
            <div
              style={{ left: `${sliderPosition}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-none z-10"
            >
              <div className="w-3.5 h-3.5 rounded-full maris-timeline-handle border border-white/90 transition-transform group-hover:scale-125 shadow-[0_0_10px_#b026ff]" />
            </div>
          </div>

          {/* Timestamps Row */}
          <div className="w-full flex justify-between text-[8px] sm:text-[9px] font-mono text-[#81758F] uppercase pointer-events-none mt-1">
            {INVESTIGATION_TIMELINE_MARKERS.map((m, idx) => {
              const isNearest = Math.abs(sliderPosition - m.pct) < 6;
              return (
                <span
                  key={idx}
                  className={`transition-colors ${
                    isNearest ? 'text-[#D6A7FF] font-bold scale-105' : 'text-[#81758F]'
                  }`}
                >
                  {m.time}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Incident Activity & Live Synchronized Timestamp */}
      <div className="shrink-0 flex items-center justify-between sm:justify-end gap-4 relative z-10">
        {/* Incident activity status */}
        <div className="hidden sm:flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D6A7FF] bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] px-2.5 py-0.5 rounded-full border border-[rgba(255,255,255,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF] animate-pulse shadow-[0_0_6px_#b026ff]" />
            <span className="font-bold">{activityLabel}</span>
          </div>
          <span className="text-[8px] text-[#81758F] font-mono mt-0.5 uppercase tracking-tighter">
            SURVEILLANCE AT {scrubbedTime}
          </span>
        </div>

        {/* Live Synchronized Clock */}
        <div className="text-right">
          <div className="text-[11px] sm:text-xs text-[#D6A7FF] font-mono font-bold tracking-wider">
            {liveSystemTime}
          </div>
          <div className="text-[8px] text-[#81758F] uppercase tracking-tighter font-mono">
            Live Stream Sync
          </div>
        </div>
      </div>
    </footer>
  );
};
