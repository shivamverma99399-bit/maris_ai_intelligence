"use client";
import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Monitor,
  Database,
  RotateCcw,
  Save,
  CheckCircle2,
  Sliders,
  Globe,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsPageProps {
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onShowToast }) => {
  const defaultSettings: AppSettings = {
    general: {
      refreshRate: '5s',
      mapProjection: '3D Globe',
      defaultRegion: 'Indian Ocean',
    },
    notifications: {
      criticalIncidents: true,
      oilSpillAlerts: true,
      vesselAnomalies: true,
      satelliteUpdates: true,
    },
    display: {
      darkMode: true,
      glassEffects: true,
      purpleGlow: true,
      animations: true,
    },
    data: {
      dataSource: 'DEMO / SIMULATED',
      aisSync: 'SIMULATED',
      satelliteSync: 'SIMULATED',
    },
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('maris_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const handleSave = () => {
    localStorage.setItem('maris_settings', JSON.stringify(settings));
    setIsSavedRecently(true);
    if (onShowToast) onShowToast('System settings saved and applied to MARIS terminal', 'success');
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('maris_settings');
    if (onShowToast) onShowToast('Settings reset to default operational profile', 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 sm:p-5 max-w-[1400px] w-full mx-auto animate-fade-in font-mono">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(157,0,255,0.14)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#F2EDF7]">
              System Settings & Operational Profile
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(176,38,255,0.2)] border border-[rgba(176,38,255,0.45)] text-[#E9D5FF] tracking-wider">
              OPERATOR CONFIGURATION
            </span>
          </div>
          <p className="text-xs text-[#81758F] mt-0.5">
            Manage satellite telemetry refresh cadence, alerts sensitivity, UI visual render engine & simulation parameters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-xs text-[#B9ADBF] hover:text-[#F2EDF7] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET SETTINGS</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg maris-btn-investigate text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(157,0,255,0.45)]"
          >
            {isSavedRecently ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSavedRecently ? 'SAVED' : 'SAVE SETTINGS'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Setting Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-6">
        {/* SECTION 1: GENERAL */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <Sliders className="w-4 h-4 text-[#B026FF]" />
            <h2 className="text-xs font-bold text-[#F2EDF7] uppercase tracking-wider">
              GENERAL
            </h2>
          </div>

          {/* Dashboard refresh rate */}
          <div className="space-y-2">
            <label className="text-xs text-[#B9ADBF] block font-semibold">
              Dashboard refresh rate
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['5s', '10s', '30s', '1m'] as const).map((rate) => {
                const labelMap = { '5s': '5 seconds', '10s': '10 seconds', '30s': '30 seconds', '1m': '1 minute' };
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, refreshRate: rate },
                      }))
                    }
                    className={`py-2 px-2.5 rounded-lg text-xs transition-all cursor-pointer text-center ${
                      settings.general.refreshRate === rate
                        ? 'bg-[rgba(157,0,255,0.35)] border border-[#C14CFF] text-white shadow-[0_0_10px_rgba(157,0,255,0.3)] font-bold'
                        : 'bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] text-[#81758F] hover:text-[#D9B8FF]'
                    }`}
                  >
                    {labelMap[rate]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map projection */}
          <div className="space-y-2">
            <label className="text-xs text-[#B9ADBF] block font-semibold">
              Map projection
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['3D Globe', '2D Mercator'] as const).map((proj) => (
                <button
                  key={proj}
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      general: { ...prev.general, mapProjection: proj },
                    }))
                  }
                  className={`py-2 px-3 rounded-lg text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                    settings.general.mapProjection === proj
                      ? 'bg-[rgba(157,0,255,0.35)] border border-[#C14CFF] text-white shadow-[0_0_10px_rgba(157,0,255,0.3)] font-bold'
                      : 'bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] text-[#81758F] hover:text-[#D9B8FF]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{proj}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Default region */}
          <div className="space-y-2">
            <label className="text-xs text-[#B9ADBF] block font-semibold">
              Default region
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Indian Ocean', 'Arabian Sea', 'Bay of Bengal'] as const).map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      general: { ...prev.general, defaultRegion: reg },
                    }))
                  }
                  className={`py-2 px-2 rounded-lg text-[11px] transition-all cursor-pointer text-center ${
                    settings.general.defaultRegion === reg
                      ? 'bg-[rgba(157,0,255,0.35)] border border-[#C14CFF] text-white shadow-[0_0_10px_rgba(157,0,255,0.3)] font-bold'
                      : 'bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.06)] text-[#81758F] hover:text-[#D9B8FF]'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: NOTIFICATIONS */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <Bell className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-xs font-bold text-[#F2EDF7] uppercase tracking-wider">
              NOTIFICATIONS
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { key: 'criticalIncidents' as const, label: 'Critical incidents', desc: 'Emergency tier-1 maritime oil plume alerts' },
              { key: 'oilSpillAlerts' as const, label: 'Oil spill alerts', desc: 'Satellite automated synthetic aperture radar detections' },
              { key: 'vesselAnomalies' as const, label: 'Vessel anomalies', desc: 'Ballast discharge, dark ship transponder deactivation' },
              { key: 'satelliteUpdates' as const, label: 'Satellite updates', desc: 'Constellation telemetry & orbital pass synchronizations' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.05)]"
              >
                <div>
                  <div className="text-xs font-semibold text-[#F2EDF7]">{item.label}</div>
                  <div className="text-[10px] text-[#81758F]">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        [item.key]: !prev.notifications[item.key],
                      },
                    }))
                  }
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    settings.notifications[item.key]
                      ? 'bg-[rgba(16,185,129,0.2)] text-[#34D399] border border-[rgba(16,185,129,0.4)]'
                      : 'bg-[rgba(255,255,255,0.05)] text-[#81758F] border border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  {settings.notifications[item.key] ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: DISPLAY */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <Sparkles className="w-4 h-4 text-[#D9B8FF]" />
            <h2 className="text-xs font-bold text-[#F2EDF7] uppercase tracking-wider">
              DISPLAY
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { key: 'darkMode' as const, label: 'Dark mode', desc: 'Tactical command room ultra-low eye strain dark palette' },
              { key: 'glassEffects' as const, label: 'Glass effects', desc: 'Multi-layer glassmorphic acrylic blurs (18px-24px)' },
              { key: 'purpleGlow' as const, label: 'Purple glow', desc: 'Electric purple ambient field lighting & node haloes' },
              { key: 'animations' as const, label: 'Animations', desc: 'Smooth 150-250ms tactical state & pulse transitions' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.05)]"
              >
                <div>
                  <div className="text-xs font-semibold text-[#F2EDF7]">{item.label}</div>
                  <div className="text-[10px] text-[#81758F]">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      display: {
                        ...prev.display,
                        [item.key]: !prev.display[item.key],
                      },
                    }))
                  }
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    settings.display[item.key]
                      ? 'bg-[rgba(157,0,255,0.3)] text-[#D6A7FF] border border-[#B026FF]'
                      : 'bg-[rgba(255,255,255,0.05)] text-[#81758F] border border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  {settings.display[item.key] ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: DATA */}
        <div className="maris-glass-primary rounded-xl border border-[rgba(157,0,255,0.22)] p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <Database className="w-4 h-4 text-[#FDE047]" />
            <h2 className="text-xs font-bold text-[#F2EDF7] uppercase tracking-wider">
              DATA
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.05)]">
              <div>
                <div className="text-xs font-semibold text-[#F2EDF7]">Data source</div>
                <div className="text-[10px] text-[#81758F]">Operational ingestion stream</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[rgba(176,38,255,0.2)] text-[#E9D5FF] border border-[rgba(176,38,255,0.45)] text-xs font-bold">
                DEMO / SIMULATED
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.05)]">
              <div>
                <div className="text-xs font-semibold text-[#F2EDF7]">AIS synchronization</div>
                <div className="text-[10px] text-[#81758F]">Coastal AIS transponder data stream</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[rgba(6,182,212,0.15)] text-[#67E8F9] border border-[rgba(6,182,212,0.3)] text-xs font-bold">
                SIMULATED
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[rgba(18,13,24,0.6)] border border-[rgba(255,255,255,0.05)]">
              <div>
                <div className="text-xs font-semibold text-[#F2EDF7]">Satellite synchronization</div>
                <div className="text-[10px] text-[#81758F]">SAR & multi-spectral radar downlinks</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[rgba(245,158,11,0.15)] text-[#FDE047] border border-[rgba(245,158,11,0.3)] text-xs font-bold">
                SIMULATED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
