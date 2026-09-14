"use client";

import React from "react";
import { Incident, OriginEstimate } from "@/lib/api";
import { Droplet, Clock, Compass, AlertTriangle, ShieldCheck, MapPin, Layers, Radio } from "lucide-react";

interface IncidentHeaderProps {
  incident: Incident | null;
  origin: OriginEstimate | null;
  candidateCount: number;
}

export const IncidentHeader: React.FC<IncidentHeaderProps> = ({ incident, origin, candidateCount }) => {
  const spill = incident?.spills?.[0];

  const formatUtc = (isoString?: string) => {
    if (!isoString) return "12 AUG 2026 • 08:30 UTC";
    try {
      const d = new Date(isoString);
      return d.toUTCString().replace("GMT", "UTC");
    } catch {
      return isoString;
    }
  };

  const estimatedDischarge = spill ? (spill.area_km2 * 10.0).toFixed(1) : "185.0";

  return (
    <div className="bg-[rgba(10,9,16,0.92)] border-b border-[rgba(157,0,255,0.22)] p-4 sm:p-5 backdrop-blur-[20px] font-mono select-none relative overflow-hidden">
      {/* Corner reticle */}
      <div className="corner-reticle-tl" />
      <div className="corner-reticle-tr" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Metadata */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF858D] animate-ping" />
              SAR OIL SPILL VERIFIED
            </span>
            <span className="px-2 py-0.5 text-xs bg-[rgba(25,17,34,0.7)] text-[#D6A7FF] border border-[rgba(176,38,255,0.4)] rounded font-mono font-bold">
              {incident?.incident_id || "INC-DEMO-2026"}
            </span>
            <span className="px-2 py-0.5 text-xs bg-cyan-950/50 text-[#67E8F9] border border-cyan-500/40 rounded font-bold">
              Sentinel-1 C-Band (94% Confidence)
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {incident?.title || "Mumbai High Offshore Sector 4 Oil Slick Detection"}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#81758F]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#67E8F9]" />
              <span>Observed: <strong className="text-white font-mono">{formatUtc(incident?.observation_time)}</strong></span>
            </div>
            {origin && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FDE047]" />
                <span>Origin Centroid: <strong className="text-white font-mono">{origin.probable_origin_lat.toFixed(3)}°N, {origin.probable_origin_lon.toFixed(3)}°E</strong> (±{origin.uncertainty_radius_km.toFixed(1)} km)</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#34D399]" />
              <span>AIS Correlated Vessels: <strong className="text-emerald-300 font-mono">{candidateCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Telemetry Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="bg-[rgba(18,13,24,0.85)] border border-[rgba(157,0,255,0.25)] rounded-xl px-3 py-2 shadow-inner">
            <div className="text-[10px] text-[#81758F] flex items-center justify-between">
              <span>SLICK AREA</span>
              <Droplet className="w-3.5 h-3.5 text-[#FF858D]" />
            </div>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {spill ? spill.area_km2.toFixed(2) : "18.45"} <span className="text-[10px] font-normal text-[#81758F]">km²</span>
            </div>
          </div>

          <div className="bg-[rgba(18,13,24,0.85)] border border-[rgba(157,0,255,0.25)] rounded-xl px-3 py-2 shadow-inner">
            <div className="text-[10px] text-[#81758F] flex items-center justify-between">
              <span>PERIMETER</span>
              <Compass className="w-3.5 h-3.5 text-[#67E8F9]" />
            </div>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {spill ? spill.perimeter_km.toFixed(1) : "26.8"} <span className="text-[10px] font-normal text-[#81758F]">km</span>
            </div>
          </div>

          <div className="bg-[rgba(18,13,24,0.85)] border border-[rgba(157,0,255,0.25)] rounded-xl px-3 py-2 shadow-inner">
            <div className="text-[10px] text-[#81758F] flex items-center justify-between">
              <span>ELONGATION</span>
              <Layers className="w-3.5 h-3.5 text-[#D6A7FF]" />
            </div>
            <div className="text-lg font-black text-[#D6A7FF] font-mono mt-0.5">
              {spill ? spill.elongation.toFixed(2) : "2.85"} <span className="text-[10px] font-normal text-[#81758F]">ratio</span>
            </div>
          </div>

          <div className="bg-[rgba(18,13,24,0.85)] border border-[rgba(157,0,255,0.25)] rounded-xl px-3 py-2 shadow-inner">
            <div className="text-[10px] text-[#81758F] flex items-center justify-between">
              <span>EST. DISCHARGE</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#FDE047]" />
            </div>
            <div className="text-lg font-black text-[#FDE047] font-mono mt-0.5">
              ~{estimatedDischarge} <span className="text-[10px] font-normal text-[#81758F]">MT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
