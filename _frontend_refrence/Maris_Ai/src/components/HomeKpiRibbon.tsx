import React from 'react';
import { AlertOctagon, Ship, Waves, AlertTriangle, Activity } from 'lucide-react';

interface HomeKpiRibbonProps {
  onCardClick?: (metric: string) => void;
}

export const HomeKpiRibbon: React.FC<HomeKpiRibbonProps> = ({ onCardClick }) => {
  const kpis = [
    {
      id: 'active-incidents',
      label: 'ACTIVE INCIDENTS',
      value: '6',
      subtext: 'High & Critical severity',
      icon: AlertOctagon,
      color: 'text-[#FF858D]',
      borderColor: 'border-[rgba(239,68,68,0.3)]',
      bgGlow: 'bg-[rgba(239,68,68,0.06)]',
    },
    {
      id: 'vessels-tracked',
      label: 'VESSELS TRACKED',
      value: '1,284',
      subtext: 'AIS transponders active',
      icon: Ship,
      color: 'text-[#67E8F9]',
      borderColor: 'border-[rgba(6,182,212,0.3)]',
      bgGlow: 'bg-[rgba(6,182,212,0.06)]',
    },
    {
      id: 'oil-spills',
      label: 'OIL SPILLS',
      value: '12',
      subtext: 'Verified SAR plumes',
      icon: Waves,
      color: 'text-[#D6A7FF]',
      borderColor: 'border-[rgba(157,0,255,0.3)]',
      bgGlow: 'bg-[rgba(157,0,255,0.06)]',
    },
    {
      id: 'alert-zones',
      label: 'VESSELS IN ALERT ZONES',
      value: '27',
      subtext: 'Intersecting 15nm buffer',
      icon: AlertTriangle,
      color: 'text-[#FDE047]',
      borderColor: 'border-[rgba(245,158,11,0.3)]',
      bgGlow: 'bg-[rgba(245,158,11,0.06)]',
    },
    {
      id: 'traffic-index',
      label: 'MARITIME TRAFFIC INDEX',
      value: '94.2%',
      subtext: 'Normal Indian SLOC flow',
      icon: Activity,
      color: 'text-[#34D399]',
      borderColor: 'border-[rgba(16,185,129,0.3)]',
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
            className={`p-2.5 sm:p-3 rounded-xl maris-glass-primary border ${kpi.borderColor} ${kpi.bgGlow} shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-[#81758F] group-hover:text-[#D9B8FF] transition-colors truncate">
                {kpi.label}
              </span>
              <Icon className={`w-3.5 h-3.5 ${kpi.color} opacity-80`} />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${kpi.color}`}>
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
