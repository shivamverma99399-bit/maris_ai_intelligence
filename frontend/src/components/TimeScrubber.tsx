"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward, Clock } from "lucide-react";

interface TimeScrubberProps {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  originWindowStart?: string;
  originWindowEnd?: string;
  onTimeChange: (timeIso: string) => void;
}

export const TimeScrubber: React.FC<TimeScrubberProps> = ({
  startTime,
  endTime,
  originWindowStart,
  originWindowEnd,
  onTimeChange,
}) => {
  const startMs = new Date(startTime || "2026-08-12T02:00:00Z").getTime();
  const endMs = new Date(endTime || "2026-08-12T08:30:00Z").getTime();
  const totalDurationMs = Math.max(1000, endMs - startMs);

  const [currentMs, setCurrentMs] = useState<number>(startMs);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5); // 5x multiplier

  // Sync time changes to parent
  useEffect(() => {
    onTimeChange(new Date(currentMs).toISOString());
  }, [currentMs, onTimeChange]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentMs((prev) => {
        const next = prev + 60 * 1000 * playbackSpeed;
        if (next >= endMs) {
          setIsPlaying(false);
          return endMs;
        }
        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, endMs]);

  // Relative percentages for origin window markers on the track
  const originStartPct = originWindowStart
    ? Math.max(0, Math.min(100, ((new Date(originWindowStart).getTime() - startMs) / totalDurationMs) * 100))
    : 18;
  const originEndPct = originWindowEnd
    ? Math.max(0, Math.min(100, ((new Date(originWindowEnd).getTime() - startMs) / totalDurationMs) * 100))
    : 62;

  const currentPct = Math.max(0, Math.min(100, ((currentMs - startMs) / totalDurationMs) * 100));

  const formatUtcTime = (ms: number) => {
    const d = new Date(ms);
    return d.toUTCString().replace("GMT", "UTC").replace(/^.*?, \d+ \w+ \d+ /, "");
  };

  return (
    <div className="bg-[rgba(10,9,16,0.92)] border-t border-[rgba(157,0,255,0.22)] px-4 sm:px-6 py-3 backdrop-blur-[20px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none z-30 font-mono text-[#B9ADBF] relative">
      {/* Reticle Brackets */}
      <div className="corner-reticle-bl" />
      <div className="corner-reticle-br" />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 rounded-xl maris-btn-investigate flex items-center justify-center transition shadow-[0_0_15px_rgba(157,0,255,0.4)] cursor-pointer"
          title={isPlaying ? "Pause Simulation" : "Play Simulation"}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white text-white" /> : <Play className="w-4 h-4 fill-white text-white ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setCurrentMs(startMs);
          }}
          className="p-2 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#81758F] hover:text-white transition border border-[rgba(255,255,255,0.06)] cursor-pointer"
          title="Reset to initial time"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Speed selection */}
        <div className="flex items-center bg-[rgba(18,13,24,0.7)] border border-[rgba(255,255,255,0.08)] rounded-xl p-0.5 text-xs font-mono">
          {[1, 5, 15].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                playbackSpeed === speed
                  ? "bg-gradient-to-r from-[#8A00E8] to-[#B026FF] text-white font-bold shadow-[0_0_10px_rgba(157,0,255,0.4)]"
                  : "text-[#81758F] hover:text-white"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#67E8F9] bg-[rgba(6,182,212,0.12)] border border-[rgba(6,182,212,0.25)] px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-bold">{formatUtcTime(currentMs)}</span>
        </div>
      </div>

      {/* Scrubber Timeline Bar */}
      <div className="flex-1 max-w-xl mx-2 relative flex flex-col gap-1.5">
        <div className="relative w-full h-3 bg-[rgba(25,17,34,0.8)] border border-[rgba(255,255,255,0.08)] rounded-full overflow-hidden flex items-center">
          {/* Estimated Discharge Window Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-[rgba(245,158,11,0.25)] border-l border-r border-[#F59E0B]"
            style={{
              left: `${originStartPct}%`,
              width: `${Math.max(2, originEndPct - originStartPct)}%`,
            }}
            title="Estimated Discharge Window (Origin Crossing)"
          />

          {/* Active progress fill */}
          <div
            className="h-full bg-gradient-to-r from-[#8A00E8] via-[#B026FF] to-[#D6A7FF] transition-all duration-75"
            style={{ width: `${currentPct}%` }}
          />

          {/* Draggable Scrubber Handle */}
          <div
            className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-white border-2 border-[#B026FF] rounded-full shadow-[0_0_10px_#B026FF] cursor-ew-resize"
            style={{ left: `${currentPct}%` }}
          />
        </div>

        <input
          type="range"
          min={startMs}
          max={endMs}
          value={currentMs}
          onChange={(e) => setCurrentMs(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />

        {/* Labels below bar */}
        <div className="flex items-center justify-between text-[10px] text-[#81758F]">
          <span>{formatUtcTime(startMs)} (T-6.5h)</span>
          <span className="text-[#FBBF24] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            Discharge Window (02:10 – 04:55 UTC)
          </span>
          <span>{formatUtcTime(endMs)} (T_obs)</span>
        </div>
      </div>
    </div>
  );
};
