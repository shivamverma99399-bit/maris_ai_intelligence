"use client";

import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Ship,
  Navigation,
  Clock,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { NavItem } from '../types';

interface SidebarProps {
  activeNav: NavItem;
  setActiveNav: (nav: NavItem) => void;
  onShowToast?: (message: string) => void;
  onOpenLogoutModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  setActiveNav,
  onShowToast,
  onOpenLogoutModal,
}) => {
  const mainNavItems = [
    { id: 'home' as NavItem, icon: LayoutDashboard, label: 'Dashboard / Home' },
    { id: 'surveillance' as NavItem, icon: Compass, label: 'Maritime Surveillance' },
    { id: 'fleet' as NavItem, icon: Ship, label: 'Fleet / Vessels' },
    { id: 'routes' as NavItem, icon: Navigation, label: 'Maritime Routes' },
    { id: 'operations' as NavItem, icon: Clock, label: 'Timeline / Operations' },
    { id: 'settings' as NavItem, icon: Settings, label: 'Settings' },
  ];

  const handleNavClick = (id: NavItem, label: string) => {
    setActiveNav(id);
  };

  return (
    <aside
      id="maris-sidebar"
      aria-label="Sidebar navigation"
      className="w-16 shrink-0 bg-[rgba(6,5,9,0.85)] backdrop-blur-[20px] border-r border-[rgba(157,0,255,0.18)] flex flex-col items-center py-4 justify-between z-40 select-none shadow-[0_0_25px_rgba(0,0,0,0.7)]"
    >
      {/* Top Brand Marker in Sidebar */}
      <div className="flex flex-col items-center space-y-2.5 w-full">
        <div
          onClick={() => setActiveNav('home')}
          title="MARIS Operations Command"
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8A00E8] to-[#B026FF] flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(157,0,255,0.55)] group transition-transform hover:scale-105"
        >
          <div className="flex flex-col items-center space-y-1">
            <div className="w-4 h-0.5 bg-white group-hover:bg-[#E9D5FF] transition-colors rounded-full"></div>
            <div className="w-4 h-0.5 bg-white group-hover:bg-[#E9D5FF] transition-colors rounded-full"></div>
            <div className="w-4 h-0.5 bg-white group-hover:bg-[#E9D5FF] transition-colors rounded-full"></div>
          </div>
        </div>
        <div className="text-[10px] text-[#D9B8FF] font-bold tracking-widest font-mono">
          MARIS
        </div>
      </div>

      {/* Navigation Icons Vertically */}
      <nav className="flex-1 flex flex-col items-center space-y-3.5 mt-5 w-full px-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id || (item.id === 'home' && activeNav === 'incidents');

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => handleNavClick(item.id, item.label)}
              title={item.label}
              className={`relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'maris-nav-active text-white'
                  : 'text-[#81758F] hover:text-[#E9D5FF] hover:bg-[rgba(157,0,255,0.12)]'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2]" />

              {/* Tooltip on hover */}
              <span className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg bg-[rgba(12,10,18,0.95)] border border-[rgba(157,0,255,0.35)] text-xs font-mono font-bold text-[#F2EDF7] tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions: Help and Logout */}
      <div className="flex flex-col items-center space-y-3 mb-1 w-full pt-3.5 border-t border-[rgba(157,0,255,0.16)] px-2">
        {/* Help */}
        <button
          id="sidebar-bottom-help-btn"
          onClick={() => setActiveNav('help')}
          aria-label="Help Documentation"
          title="Help & Documentation"
          className={`relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
            activeNav === 'help'
              ? 'maris-nav-active text-white'
              : 'text-[#81758F] hover:text-[#E9D5FF] hover:bg-[rgba(157,0,255,0.12)]'
          }`}
        >
          <HelpCircle className="w-5 h-5 stroke-[2]" />
          <span className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg bg-[rgba(12,10,18,0.95)] border border-[rgba(157,0,255,0.35)] text-xs font-mono font-bold text-[#F2EDF7] tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Help & Documentation
          </span>
        </button>

        {/* Logout */}
        <button
          id="sidebar-bottom-logout-btn"
          onClick={() => {
            if (onOpenLogoutModal) {
              onOpenLogoutModal();
            } else {
              setActiveNav('logout');
            }
          }}
          aria-label="Logout"
          title="Sign Out"
          className="relative p-2.5 rounded-xl text-[#81758F] hover:text-[#FF858D] hover:bg-[rgba(239,68,68,0.15)] transition-colors cursor-pointer group"
        >
          <LogOut className="w-5 h-5 stroke-[2]" />
          <span className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg bg-[rgba(12,10,18,0.95)] border border-[rgba(239,68,68,0.4)] text-xs font-mono font-bold text-[#FF858D] tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
};
