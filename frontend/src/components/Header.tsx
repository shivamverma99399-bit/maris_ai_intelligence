"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Menu, HelpCircle, Bell, PlusCircle, Check, ShieldAlert, Clock, RefreshCw, Layers, Satellite } from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  incidentId?: string;
  unread: boolean;
  severity: 'critical' | 'warning' | 'info';
}

interface HeaderProps {
  notifications?: AppNotification[];
  onSelectIncidentId?: (id: string) => void;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onOpenNewInvestigation?: () => void;
  onOpenSatelliteAnalysis?: () => void;
  onOpenSignOut?: () => void;
  onRefresh?: () => void;
  onOpenHelp?: () => void;
  sectorName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  notifications = [
    {
      id: 'notif-1',
      title: 'SAR Detection: Mumbai High Sector 4',
      description: 'Sentinel-1 C-Band radar detected 18.45 sq km dark patch anomaly.',
      timeAgo: '12m ago',
      incidentId: 'INC-DEMO-2026',
      unread: true,
      severity: 'critical',
    },
    {
      id: 'notif-2',
      title: 'AIS Blackout Alert: Pacific Chemist',
      description: 'Transponder suppressed for 3.0h within probable release cone.',
      timeAgo: '35m ago',
      incidentId: 'INC-DEMO-2026',
      unread: true,
      severity: 'warning',
    }
  ],
  onSelectIncidentId,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenNewInvestigation,
  onOpenSatelliteAnalysis,
  onOpenSignOut,
  onRefresh,
  onOpenHelp,
  sectorName = "MUMBAI HIGH SECTOR 4",
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [notifs, setNotifs] = useState<AppNotification[]>(notifications);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setNotifs(notifications);
  }, [notifications]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifs.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (onMarkAllNotificationsRead) onMarkAllNotificationsRead();
  };

  return (
    <header
      id="maris-top-header"
      className="h-14 px-4 sm:px-6 flex items-center justify-between bg-[rgba(5,5,8,0.85)] backdrop-blur-[18px] border-b border-[rgba(157,0,255,0.20)] shrink-0 select-none z-30 relative shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
    >
      {/* Left: Brand & Badges */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white via-[#D9B8FF] to-[#B026FF]">
            MARIS
          </span>
          <span className="text-[10px] text-[#D9B8FF] uppercase tracking-widest opacity-80 hidden xs:inline font-mono">
            NTRO // PS-26143
          </span>
        </div>

        {/* Live System Indicator */}
        <div className="hidden md:flex items-center gap-2 ml-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(18,13,24,0.62)] backdrop-blur-[14px] border border-[rgba(176,38,255,0.3)] text-[11px] text-[#D6A7FF] font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF] animate-pulse shadow-[0_0_8px_#b026ff]" />
            <span className="tracking-wider">GLOBAL SATELLITE SURVEILLANCE // OPERATIONAL</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-[rgba(176,38,255,0.18)] border border-[rgba(176,38,255,0.45)] text-[#E9D5FF] hidden lg:inline">
            DEMO / SIMULATED DATA
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 sm:space-x-4 relative">
        {/* SATELLITE IMAGE ANALYSIS BUTTON */}
        <button
          type="button"
          id="btn-header-satellite-analysis"
          onClick={onOpenSatelliteAnalysis || onOpenNewInvestigation}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[rgba(138,0,232,0.25)] to-[rgba(176,38,255,0.25)] hover:from-[rgba(138,0,232,0.45)] hover:to-[rgba(176,38,255,0.45)] border border-[rgba(176,38,255,0.6)] text-[#F2EDF7] font-mono text-xs font-bold tracking-wider cursor-pointer shadow-[0_0_15px_rgba(176,38,255,0.35)] transition-all hover:scale-105 active:scale-95"
        >
          <Satellite className="w-4 h-4 text-[#D9B8FF]" />
          <span className="hidden sm:inline">SATELLITE IMAGE ANALYSIS</span>
        </button>

        {/* Refresh */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh incident telemetry"
            className="p-1.5 text-[#81758F] hover:text-[#D6A7FF] hover:bg-[rgba(255,255,255,0.04)] rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Help */}
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            title="Help documentation"
            className="p-1.5 text-[#81758F] hover:text-[#D6A7FF] hover:bg-[rgba(255,255,255,0.04)] rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            ref={bellButtonRef}
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            aria-label="System Notifications"
            title={`${unreadCount} Unread Notifications`}
            className={`relative cursor-pointer p-1.5 rounded-lg transition-colors ${
              isNotificationsOpen
                ? 'text-[#F2EDF7] bg-[rgba(25,17,34,0.8)] ring-1 ring-[rgba(176,38,255,0.50)]'
                : 'text-[#81758F] hover:text-[#D6A7FF] hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center text-[8px] font-bold text-white bg-[#B026FF] rounded-full shadow-[0_0_8px_rgba(176,38,255,0.8)]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Window */}
          {isNotificationsOpen && (
            <div
              ref={dropdownRef}
              id="notifications-dropdown-menu"
              className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-[rgba(20,14,28,0.95)] border border-[rgba(176,38,255,0.35)] rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.8)] backdrop-blur-[24px] z-50 overflow-hidden font-mono animate-fade-in"
            >
              <div className="p-3 bg-[rgba(14,10,20,0.9)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F2EDF7] tracking-wider uppercase">
                    Maritime Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#B026FF] text-white rounded font-bold">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[10px] text-[#D6A7FF] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.incidentId && onSelectIncidentId) onSelectIncidentId(n.incidentId);
                      if (onMarkNotificationRead) onMarkNotificationRead(n.id);
                      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
                      setIsNotificationsOpen(false);
                    }}
                    className={`p-3 transition-colors cursor-pointer hover:bg-[rgba(157,0,255,0.14)] ${n.unread ? 'bg-[rgba(157,0,255,0.08)]' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#F2EDF7]">{n.title}</span>
                      <span className="text-[9px] text-[#81758F] whitespace-nowrap">{n.timeAgo}</span>
                    </div>
                    <p className="text-[11px] text-[#9A8AA5] mt-1 leading-tight">{n.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div
          id="header-user-avatar"
          onClick={onOpenSignOut}
          title="Command Officer (M) - Click to Sign Out"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8A00E8] to-[#B026FF] border border-[rgba(217,184,255,0.6)] flex items-center justify-center font-bold text-xs text-white shadow-[0_0_10px_rgba(157,0,255,0.4)] cursor-pointer hover:scale-105 transition-all"
        >
          M
        </div>
      </div>
    </header>
  );
};
