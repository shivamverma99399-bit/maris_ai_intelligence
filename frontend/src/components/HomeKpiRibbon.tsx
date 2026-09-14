"use client";

import React from 'react';
import { AlertOctagon, Ship, Waves, AlertTriangle, Activity } from 'lucide-react';

interface HomeKpiRibbonProps {
  activeIncidentsCount?: number;
  vesselsTrackedCount?: number;
  spillAreaKm2?: number;
  alertZonesCount?: number;
  trafficIndex?: string;
  onCardClick?: (metric: string) => void;
}

export const HomeKpiRibbon: React.FC<HomeKpiRibbonProps> = ({
  activeIncidentsCount = 1,
  vesselsTrackedCount = 4,
  spillAreaKm2 = 18.45,
  alertZonesCount = 1,
  trafficIndex = "94.2%",
  onCardClick,
}) => {
  const kpis = [
    {
      id: 'active-incidents',
      label: 'ACTIVE INCIDENTS',
      value: `${activeIncidentsCount}`,
      subtext: 'High & Critical severity',
      icon: AlertOctagon,
      color: 'text-[#FF858D]',
      borderColor: 'border-[rgba(239,68,68,0.35)]',
      bgGlow: 'bg-[rgba(239,68,68,0.06)]',
    },
    {
      id: 'vessels-tracked',
      label: 'SECTOR VESSELS',
      value: `${vesselsTrackedCount}`,
      subtext: 'AIS transponders analyzed',
      icon: Ship,
      color: 'text-[#67E8F9]',
      borderColor: 'border-[rgba(6,182,212,0.35)]',
      bgGlow: 'bg-[rgba(6,182,212,0.06)]',
    },
    {
      id: 'oil-spills',
      label: 'DETECTED SLICK',
      value: `${spillAreaKm2.toFixed(1)} km²`,
      subtext: 'Verified Sentinel-1 SAR',
      icon: Waves,
      color: 'text-[#D6A7FF]',
      borderColor: 'border-[rgba(157,0,255,0.35)]',
      bgGlow: 'bg-[rgba(157,0,255,0.06)]',
    },
    {
      id: 'alert-zones',
      label: 'ORIGIN OVERLAP',
      value: `${alertZonesCount}`,
      subtext: 'Vessel in transponder gap',
      icon: AlertTriangle,
      color: 'text-[#FDE047]',
      borderColor: 'border-[rgba(245,158,11,0.35)]',
      bgGlow: 'bg-[rgba(245,158,11,0.06)]',
    },
    {
      id: 'traffic-index',
      label: 'TRAFFIC DENSITY',
      value: trafficIndex,
      subtext: 'Indian EEZ SLOC corridor',
      icon: Activity,
      color: 'text-[#34D399]',
      borderColor: 'border-[rgba(16,185,129,0.35)]',
      bgGlow: 'bg-[rgba(16,185,129,0.06)]',
    },
  ];

  return (
    <div
      id="home-top-kpi-ribbon"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 w-full pointer-events-auto select-none font-mono"
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            onClick={() => onCardClick?.(kpi.id)}
            className={`p-2.5 sm:p-3 rounded-xl maris-glass-primary border ${kpi.borderColor} ${kpi.bgGlow} shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden`}
          >
            {/* Top reticle */}
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[rgba(255,255,255,0.2)]" />

            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-[#81758F] group-hover:text-[#D9B8FF] transition-colors truncate">
                {kpi.label}
              </span>
              <Icon className={`w-3.5 h-3.5 ${kpi.color} opacity-80`} />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className={`text-lg sm:text-xl font-extrabold tracking-tight ${kpi.color}`}>
                {kpi.value}
              </span>
            </div>
            <span className="text-[9px] text-[#81758F] mt-0.5 truncate block">
              {kpi.subtext}
            </span>
          </div>
        );
      })}
    </div>
  );
};
