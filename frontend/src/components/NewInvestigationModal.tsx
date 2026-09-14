"use client";

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  Calendar,
  Compass,
  Radio,
  Wind,
  ShieldAlert,
  Play,
  Layers,
  Sparkles,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface NewInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: (config: {
    file: File | null;
    observationTime: string;
    sector: string;
    aisSource: string;
    envSource: string;
    isDemo: boolean;
  }) => void;
}

export const NewInvestigationModal: React.FC<NewInvestigationModalProps> = ({
  isOpen,
  onClose,
  onStartAnalysis,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [observationTime, setObservationTime] = useState("2026-08-12T08:30");
  const [sector, setSector] = useState("Mumbai High Sector 4 (Arabian Sea)");
  const [aisSource, setAisSource] = useState("Indian EEZ Live AIS Telemetry (Mumbai High)");
  const [envSource, setEnvSource] = useState("INCOIS / ECMWF Surface Vectors (0.34 m/s NE, 12 kt WSW)");
  const [useDemoPreset, setUseDemoPreset] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUseDemoPreset(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUseDemoPreset(false);
    }
  };

  const handleLoadPreset = () => {
    setSelectedFile(null);
    setUseDemoPreset(true);
    setObservationTime("2026-08-12T08:30");
  };

  const handleExecute = () => {
    onStartAnalysis({
      file: selectedFile,
      observationTime,
      sector,
      aisSource,
      envSource,
      isDemo: useDemoPreset,
    });
    onClose();
  };

  return (
    <div
      id="new-investigation-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        id="new-investigation-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[rgba(12,9,18,0.92)] border border-[rgba(176,38,255,0.4)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(157,0,255,0.22)] overflow-hidden flex flex-col font-mono text-[#B9ADBF] backdrop-blur-[24px] relative animate-fade-in max-h-[90vh]"
      >
        {/* Reticle Brackets */}
        <div className="corner-reticle-tl" />
        <div className="corner-reticle-tr" />
        <div className="corner-reticle-bl" />
        <div className="corner-reticle-br" />

        {/* Header */}
        <div className="p-4 sm:p-5 bg-[rgba(18,13,24,0.88)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(25,17,34,0.8)] border border-[rgba(176,38,255,0.50)] flex items-center justify-center text-[#D6A7FF] shadow-[0_0_15px_rgba(157,0,255,0.3)]">
              <ShieldAlert className="w-5 h-5 text-[#B026FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#F2EDF7] tracking-wider uppercase">
                  New Maritime Incident Intake
                </h3>
                <span className="px-2 py-0.5 text-[9px] rounded-full uppercase border font-bold text-cyan-300 border-cyan-500/40 bg-cyan-950/60">
                  TIER 1 PROTOCOL
                </span>
              </div>
              <p className="text-xs text-[#81758F]">
                Autonomous Satellite Ingestion & AIS Correlation Dispatch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#81758F] hover:text-[#F2EDF7] hover:bg-[rgba(255,255,255,0.06)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Preset Toggle Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(157,0,255,0.08)] border border-[rgba(176,38,255,0.25)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D9B8FF]" />
              <span className="text-xs text-[#F2EDF7] font-bold">
                Canonical SIH Demo Scenario
              </span>
            </div>
            <button
              type="button"
              onClick={handleLoadPreset}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                useDemoPreset
                  ? 'bg-gradient-to-r from-[#8A00E8] to-[#B026FF] text-white shadow-[0_0_12px_rgba(157,0,255,0.4)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#B9ADBF] hover:text-white'
              }`}
            >
              {useDemoPreset ? '✓ Mumbai High Preset Active' : 'Load Mumbai High Preset'}
            </button>
          </div>

          {/* SAR Image Ingestion Zone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#E9D5FF] uppercase tracking-wider flex items-center justify-between">
              <span>1. Satellite Synthetic Aperture Radar (SAR) Evidence</span>
              <span className="text-[10px] text-[#81758F]">GeoTIFF / PNG / NetCDF</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".tif,.tiff,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />

            {useDemoPreset && !selectedFile ? (
              <div className="p-4 rounded-xl border border-[rgba(176,38,255,0.35)] bg-[rgba(25,17,34,0.6)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(157,0,255,0.2)] border border-[rgba(176,38,255,0.4)] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#D6A7FF]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      S1A_IW_GRDH_1SDV_20260812T0830_MUMBAI_HIGH.tiff
                    </span>
                    <span className="text-[10px] text-[#81758F]">
                      Sentinel-1 C-Band SAR &bull; VV/VH Cross-Polarized &bull; 10m Ground Resolution (18.45 km² Anomaly)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(157,0,255,0.2)] text-[10px] text-[#D9B8FF] border border-[rgba(255,255,255,0.1)] transition-colors"
                >
                  Upload Custom
                </button>
              </div>
            ) : selectedFile ? (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{selectedFile.name}</span>
                    <span className="text-[10px] text-emerald-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ingestion Ready &bull; PyTorch U-Net Inference Mode
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                  isDragging
                    ? 'border-[#B026FF] bg-[rgba(157,0,255,0.15)] scale-[1.01]'
                    : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(176,38,255,0.5)] bg-[rgba(18,13,24,0.4)]'
                }`}
              >
                <Upload className="w-8 h-8 text-[#B026FF] mb-2 stroke-[1.8]" />
                <span className="text-xs font-bold text-[#F2EDF7]">
                  Drag & drop SAR scene file, or click to browse
                </span>
                <span className="text-[10px] text-[#81758F] mt-1">
                  Supports Sentinel-1 GeoTIFF, PNG or binary radar matrix (max 100 MB)
                </span>
              </div>
            )}
          </div>

          {/* Observation Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#E9D5FF] flex items-center gap-1.5 uppercase">
                <Calendar className="w-3.5 h-3.5 text-[#B026FF]" />
                <span>Observation Time (UTC)</span>
              </label>
              <input
                type="datetime-local"
                value={observationTime}
                onChange={(e) => setObservationTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.1)] text-xs text-[#F2EDF7] font-mono focus:border-[#B026FF] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#E9D5FF] flex items-center gap-1.5 uppercase">
                <Compass className="w-3.5 h-3.5 text-[#67E8F9]" />
                <span>Area of Interest (AOI)</span>
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.1)] text-xs text-[#F2EDF7] font-mono focus:border-[#B026FF] focus:outline-none"
              />
            </div>
          </div>

          {/* Telemetry Sources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#E9D5FF] flex items-center gap-1.5 uppercase">
                <Radio className="w-3.5 h-3.5 text-[#34D399]" />
                <span>AIS Vessel Telemetry Source</span>
              </label>
              <select
                value={aisSource}
                onChange={(e) => setAisSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.1)] text-xs text-[#F2EDF7] font-mono focus:border-[#B026FF] focus:outline-none"
              >
                <option value="Indian EEZ Live AIS Telemetry (Mumbai High)">
                  Indian EEZ Live AIS Telemetry (Mumbai High)
                </option>
                <option value="NMEA 0183 / JSON Raw Ingestion Stream">
                  NMEA 0183 / JSON Raw Ingestion Stream
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#E9D5FF] flex items-center gap-1.5 uppercase">
                <Wind className="w-3.5 h-3.5 text-[#67E8F9]" />
                <span>Environmental Ocean / Wind Forcing</span>
              </label>
              <select
                value={envSource}
                onChange={(e) => setEnvSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[rgba(18,13,24,0.75)] border border-[rgba(255,255,255,0.1)] text-xs text-[#F2EDF7] font-mono focus:border-[#B026FF] focus:outline-none"
              >
                <option value="INCOIS / ECMWF Surface Vectors (0.34 m/s NE, 12 kt WSW)">
                  INCOIS / ECMWF Surface Vectors (0.34 m/s NE, 12 kt WSW)
                </option>
                <option value="HYCOM Hydrodynamic Model Cache">
                  HYCOM Hydrodynamic Model Cache
                </option>
              </select>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="p-3 rounded-xl bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.25)] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#D9B8FF] leading-relaxed">
              <span className="font-bold text-[#FBBF24]">OPERATIONAL DIRECTIVE:</span> Starting analysis initiates satellite segmentation, reverse Lagrangian hindcasting, AIS kinematic cross-correlation, and counterfactual validation. Results identify the highest-ranked attribution candidate for decision support.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[rgba(18,13,24,0.92)] border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[rgba(255,255,255,0.1)] text-xs text-[#81758F] hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            className="maris-btn-investigate px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(157,0,255,0.5)] transition-transform hover:scale-105"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Analysis Pipeline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
