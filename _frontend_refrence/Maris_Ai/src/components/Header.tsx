import React, { useState, useRef, useEffect } from 'react';
import { Menu, HelpCircle, Bell, Check, ExternalLink, ShieldAlert, AlertTriangle, Info, X } from 'lucide-react';
import { AppNotification } from '../types';

interface HeaderProps {
  notifications: AppNotification[];
  onSelectIncidentId?: (id: string) => void;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onOpenHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  onSelectIncidentId,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenHelp,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close dropdown on click outside
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

  return (
    <header
      id="maris-top-header"
      className="h-14 px-4 sm:px-6 flex items-center justify-between bg-[rgba(5,5,8,0.72)] backdrop-blur-[18px] border-b border-[rgba(157,0,255,0.14)] shrink-0 select-none z-30 relative"
    >
      {/* Left: Hamburger + MARIS Brand */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          id="header-hamburger-btn"
          onClick={onOpenHelp}
          aria-label="Toggle Navigation Rail"
          title="Toggle Navigation"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#81758F] hover:text-[#F2EDF7] hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-bold tracking-widest text-[#F2EDF7]">MARIS</span>
          <span className="text-[10px] text-[#D9B8FF] uppercase tracking-widest opacity-80 hidden xs:inline font-mono">
            Maritime AI Intelligence
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
      <div className="flex items-center space-x-4 sm:space-x-6 relative">
        {/* Help Icon */}
        <button
          id="header-help-btn"
          onClick={onOpenHelp}
          aria-label="Terminal Help"
          title="Terminal Help & Guides"
          className="p-1.5 text-[#81758F] hover:text-[#D6A7FF] hover:bg-[rgba(255,255,255,0.04)] rounded-lg transition-colors cursor-pointer"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.8]" />
        </button>

        {/* Notification Bell with Badge & Interactive Dropdown */}
        <div className="relative">
          <button
            ref={bellButtonRef}
            id="header-notification-btn"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            aria-label="System Notifications"
            title={`${unreadCount} Unread Notifications`}
            className={`relative cursor-pointer p-1.5 rounded-lg transition-colors ${
              isNotificationsOpen
                ? 'text-[#F2EDF7] bg-[rgba(25,17,34,0.8)] ring-1 ring-[rgba(176,38,255,0.50)]'
                : 'text-[#81758F] hover:text-[#D6A7FF] hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            <Bell className="w-5 h-5 stroke-[1.8]" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-[#B026FF] rounded-full border-2 border-[#0A0910] shadow-[0_0_8px_rgba(176,38,255,0.8)]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Window */}
          {isNotificationsOpen && (
            <div
              ref={dropdownRef}
              id="notifications-dropdown-menu"
              className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 bg-[rgba(25,17,34,0.88)] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.7)] backdrop-blur-[22px] z-50 overflow-hidden font-mono animate-fade-in"
            >
              {/* Dropdown Header */}
              <div className="p-3.5 bg-[rgba(18,13,24,0.85)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
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
                {unreadCount > 0 && onMarkAllNotificationsRead && (
                  <button
                    onClick={onMarkAllNotificationsRead}
                    className="text-[10px] text-[#D6A7FF] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
                {notifications.map((notif) => {
                  const Icon =
                    notif.severity === 'critical'
                      ? ShieldAlert
                      : notif.severity === 'warning'
                      ? AlertTriangle
                      : Info;

                  const iconColor =
                    notif.severity === 'critical'
                      ? 'text-[#FF858D] bg-[rgba(130,20,30,0.30)] border-[rgba(255,70,80,0.55)]'
                      : notif.severity === 'warning'
                      ? 'text-[#FBBF24] bg-[rgba(70,40,15,0.4)] border-[rgba(245,158,11,0.4)]'
                      : 'text-[#D9B8FF] bg-[rgba(18,13,24,0.7)] border-[rgba(255,255,255,0.08)]';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (onMarkNotificationRead) onMarkNotificationRead(notif.id);
                        if (notif.incidentId && onSelectIncidentId) {
                          onSelectIncidentId(notif.incidentId);
                          setIsNotificationsOpen(false);
                        }
                      }}
                      className={`p-3 transition-colors cursor-pointer flex items-start gap-3 hover:bg-[rgba(255,255,255,0.04)] ${
                        notif.unread ? 'bg-[rgba(20,12,30,0.45)]' : 'opacity-70'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${iconColor}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-[#F2EDF7] truncate">
                            {notif.title}
                          </p>
                          <span className="text-[9px] text-[#81758F] shrink-0">
                            {notif.timeAgo}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#B9ADBF] line-clamp-2 mt-0.5 leading-snug">
                          {notif.description}
                        </p>
                        {notif.incidentId && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#D6A7FF] font-bold">
                            <span>Focus {notif.incidentId}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      {notif.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF] shrink-0 mt-1 shadow-[0_0_6px_#b026ff]" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dropdown Footer */}
              <div className="p-2.5 bg-[rgba(10,8,15,0.9)] border-t border-[rgba(255,255,255,0.06)] text-center text-[10px] text-[#81758F]">
                AIS SATELLITE TELEMETRY // REAL-TIME SYNCHRONIZED
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div
          id="header-user-avatar"
          title="Command Officer (M)"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8A00E8] to-[#B026FF] border border-[rgba(217,184,255,0.6)] flex items-center justify-center font-bold text-xs text-white shadow-[0_0_10px_rgba(157,0,255,0.4)] cursor-pointer hover:scale-105 transition-all"
        >
          M
        </div>
      </div>
    </header>
  );
};
