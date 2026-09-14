"use client";

import React from 'react';
import { RotateCw, Eye, EyeOff, Layers, Globe } from 'lucide-react';

export interface GlobeControlToolbarProps {
  activeLayer: 'all' | 'spills' | 'routes' | 'vessels';
  onChangeLayer: (layer: 'all' | 'spills' | 'routes' | 'vessels') => void;
  onFocusRegion: (region: 'india' | 'atlantic') => void;
  isRotating: boolean;
  onToggleRotate: () => void;
  isPanelsVisible?: boolean;
  onTogglePanels?: () => void;
  className?: string;
}

export const GlobeControlToolbar: React.FC<GlobeControlToolbarProps> = ({
  activeLayer,
  onChangeLayer,
  onFocusRegion,
  isRotating,
  onToggleRotate,
  isPanelsVisible = true,
  onTogglePanels,
  className = '',
}) => {
  return (
    <div
      id="maris-globe-control-toolbar"
      className={`flex items-center gap-1 p-1 rounded-xl maris-glass-floating border border-[rgba(176,38,255,0.3)] text-[11px] font-mono shadow-[0_8px_30px_rgba(0,0,0,0.7),0_0_15px_rgba(157,0,255,0.15)] pointer-events-auto max-w-[95vw] overflow-x-auto ${className}`}
    >
      {/* Layer Selectors */}
      <button
        type="button"
        onClick={() => onChangeLayer('all')}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
          activeLayer === 'all'
            ? 'maris-nav-active shadow-[0_0_10px_rgba(176,38,255,0.4)]'
            : 'text-[#81758F] hover:text-[#D6A7FF]'
        }`}
      >
        Composite
      </button>

      <button
        type="button"
        onClick={() => onChangeLayer('spills')}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
          activeLayer === 'spills'
            ? 'bg-[rgba(239,68,68,0.25)] text-[#FFA2A8] border border-[rgba(239,68,68,0.5)] shadow-[0_0_10px_rgba(239,68,68,0.3)]'
            : 'text-[#81758F] hover:text-[#FFA2A8]'
        }`}
      >
        Oil Spills
      </button>

      <button
        type="button"
        onClick={() => onChangeLayer('routes')}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
          activeLayer === 'routes'
            ? 'bg-[rgba(168,85,247,0.25)] text-[#D8B4FE] border border-[rgba(168,85,247,0.5)] shadow-[0_0_10px_rgba(168,85,247,0.3)]'
            : 'text-[#81758F] hover:text-[#D8B4FE]'
        }`}
      >
        AIS Routes
      </button>

      <button
        type="button"
        onClick={() => {
          onChangeLayer('vessels');
          onFocusRegion('india');
        }}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
          activeLayer === 'vessels'
            ? 'bg-[rgba(6,182,212,0.25)] text-[#67E8F9] border border-[rgba(6,182,212,0.5)] shadow-[0_0_10px_rgba(6,182,212,0.3)]'
            : 'text-[#81758F] hover:text-[#67E8F9]'
        }`}
      >
        <span>🇮🇳 Indian Fleet</span>
      </button>

      <div className="w-px h-3.5 bg-[rgba(255,255,255,0.15)] mx-0.5" />

      {/* Region Fast Teleports */}
      <button
        type="button"
        onClick={() => onFocusRegion('india')}
        title="Teleport camera to Indian Subcontinent, Arabian Sea & Bay of Bengal"
        className="px-2 py-1 rounded-lg text-[10.5px] text-[#81758F] hover:text-[#FDE047] hover:bg-[rgba(253,224,71,0.1)] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
      >
        <span>🇮🇳</span>
        <span>India</span>
      </button>

      <button
        type="button"
        onClick={() => onFocusRegion('atlantic')}
        title="Teleport camera to Atlantic Ocean & Europe"
        className="px-2 py-1 rounded-lg text-[10.5px] text-[#81758F] hover:text-[#D6A7FF] hover:bg-[rgba(157,0,255,0.1)] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
      >
        <Globe className="w-3 h-3 text-[#B026FF]" />
        <span>Atlantic</span>
      </button>

      <div className="w-px h-3.5 bg-[rgba(255,255,255,0.15)] mx-0.5" />

      {/* Spin Toggle */}
      <button
        type="button"
        onClick={onToggleRotate}
        title={isRotating ? 'Pause Planetary Spin' : 'Enable Planetary Spin'}
        className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
          isRotating
            ? 'text-[#D6A7FF] bg-[rgba(157,0,255,0.22)] border border-[rgba(176,38,255,0.40)] shadow-[0_0_8px_rgba(157,0,255,0.3)]'
            : 'text-[#81758F] hover:text-[#F2EDF7]'
        }`}
      >
        <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin text-[#B026FF]' : ''}`} />
        <span className="text-[10px] uppercase font-mono hidden sm:inline">
          {isRotating ? 'Spinning' : 'Spin'}
        </span>
      </button>

      {/* Panels Toggle */}
      {onTogglePanels && (
        <>
          <div className="w-px h-3.5 bg-[rgba(255,255,255,0.15)] mx-0.5" />
          <button
            type="button"
            onClick={onTogglePanels}
            title={isPanelsVisible ? 'Hide Panels (Full Globe Focus)' : 'Show Dashboard Panels'}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              !isPanelsVisible
                ? 'text-[#6EE7B7] bg-[rgba(52,211,153,0.18)] border border-[rgba(52,211,153,0.4)] shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : 'text-[#81758F] hover:text-[#D6A7FF]'
            }`}
          >
            {isPanelsVisible ? (
              <Eye className="w-3 h-3 text-[#B026FF]" />
            ) : (
              <EyeOff className="w-3 h-3 text-[#6EE7B7]" />
            )}
            <span className="text-[10px] uppercase font-mono font-semibold hidden md:inline">
              {isPanelsVisible ? 'Panels: On' : 'Panels: Off'}
            </span>
          </button>
        </>
      )}
    </div>
  );
};
