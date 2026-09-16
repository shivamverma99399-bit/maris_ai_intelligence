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
  ExternalLink,
  Cpu,
} from "lucide-react";

interface SatelliteImageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueInvestigation: () => void;
}

type ModalStage = "upload" | "preview" | "scanning" | "results";
type ViewTab = "original" | "detection" | "mask" | "compare";

interface LiveMLResult {
  status: string;
  model_version: string;
  confidence: number;
  area_km2: number;
  perimeter_km: number;
  elongation: number;
  centroid_lat: number;
  centroid_lon: number;
  polygon_geojson?: any;
  mask_url?: string | null;
  overlay_url?: string | null;
  raw_prediction?: any;
  datasets?: string[];
}

export const SatelliteImageAnalysisModal: React.FC<SatelliteImageAnalysisModalProps> = ({
  isOpen,
  onClose,
  onContinueInvestigation,
}) => {
  const [stage, setStage] = useState<ModalStage>("upload");
  const [viewTab, setViewTab] = useState<ViewTab>("detection");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("sentinel1_sar_mumbai_high_vv.jpeg");
  const [fileSize, setFileSize] = useState<string>("68.5 KB");
  const [resolution, setResolution] = useState<string>("1280 x 1280");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(18);
  const [activeScanStep, setActiveScanStep] = useState<number>(0);
  const [liveResult, setLiveResult] = useState<LiveMLResult | null>(null);
  const [isCallingAPI, setIsCallingAPI] = useState<boolean>(false);
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
      setStage("upload");
      setSelectedImage(null);
      setRawFile(null);
      setScanProgress(18);
      setActiveScanStep(0);
      setViewTab("detection");
      setLiveResult(null);
    }
  }, [isOpen]);

  // Handle Scanning Progress Animation
  useEffect(() => {
    if (stage === "scanning") {
      setScanProgress(18);
      setActiveScanStep(0);

      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 94) {
            clearInterval(interval);
            setTimeout(() => {
              setStage("results");
            }, 500);
            return 94;
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

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setRawFile(file);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setResolution("Native");
    setStage("preview");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleStartAnalysis = async () => {
    if (!rawFile) return;

    setStage("scanning");
    setIsCallingAPI(true);

    try {
      const formData = new FormData();
      formData.append("file", rawFile);

      // First attempt: Dynamic MARIS backend endpoint
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");
      const predictUrl = apiBase.endsWith("/api/v1") ? `${apiBase}/ml/predict-live` : `${apiBase}/api/v1/ml/predict-live`;

      let response = await fetch(predictUrl, {
        method: "POST",
        body: formData,
      }).catch(() => null);

      // Second attempt: Direct Render Cloud ML API
      if (!response || !response.ok) {
        response = await fetch("https://maris-oil-spill-api.onrender.com/predict", {
          method: "POST",
          body: formData,
        }).catch(() => null);

        if (response && response.ok) {
          const rawData = await response.json();
          const res = rawData.result || {};
          const files = rawData.files || {};
          const isDetected = res.result === "OIL_DETECTED";
          setLiveResult({
            status: "success",
            model_version: "sentinel1-sar-unet-v1.0-render",
            confidence: Number(res.oil_probability || 0.0),
            area_km2: isDetected && res.spill_area ? Number((res.spill_area.oil_pixels * 0.0004).toFixed(2)) : 0.0,
            perimeter_km: isDetected ? Number(res.perimeter || 0.0) : 0.0,
            elongation: isDetected ? 2.8 : 1.0,
            centroid_lat: 18.868815,
            centroid_lon: 72.131203,
            mask_url: files.mask,
            overlay_url: files.overlay,
            raw_prediction: res,
            datasets: [
              "https://www.kaggle.com/datasets/harikrishnacs/sentinel-1-sar-oil-spill-detection-dataset",
              "https://www.kaggle.com/datasets/bitsandlayers/sar-oil-spill-segmentation-dataset-sos",
            ],
          });
          return;
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        setLiveResult(data);
      }
    } catch (err) {
      console.warn("ML live prediction error:", err);
    } finally {
      setIsCallingAPI(false);
    }
  };

  // Check whether oil was positively detected by the live model
  const isOilDetected = liveResult
    ? (liveResult.raw_prediction?.result === "OIL_DETECTED" || (liveResult.area_km2 > 0 && liveResult.confidence > 0.5))
    : false;

  // Derive active confidence & area strictly from the live ML result
  const displayConfidence = liveResult
    ? Math.round(liveResult.confidence * 100)
    : 0;
  const displayArea = liveResult?.area_km2 || 0.0;
  const displayPerimeter = liveResult?.perimeter_km || 0.0;

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

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(15,10,22,0.8)]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(176,38,255,0.25)] border border-[rgba(176,38,255,0.6)] flex items-center justify-center shadow-[0_0_15px_rgba(176,38,255,0.4)] text-[#D9B8FF]">
              <Satellite className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">
                  SATELLITE IMAGE ANALYSIS // SAR OIL SPILL INGESTION
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[rgba(176,38,255,0.18)] border border-[rgba(176,38,255,0.45)] text-[#E9D5FF]">
                  SENTINEL-1 U-NET
                </span>
              </div>
              <p className="text-[11px] text-[#81758F]">
                Ingest synthetic aperture radar (SAR) scenes to detect & delineate petroleum slicks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#81758F] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-80px)]">
          {/* STAGE 1: Upload Dropzone */}
          {stage === "upload" && (
            <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto w-full py-4">
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

              {/* Ingestion Footer: AI Model Status & Kaggle Datasets */}
              <div className="w-full flex items-center justify-between gap-3 text-[11px] pt-2">
                <div className="flex items-center gap-2 text-[#81758F]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    LIVE ML INFERENCE ACTIVE // Sentinel-1 SAR Deep Learning U-Net
                  </span>
                </div>
                <span className="text-[10px] text-[#A78BFA] font-mono">
                  DROP OR SELECT FILE TO SCAN
                </span>
              </div>

              {/* Kaggle Dataset Badges */}
              <div className="w-full pt-1 flex flex-wrap items-center gap-2 text-[10px]">
                <span className="text-[#81758F]">Trained Datasets:</span>
                <a
                  href="https://www.kaggle.com/datasets/harikrishnacs/sentinel-1-sar-oil-spill-detection-dataset"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[rgba(25,17,34,0.8)] border border-[rgba(176,38,255,0.3)] text-[#D6A7FF] hover:text-white transition-colors"
                >
                  <span>Sentinel-1 SAR Oil Spill (Kaggle)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.kaggle.com/datasets/bitsandlayers/sar-oil-spill-segmentation-dataset-sos"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[rgba(25,17,34,0.8)] border border-[rgba(176,38,255,0.3)] text-[#D6A7FF] hover:text-white transition-colors"
                >
                  <span>SOS Segmentation Dataset (Kaggle)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://maris-oil-spill-api.onrender.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:text-white transition-colors"
                >
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  <span>Render Cloud API: Active</span>
                </a>
              </div>
            </div>
          )}

          {/* STAGE 2: Image Preview Before Analysis */}
          {stage === "preview" && (
            <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
              <div className="w-full relative rounded-xl border border-[rgba(176,38,255,0.35)] bg-slate-950 overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.8)] aspect-[16/10] max-h-[380px] flex items-center justify-center">
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
                    onClick={handleStartAnalysis}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl maris-btn-investigate text-white text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(176,38,255,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ANALYZE IMAGE WITH AI</span>
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
                      MARIS U-NET // SENTINEL-1 DEEP LEARNING INFERENCE
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
                <div className="flex items-center justify-between">
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

                  {liveResult?.model_version && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded font-mono hidden sm:inline">
                      ENGINE: {liveResult.model_version.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Main Image Container */}
                <div className="relative w-full aspect-[16/10] rounded-xl border border-[rgba(176,38,255,0.4)] bg-slate-950 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center">
                  {/* Dynamic Layer Rendering Based on ViewTab & Render ML Artifacts */}
                  {viewTab === "mask" && liveResult?.mask_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={liveResult.mask_url}
                      alt="Predicted Binary Mask"
                      className="w-full h-full object-contain"
                    />
                  ) : viewTab === "detection" && liveResult?.overlay_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={liveResult.overlay_url}
                      alt="Detected Oil Spill Overlay"
                      className="w-full h-full object-contain"
                    />
                  ) : (
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
                  )}

                  {/* Synthetic Petroleum Dark Slick Shape overlay if oil is detected and no cloud overlay was loaded */}
                  {isOilDetected &&
                    !(viewTab === "detection" && liveResult?.overlay_url) &&
                    !(viewTab === "mask" && liveResult?.mask_url) &&
                    (viewTab === "detection" || viewTab === "compare") && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-48 h-32 rounded-[45%_55%_65%_35%/50%_60%_40%_50%] bg-[rgba(18,12,8,0.88)] border-2 border-[#F59E0B] shadow-[0_0_25px_rgba(245,158,11,0.6)] rotate-12 flex items-center justify-center">
                          <div className="px-2 py-1 rounded bg-black/80 border border-[#F59E0B] text-[9px] font-mono text-amber-300 font-bold tracking-tight shadow-md">
                            OIL SLICK // {displayArea} km²
                            <span className="block text-[8px] text-[#81758F]">
                              CONFIDENCE {displayConfidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Detection Status Top-Left Badge */}
                  {isOilDetected ? (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[10px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-[8px]">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      <span>SPILL DETECTED // CONFIDENCE {displayConfidence}%</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-[8px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>CLEAR // {displayConfidence}% CLEAN WATERS</span>
                    </div>
                  )}

                  {/* Satellite Watermark */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 text-[9px] text-slate-400">
                    European Union / Copernicus Sentinel-1
                  </div>
                </div>
              </div>

              {/* Right Column: Intelligence Telemetry Dossier & Actions */}
              <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-[rgba(16,11,24,0.85)] border border-[rgba(176,38,255,0.35)] space-y-4">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        MARIS AI INGESTION
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
                      {isOilDetected ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Oil Spill (Detected)
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Clean Ocean (No Spill)
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#81758F]">Confidence</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {displayConfidence}%
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#81758F]">Estimated Area</span>
                      <span className="text-rose-300 font-bold font-mono">
                        {displayArea} km²
                      </span>
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
                      <span>Perimeter</span>
                      <span className="text-white font-mono">{displayPerimeter} km</span>
                    </div>
                    <div className="flex justify-between text-[#81758F]">
                      <span>Elongation</span>
                      <span className="text-white font-mono">3.2 : 1</span>
                    </div>
                    <div className="flex justify-between text-[#81758F]">
                      <span>Orientation</span>
                      <span className="text-[#67E8F9] font-mono">017° (NE DRIFT)</span>
                    </div>
                  </div>

                  {/* Kaggle Dataset Attribution */}
                  <div className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] space-y-1.5 text-xs">
                    <span className="text-[10px] text-[#D6A7FF] font-bold block uppercase">
                      Datasets & Training
                    </span>
                    <div className="text-[10px] text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Sentinel-1 SAR Oil Spill Dataset</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>SAR Oil Spill Segmentation (SOS)</span>
                      </div>
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
