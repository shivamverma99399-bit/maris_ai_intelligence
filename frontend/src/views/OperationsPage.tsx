"use client";
import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
  Radio,
  Satellite,
  Waves,
  Ship,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { OperationalEvent } from '../types';
import { OPERATIONAL_EVENTS } from '../data/operationalEvents';

export const OperationsPage: React.FC = () => {
  const [events] = useState<OperationalEvent[]>(OPERATIONAL_EVENTS);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(2); // Default to SPILL-IND-042 DETECTED
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const selectedEvent = events[selectedEventIndex];

  // Auto playback effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedEventIndex((prev) => {
          if (prev >= events.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }, 3500 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, events.length]);

  const handlePrev = () => {
    setSelectedEventIndex((prev) => (prev > 0 ? prev - 1 : events.length - 1));
  };

  const handleNext = () => {
    setSelectedEventIndex((prev) => (prev < events.length - 1 ? prev + 1 : 0));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SATELLITE':
        return Satellite;
      case 'AIS':
        return Ship;
      case 'INCIDENT':
        return AlertTriangle;
      case 'DISPERSION':
        return Waves;
      case 'INVESTIGATION':
        return Search;
      default:
        return Radio;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-5 max-w-[1700px] w-full mx-auto animate-fade-in font-mono">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(157,0,255,0.14)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#F2EDF7]">
              Operational Timeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(176,38,255,0.2)] border border-[rgba(176,38,255,0.45)] text-[#E9D5FF] tracking-wider">
              MISSION SEQUENCE T-06:20 TO T-10:30
            </span>
          </div>
          <p className="text-xs text-[#81758F] mt-0.5">
            Synchronized timeline of satellite passes, AIS telemetry alerts, plume dispersion peaks & inter-agency investigations
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgba(18,13,24,0.65)] border border-[rgba(255,255,255,0.08)] text-xs text-[#D9B8FF]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>REAL-TIME TELEMETRY REPLAY ACTIVE</span>
        </div>
      </div>

      {/* Main Interactive Horizontal Timeline Section */}
      <div className="my-4 maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.25)] p-4 sm:p-6 shadow-2xl space-y-6">
        {/* Timeline Transport Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Event"
              className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(157,0,255,0.2)] border border-[rgba(255,255,255,0.08)] text-[#F2EDF7] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-[rgba(239,68,68,0.2)] text-[#F87171] border border-[#EF4444]'
                  : 'maris-btn-investigate text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'PAUSE SEQUENCE' : 'PLAY SEQUENCE'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              title="Next Event"
              className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(157,0,255,0.2)] border border-[rgba(255,255,255,0.08)] text-[#F2EDF7] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSelectedEventIndex(0);
              }}
              title="Reset Timeline to 06:20"
              className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(157,0,255,0.2)] border border-[rgba(255,255,255,0.08)] text-[#81758F] hover:text-[#F2EDF7] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Current Event Timestamp Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-[#81758F] block">CURRENT EVENT TIME</span>
              <span className="text-lg font-bold text-[#FDE047] tracking-wider">{selectedEvent.time} UTC</span>
            </div>

            {/* Playback speed toggle */}
            <div className="flex items-center gap-1 bg-[rgba(10,8,15,0.8)] p-1 rounded-lg border border-[rgba(255,255,255,0.08)] text-[10px]">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-[#B026FF] text-white font-bold'
                      : 'text-[#81758F] hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Large Horizontal Interactive Track */}
        <div className="relative pt-4 pb-8 px-2 overflow-x-auto">
          {/* Background Track Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[rgba(157,0,255,0.2)] -translate-y-1/2 rounded-full" />

          {/* Progress Filled Track */}
          <div
            className="absolute top-1/2 left-0 h-1 maris-timeline-bar -translate-y-1/2 rounded-full transition-all duration-300"
            style={{
              width: `${(selectedEventIndex / (events.length - 1)) * 100}%`,
            }}
          />

          {/* Event Nodes Along Horizontal Line */}
          <div className="relative flex items-center justify-between min-w-[720px]">
            {events.map((evt, idx) => {
              const isSelected = idx === selectedEventIndex;
              const isPast = idx <= selectedEventIndex;
              const Icon = getCategoryIcon(evt.category);

              let badgeColor = 'border-[rgba(157,0,255,0.4)] text-[#D9B8FF]';
              if (evt.severity === 'critical') badgeColor = 'border-red-500 text-red-400 bg-[rgba(239,68,68,0.2)]';
              else if (evt.severity === 'high') badgeColor = 'border-amber-500 text-amber-400 bg-[rgba(245,158,11,0.2)]';

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventIndex(idx)}
                  className="flex flex-col items-center cursor-pointer group select-none relative"
                >
                  {/* Top Time Pill */}
                  <div
                    className={`mb-3 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#B026FF] text-white shadow-[0_0_15px_rgba(176,38,255,0.8)] scale-110'
                        : isPast
                        ? 'bg-[rgba(157,0,255,0.2)] text-[#D9B8FF] border border-[rgba(176,38,255,0.4)]'
                        : 'bg-[rgba(18,13,24,0.8)] text-[#81758F] border border-[rgba(255,255,255,0.06)]'
                    }`}
                  >
                    {evt.time}
                  </div>

                  {/* Circle Node on Timeline */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 ${
                      isSelected
                        ? 'bg-white text-[#8A00E8] ring-4 ring-[#B026FF] shadow-[0_0_20px_rgba(176,38,255,0.9)] scale-125'
                        : isPast
                        ? 'bg-[#B026FF] text-white'
                        : 'bg-[#15101D] text-[#81758F] border-2 border-[rgba(157,0,255,0.3)] group-hover:border-[#B026FF]'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2]" />
                  </div>

                  {/* Event Title Below */}
                  <div className="mt-3 text-center max-w-[110px]">
                    <div
                      className={`text-[11px] font-bold tracking-tight uppercase leading-tight ${
                        isSelected
                          ? 'text-[#F2EDF7]'
                          : isPast
                          ? 'text-[#B9ADBF]'
                          : 'text-[#81758F]'
                      }`}
                    >
                      {evt.title}
                    </div>
                    <span className="text-[9px] text-[#81758F] block mt-0.5">
                      {evt.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Scrub Slider Bar */}
        <div className="pt-2">
          <input
            type="range"
            min={0}
            max={events.length - 1}
            step={1}
            value={selectedEventIndex}
            onChange={(e) => setSelectedEventIndex(Number(e.target.value))}
            className="w-full accent-[#B026FF] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#81758F] mt-1">
            <span>06:20 SATELLITE PASS</span>
            <span>DRAG SCRUBBER TO REPLAY INCIDENT EVOLUTION</span>
            <span>10:30 VESSEL TRACK UPDATED</span>
          </div>
        </div>
      </div>

      {/* Selected Event Details in Dedicated Glass Panel (as specified by prompt) */}
      <div className="flex-1 min-h-0 maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.3)] p-4 sm:p-6 shadow-2xl flex flex-col gap-4 overflow-y-auto">
        {/* Header of event details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              selectedEvent.severity === 'critical'
                ? 'bg-[rgba(239,68,68,0.2)] border-red-500 text-red-400'
                : selectedEvent.severity === 'high'
                ? 'bg-[rgba(245,158,11,0.2)] border-amber-500 text-amber-400'
                : 'bg-[rgba(157,0,255,0.2)] border-[#B026FF] text-[#D9B8FF]'
            }`}>
              {React.createElement(getCategoryIcon(selectedEvent.category), { className: 'w-5 h-5' })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#81758F]">EVENT #{selectedEvent.id}</span>
                <span className="text-xs text-[#81758F]">•</span>
                <span className="text-xs text-[#67E8F9] font-bold">{selectedEvent.time} UTC</span>
              </div>
              <h2 className="text-lg font-bold text-[#F2EDF7] uppercase tracking-wide">
                {selectedEvent.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              selectedEvent.severity === 'critical'
                ? 'bg-[rgba(239,68,68,0.2)] text-[#FF858D] border-[rgba(239,68,68,0.5)]'
                : 'bg-[rgba(16,185,129,0.15)] text-[#34D399] border-[rgba(16,185,129,0.35)]'
            }`}>
              STATUS: {selectedEvent.status}
            </span>
          </div>
        </div>

        {/* Narrative & Location */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-xl bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] space-y-2">
              <span className="text-xs font-bold uppercase text-[#D6A7FF] tracking-wider block">
                Tactical Event Briefing
              </span>
              <p className="text-sm text-[#F2EDF7] leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] space-y-2">
              <span className="text-xs font-bold uppercase text-[#67E8F9] tracking-wider block">
                Sensor & Spectral Telemetry Log
              </span>
              <p className="text-xs text-[#B9ADBF] leading-relaxed font-mono">
                {selectedEvent.telemetry}
              </p>
            </div>
          </div>

          {/* Operational Metadata Card */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] space-y-1">
              <span className="text-[10px] text-[#81758F] uppercase block">GEOGRAPHIC SECTOR</span>
              <span className="text-xs text-[#F2EDF7] font-bold block">{selectedEvent.location}</span>
            </div>

            {selectedEvent.assignedUnit && (
              <div className="p-3.5 rounded-xl bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] space-y-1">
                <span className="text-[10px] text-[#81758F] uppercase block">ASSIGNED ASSET / AGENCY</span>
                <span className="text-xs text-[#FDE047] font-bold block">{selectedEvent.assignedUnit}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] space-y-1">
              <span className="text-[10px] text-[#81758F] uppercase block">MISSION VERIFICATION</span>
              <div className="flex items-center gap-1.5 text-xs text-[#34D399] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>SAR / AIS Multi-Sensor Validated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
