"use client";

import React, { useEffect, useState } from "react";
import { Shield, Radio, Activity, RefreshCw, Anchor, Database } from "lucide-react";

interface NavbarProps {
  incidentId: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ incidentId, onRefresh, isLoading }) => {
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full bg-[#0b132b]/90 border-b border-slate-800/80 px-6 py-3 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
      {/* Brand & Organization */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-lg text-white font-mono">MARIS</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded uppercase tracking-wider">
                v0.1.0 AI
              </span>
            </div>
            <p className="text-xs text-slate-400">Maritime AI Intelligence System</p>
          </div>
        </div>

        <div className="hidden lg:block h-6 w-px bg-slate-800" />

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-0.5 bg-slate-800/70 border border-slate-700/50 rounded text-slate-300 font-medium">
            NTRO • PS-26143
          </span>
          <span className="text-slate-500">•</span>
          <span>Smart India Hackathon 2026</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-mono">Team: RecursiveSquad</span>
        </div>
      </div>

      {/* Live Metrics & Actions */}
      <div className="flex items-center gap-4">
        {/* System telemetry status */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 radar-live inline-block" />
            <span className="font-medium">Backend Live</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-400">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>PostGIS</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="font-mono text-slate-300">{utcTime || "UTC Loading..."}</span>
        </div>

        {/* Current Incident ID Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-xs font-mono text-cyan-300">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{incidentId}</span>
        </div>

        {/* Reload / Recompute */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5 text-xs"
          title="Reload & sync telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          <span className="hidden md:inline">Sync Data</span>
        </button>
      </div>
    </header>
  );
};
