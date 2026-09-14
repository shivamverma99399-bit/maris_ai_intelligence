"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Satellite,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  ZoomIn,
  RefreshCw,
  FileText,
  Sliders,
  Eye,
  Crosshair,
  ShieldCheck,
  Compass,
} from "lucide-react";

interface SatelliteImageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueInvestigation: () => void;
}

type ModalStage = "upload" | "preview" | "scanning" | "results";
type ViewTab = "original" | "detection" | "mask" | "compare";

export const SatelliteImageAnalysisModal: React.FC<SatelliteImageAnalysisModalProps> = ({
  isOpen,
  onClose,
  onContinueInvestigation,
}) => {
  const [stage, setStage] = useState<ModalStage>("upload");
  const [viewTab, setViewTab] = useState<ViewTab>("detection");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("647bfdaec0d0218e2a95658-1786721951551.jpeg");
  const [fileSize, setFileSize] = useState<string>("68.5 KB");
  const [resolution, setResolution] = useState<string>("1280 x 1280");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(18);
  const [activeScanStep, setActiveScanStep] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanSteps = [
    "Calibrating SAR Range & Azimuth Swath",
    "Backscatter Threshold & Ocean Segmentation",
    "Dark Formation Morphology Classification",
    "Boundary Delineation & Feature Extraction",
    "Target Verification & Co-registration",
  ];

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      // Default to upload stage
      setStage("upload");
      setSelectedImage(null);
      setScanProgress(18);
      setActiveScanStep(0);
      setViewTab("detection");
    }
  }, [isOpen]);

  // Handle Scanning Progress Simulation
  useEffect(() => {
    if (stage === "scanning") {
      setScanProgress(18);
      setActiveScanStep(0);

      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 92) {
            clearInterval(interval);
            setTimeout(() => {
              setStage("results");
            }, 600);
            return 92;
          }
          const next = prev + 12;
          if (next >= 35) setActiveScanStep(1);
          if (next >= 55) setActiveScanStep(2);
          if (next >= 75) setActiveScanStep(3);
          if (next >= 90) setActiveScanStep(4);
          return next;
        });
      }, 350);

      return () => clearInterval(interval);
    }
  }, [stage]);

  if (!isOpen) return null;

  const handleSelectDemoImage = () => {
    // Demo SAR Satellite image (Procedural high-detail canvas)
    setSelectedImage("/textures/earth_specular.jpg");
    setFileName("sentinel1_sar_mumbai_high_vv.jpeg");
    setFileSize("68.5 KB");
    setResolution("1280 x 1280");
    setStage("preview");
  };

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setResolution("1280 x 1280");
    setStage("preview");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      id="satellite-analysis-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        id="satellite-analysis-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-[rgba(10,8,16,0.95)] border border-[rgba(176,38,255,0.4)] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(157,0,255,0.25)] overflow-hidden flex flex-col font-mono text-[#B9ADBF] backdrop-blur-[24px] relative animate-fade-in max-h-[92vh]"
      >
        {/* Corner Reticles */}
        <div className="corner-reticle-tl" />
        <div className="corner-reticle-tr" />
        <div className="corner-reticle-bl" />
        <div className="corner-reticle-br" />

        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-[rgba(16,11,24,0.9)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(25,17,34,0.9)] border border-[rgba(176,38,255,0.50)] flex items-center justify-center text-[#D6A7FF] shadow-[0_0_12px_rgba(157,0,255,0.3)]">
              <Satellite className="w-4 h-4 text-[#B026FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#F2EDF7] tracking-wider uppercase">
                  SATELLITE IMAGE ANALYSIS
                </h2>
                <span className="text-[10px] text-[#81758F] font-normal">
                  // SAR / EO IMAGERY INGESTION
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stage === "upload" && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                READY
              </span>
            )}
            {stage === "scanning" && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/60 border border-[#B026FF]/50 text-[#D6A7FF] flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-[#B026FF]" />
                SCANNING
              </span>
            )}
            {stage === "results" && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-rose-400" />
                CLASSIFIED
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#81758F] hover:text-[#F2EDF7] hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[460px] flex flex-col justify-center">
          {/* STAGE 1: Upload / Dropzone */}
          {stage === "upload" && (
            <div className="flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto w-full py-8">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center relative ${
                  isDragging
                    ? "border-[#B026FF] bg-[rgba(176,38,255,0.1)] shadow-[0_0_30px_rgba(176,38,255,0.3)]"
                    : "border-[rgba(157,0,255,0.25)] bg-[rgba(16,11,24,0.6)] hover:border-[rgba(176,38,255,0.5)] hover:bg-[rgba(16,11,24,0.8)]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/tiff,.tif,.geotiff"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-[rgba(25,17,34,0.8)] border border-[rgba(176,38,255,0.5)] flex items-center justify-center text-[#D6A7FF] shadow-[0_0_20px_rgba(157,0,255,0.35)] mb-4">
                  <Upload className="w-7 h-7 text-[#B026FF]" />
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  Drop satellite imagery here
                </h3>
                <p className="text-xs text-[#81758F] mb-4">
                  or browse from your computer
                </p>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[10px] text-[#B9ADBF]">
                    PNG
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[10px] text-[#B9ADBF]">
                    JPG
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[10px] text-[#B9ADBF]">
                    TIFF
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[10px] text-[#B9ADBF]">
                    GeoTIFF
                  </span>
                </div>
              </div>

              {/* Ingestion Footer: Client-Side Sandbox Notice + Try Demo Button */}
              <div className="w-full flex items-center justify-between text-[11px] pt-2">
                <div className="flex items-center gap-2 text-[#81758F]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    CLIENT-SIDE PROCESSING // Zero server upload - Analysis runs in sandbox
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSelectDemoImage}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl maris-btn-investigate text-white font-bold text-xs shadow-[0_0_15px_rgba(176,38,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TRY DEMO IMAGE</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: Image Preview Before Analysis */}
          {stage === "preview" && (
            <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
              <div className="w-full relative rounded-xl border border-[rgba(176,38,255,0.35)] bg-slate-950 overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.8)] aspect-[16/10] max-h-[380px] flex items-center justify-center">
                {/* Visual Satellite Image Representation */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${selectedImage || "/textures/earth_day.jpg"})`,
                    filter: "contrast(1.25) brightness(0.9)",
                  }}
                />

                {/* Radar Grid Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(176, 38, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(176, 38, 255, 0.2) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* Top Reticle Coordinates Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-[rgba(10,8,16,0.85)] border border-[rgba(255,255,255,0.1)] text-[10px] text-[#D6A7FF] flex items-center gap-1.5 backdrop-blur-[8px]">
                  <Crosshair className="w-3 h-3 text-[#B026FF]" />
                  <span>18° 54&apos; 36&quot; N, 72° 49&apos; 12&quot; E</span>
                </div>

                {/* Satellite Attribution Watermark */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[rgba(10,8,16,0.7)] text-[9px] text-slate-400">
                  Sentinel-1 C-Band SAR // European Union / Copernicus
                </div>

                {/* Zoom Badge */}
                <div className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded bg-[rgba(10,8,16,0.85)] text-[10px] text-[#81758F] flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-[#B026FF]" />
                  <span>Interactive Zoom Active</span>
                </div>
              </div>

              {/* Preview Footer Toolbar */}
              <div className="w-full flex items-center justify-between p-3 rounded-xl bg-[rgba(16,11,24,0.7)] border border-[rgba(255,255,255,0.06)] text-xs">
                <div className="flex items-center gap-4 text-[#81758F]">
                  <div>
                    RESOLUTION: <strong className="text-white font-mono">{resolution}</strong>
                  </div>
                  <div>
                    FILE SIZE: <strong className="text-white font-mono">{fileSize}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg maris-btn-glass text-[#D6A7FF] text-xs font-bold hover:text-white transition-all cursor-pointer"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={() => setStage("upload")}
                    className="px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setStage("scanning")}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl maris-btn-investigate text-white text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(176,38,255,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ANALYZE IMAGE</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: Scanning & Remote Sensing Extraction */}
          {stage === "scanning" && (
            <div className="flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto w-full py-6">
              <div className="w-full p-6 rounded-2xl bg-[rgba(16,11,24,0.85)] border border-[rgba(176,38,255,0.35)] shadow-[0_0_40px_rgba(157,0,255,0.2)] space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#B026FF] animate-ping" />
                      Processing Remote Sensing
                    </h3>
                    <p className="text-[11px] text-[#81758F] mt-0.5">
                      SAR DEEP LEARNING EXTRACTION
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#81758F] block">Confidence</span>
                    <span className="text-xl font-extrabold text-[#67E8F9] font-mono">
                      {scanProgress}%
                    </span>
                  </div>
                </div>

                {/* Neon Progress Bar */}
                <div className="w-full bg-[rgba(255,255,255,0.06)] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8A00E8] via-[#B026FF] to-[#67E8F9] transition-all duration-300 shadow-[0_0_10px_rgba(176,38,255,0.8)]"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>

                {/* 5 Progression Steps with Checkmarks */}
                <div className="space-y-2.5 pt-2">
                  {scanSteps.map((stepName, idx) => {
                    const isDone = activeScanStep > idx || scanProgress >= 90;
                    const isActive = activeScanStep === idx && scanProgress < 90;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border transition-all ${
                          isDone
                            ? "bg-[rgba(16,185,129,0.08)] border-emerald-500/30 text-emerald-300"
                            : isActive
                            ? "bg-[rgba(176,38,255,0.12)] border-[#B026FF]/40 text-[#D6A7FF] shadow-[0_0_10px_rgba(176,38,255,0.2)]"
                            : "bg-[rgba(255,255,255,0.02)] border-transparent text-[#81758F]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isActive ? (
                            <RefreshCw className="w-4 h-4 text-[#B026FF] animate-spin" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-700" />
                          )}
                          <span>{stepName}</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-80">
                          {isDone ? "100%" : isActive ? `${scanProgress}%` : "PENDING"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: Detection & Mask Classification Results */}
          {stage === "results" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: Image with Slick Detection Overlay & Tabs */}
              <div className="lg:col-span-8 flex flex-col space-y-3">
                {/* View Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(16,11,24,0.7)] border border-[rgba(255,255,255,0.06)] w-fit text-xs font-mono">
                  {(["original", "detection", "mask", "compare"] as ViewTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setViewTab(tab)}
                      className={`px-3 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${
                        viewTab === tab
                          ? "bg-[#B026FF] text-white shadow-[0_0_10px_rgba(176,38,255,0.4)]"
                          : "text-[#81758F] hover:text-[#D6A7FF]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Main Image Container */}
                <div className="relative w-full aspect-[16/10] rounded-xl border border-[rgba(176,38,255,0.4)] bg-slate-950 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${selectedImage || "/textures/earth_day.jpg"})`,
                      filter:
                        viewTab === "mask"
                          ? "grayscale(100%) contrast(2.5) invert(1)"
                          : "contrast(1.2) brightness(0.9)",
                    }}
                  />

                  {/* Synthetic Petroleum Dark Slick Shape overlay */}
                  {(viewTab === "detection" || viewTab === "compare") && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Organic Slick Contour */}
                      <div className="relative w-48 h-32 rounded-[45%_55%_65%_35%/50%_60%_40%_50%] bg-[rgba(18,12,8,0.88)] border-2 border-[#F59E0B] shadow-[0_0_25px_rgba(245,158,11,0.6)] rotate-12 flex items-center justify-center">
                        <div className="px-2 py-1 rounded bg-black/80 border border-[#F59E0B] text-[9px] font-mono text-amber-300 font-bold tracking-tight shadow-md">
                          OIL SLICK // 42.8 km²
                          <span className="block text-[8px] text-[#81758F]">CONFIDENCE 92%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spill Detected Top-Left Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[10px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-[8px]">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    <span>SPILL DETECTED // CONFIDENCE 92%</span>
                  </div>

                  {/* Satellite Watermark */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 text-[9px] text-slate-400">
                    European Union / Copernicus
                  </div>
                </div>
              </div>

              {/* Right Column: Intelligence Telemetry Dossier & Actions */}
              <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-[rgba(16,11,24,0.85)] border border-[rgba(176,38,255,0.35)] space-y-4">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        MARIS ANALYSIS
                      </h3>
                      <p className="text-[10px] text-[#81758F]">TOP 1 TARGET</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[rgba(176,38,255,0.2)] border border-[rgba(176,38,255,0.45)] text-[#D6A7FF]">
                      CLASSIFIED
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#81758F]">Detection</span>
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Oil Spill (Detected)
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#81758F]">Confidence</span>
                      <span className="text-emerald-400 font-bold font-mono">92%</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#81758F]">Estimated Area</span>
                      <span className="text-rose-300 font-bold font-mono">42.8 km²</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#81758F]">Estimated Age</span>
                      <span className="text-white font-mono">4–7 hrs</span>
                    </div>
                  </div>

                  {/* Spill Geometry Metrics */}
                  <div className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] space-y-1 text-xs">
                    <span className="text-[10px] text-[#D6A7FF] font-bold block uppercase">
                      Spill Geometry
                    </span>
                    <div className="flex justify-between text-[#81758F]">
                      <span>Length</span>
                      <span className="text-white font-mono">18.6 km</span>
                    </div>
                    <div className="flex justify-between text-[#81758F]">
                      <span>Width</span>
                      <span className="text-white font-mono">4.2 km</span>
                    </div>
                    <div className="flex justify-between text-[#81758F]">
                      <span>Orientation</span>
                      <span className="text-[#67E8F9] font-mono">017° (NE DRIFT)</span>
                    </div>
                  </div>

                  {/* Data & Attribution */}
                  <div className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] space-y-1 text-xs">
                    <span className="text-[10px] text-[#D6A7FF] font-bold block uppercase">
                      Data & Attribution
                    </span>
                    <div className="flex justify-between text-[#81758F]">
                      <span>SAR Feature</span>
                      <span className="text-slate-300">Verified Dark Slick</span>
                    </div>
                    <div className="flex justify-between text-[#81758F]">
                      <span>Scenario</span>
                      <span className="text-[#FDE047] font-mono">DEMO SIMULATION</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Trigger Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onContinueInvestigation();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl maris-btn-glass text-[#D6A7FF] hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#B026FF]" />
                    <span>ANALYZE IN GLOBE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onContinueInvestigation();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl maris-btn-investigate text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(176,38,255,0.6)] hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
                  >
                    <span>CONTINUE INVESTIGATION</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
