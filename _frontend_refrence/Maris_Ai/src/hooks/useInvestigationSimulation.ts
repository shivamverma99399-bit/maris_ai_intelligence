import { useState, useEffect, useRef, useCallback } from 'react';
import { InvestigationStage, SimulationState } from '../types';

export interface UseInvestigationSimulationReturn {
  simulationState: SimulationState;
  state: SimulationState;
  hindcastProgress: number; // 0 (current position) to 1 (reconstructed origin)
  forecastProgress: number; // 0 to 1 (+12h)
  scanAngle: number;
  startSimulation: () => void;
  start: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  togglePlayPause: () => void;
  replaySimulation: () => void;
  resetSimulation: () => void;
  reset: () => void;
  goToStage: (stage: InvestigationStage) => void;
  skipStage: () => void;
  seekTimeline: (pos: number) => void;
}

// Stage durations in milliseconds for auto-progression
const STAGE_DURATIONS: Record<InvestigationStage, number> = {
  0: 0,
  1: 6500, // Satellite Detection & Scan
  2: 6000, // Spill Characterization
  3: 7500, // Hindcast Origin Reconstruction
  4: 6500, // AIS Reconstruction
  5: 6000, // Filter Irrelevant Traffic
  6: 7000, // Vessel Attribution score count
  7: 6500, // Explainable Result
  8: 8000, // Future Forecast
  9: 0,    // Final state (stays until user restarts)
};

// Stage mapping to timeline percentage (0-100)
// 08:00 (10%), 10:24 (28%), 12:00 (42%), 14:00 (60%), 14:50 (72%), 16:00 (85%), +12h (95%)
const STAGE_TIMELINE_PCT: Record<InvestigationStage, number> = {
  0: 72,
  1: 72, // 14:50 UTC (Detection)
  2: 72, // 14:50 UTC
  3: 28, // 10:24 UTC (Hindcast)
  4: 28, // 10:24 UTC (AIS at Origin)
  5: 28, // 10:24 UTC
  6: 28, // 10:24 UTC
  7: 28, // 10:24 UTC
  8: 92, // +12H Forecast
  9: 72, // Summary
};

export function useInvestigationSimulation(): UseInvestigationSimulationReturn {
  const [stage, setStage] = useState<InvestigationStage>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [attributionScore, setAttributionScore] = useState<number>(45);
  const [hindcastProgress, setHindcastProgress] = useState<number>(0);
  const [forecastProgress, setForecastProgress] = useState<number>(0);
  const [scanAngle, setScanAngle] = useState<number>(0);
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [timelineProgress, setTimelineProgress] = useState<number>(72);
  const [simTimeUTC, setSimTimeUTC] = useState<string>('14:50 UTC');

  const stageStartTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  const startSimulation = useCallback(() => {
    setStage(1);
    setIsPlaying(true);
    setAttributionScore(45);
    setHindcastProgress(0);
    setForecastProgress(0);
    setStageProgress(0);
    setTimelineProgress(72);
    setSimTimeUTC('14:50 UTC');
    stageStartTimeRef.current = Date.now();
  }, []);

  const pauseSimulation = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resumeSimulation = useCallback(() => {
    if (stage === 0) {
      startSimulation();
    } else if (stage === 9) {
      startSimulation();
    } else {
      setIsPlaying(true);
      stageStartTimeRef.current = Date.now() - stageProgress * (STAGE_DURATIONS[stage] || 6000);
    }
  }, [stage, stageProgress, startSimulation]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseSimulation();
    } else {
      resumeSimulation();
    }
  }, [isPlaying, pauseSimulation, resumeSimulation]);

  const replaySimulation = useCallback(() => {
    startSimulation();
  }, [startSimulation]);

  const resetSimulation = useCallback(() => {
    setStage(0);
    setIsPlaying(false);
    setAttributionScore(45);
    setHindcastProgress(0);
    setForecastProgress(0);
    setStageProgress(0);
    setTimelineProgress(72);
    setSimTimeUTC('14:50 UTC');
  }, []);

  const goToStage = useCallback((targetStage: InvestigationStage) => {
    setStage(targetStage);
    setStageProgress(0);
    stageStartTimeRef.current = Date.now();

    // Configure stage-specific presets
    if (targetStage === 0) {
      setIsPlaying(false);
      setTimelineProgress(72);
      setSimTimeUTC('14:50 UTC');
      setHindcastProgress(0);
      setForecastProgress(0);
      setAttributionScore(45);
    } else if (targetStage === 1 || targetStage === 2) {
      setTimelineProgress(72);
      setSimTimeUTC('14:50 UTC');
      setHindcastProgress(0);
      setForecastProgress(0);
      setAttributionScore(45);
    } else if (targetStage === 3) {
      setTimelineProgress(50);
      setSimTimeUTC('12:00 UTC');
      setHindcastProgress(0.5);
      setForecastProgress(0);
      setAttributionScore(45);
    } else if (targetStage >= 4 && targetStage <= 7) {
      setTimelineProgress(28);
      setSimTimeUTC('10:24 UTC');
      setHindcastProgress(1.0);
      setForecastProgress(0);
      if (targetStage >= 6) {
        setAttributionScore(92);
      }
    } else if (targetStage === 8) {
      setTimelineProgress(92);
      setSimTimeUTC('+12H FORECAST');
      setHindcastProgress(0);
      setForecastProgress(0.8);
      setAttributionScore(92);
    } else if (targetStage === 9) {
      setIsPlaying(false);
      setTimelineProgress(72);
      setSimTimeUTC('SUMMARY');
      setHindcastProgress(0);
      setForecastProgress(0);
      setAttributionScore(92);
    }
  }, []);

  const skipStage = useCallback(() => {
    if (stage === 0) {
      startSimulation();
    } else if (stage < 8) {
      goToStage((stage + 1) as InvestigationStage);
    } else {
      goToStage(9);
    }
  }, [stage, startSimulation, goToStage]);

  // Main simulation tick loop
  useEffect(() => {
    if (!isPlaying || stage === 0 || stage === 9) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const duration = STAGE_DURATIONS[stage] || 6000;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - stageStartTimeRef.current;
      const progress = Math.min(1.0, Math.max(0, elapsed / duration));
      setStageProgress(progress);

      // Radar scan rotation in Stage 1
      if (stage === 1) {
        setScanAngle((prev) => (prev + 0.05) % (Math.PI * 2));
      }

      // Stage 3: Hindcast backward animation
      if (stage === 3) {
        setHindcastProgress(progress);
        // Animate time: 14:50 -> 13:30 -> 12:00 -> 10:24 UTC
        if (progress < 0.33) {
          setSimTimeUTC('14:50 UTC ↓');
          setTimelineProgress(72 - progress * 40);
        } else if (progress < 0.66) {
          setSimTimeUTC('12:00 UTC ↓');
          setTimelineProgress(55 - (progress - 0.33) * 45);
        } else {
          setSimTimeUTC('10:24 UTC');
          setTimelineProgress(28);
        }
      }

      // Stage 6: Attribution score count 45% -> 92%
      if (stage === 6) {
        const score = Math.round(45 + progress * (92 - 45));
        setAttributionScore(score);
      }

      // Stage 8: Forecast expansion +3h, +6h, +12h
      if (stage === 8) {
        setForecastProgress(progress);
        if (progress < 0.33) {
          setSimTimeUTC('+3H FORECAST (17:50 UTC)');
          setTimelineProgress(78);
        } else if (progress < 0.66) {
          setSimTimeUTC('+6H FORECAST (20:50 UTC)');
          setTimelineProgress(85);
        } else {
          setSimTimeUTC('+12H FORECAST (02:50 UTC)');
          setTimelineProgress(95);
        }
      }

      // Check if stage finished
      if (progress >= 1.0) {
        if (stage < 8) {
          const nextStage = (stage + 1) as InvestigationStage;
          setStage(nextStage);
          stageStartTimeRef.current = Date.now();
          setStageProgress(0);

          // Configure entry states for next stage
          if (nextStage === 3) {
            setHindcastProgress(0);
          } else if (nextStage === 4) {
            setSimTimeUTC('10:24 UTC');
            setTimelineProgress(28);
            setHindcastProgress(1.0);
          } else if (nextStage === 6) {
            setAttributionScore(45);
          } else if (nextStage === 8) {
            setForecastProgress(0);
          }
        } else {
          // Completed simulation
          setStage(9);
          setIsPlaying(false);
          setSimTimeUTC('COMPLETE');
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, stage]);

  const seekTimeline = useCallback((pos: number) => {
    setTimelineProgress(Math.max(0, Math.min(100, pos)));
  }, []);

  const simStateObj: SimulationState = {
    stage,
    isPlaying,
    attributionScore,
    timelineProgress,
    simTimeUTC,
    stageProgress,
  };

  return {
    simulationState: simStateObj,
    state: simStateObj,
    hindcastProgress,
    forecastProgress,
    scanAngle,
    startSimulation,
    start: startSimulation,
    pauseSimulation,
    resumeSimulation,
    togglePlayPause,
    replaySimulation,
    resetSimulation,
    reset: resetSimulation,
    goToStage,
    skipStage,
    seekTimeline,
  };
}
