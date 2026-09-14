"use client";

import React from 'react';
import { Incident, Vessel, SimulationState, InvestigationStage } from '../types';
import { Compass, ZoomIn } from 'lucide-react';
import { EarthGlobe3D } from './EarthGlobe3D';
import { INDIAN_VESSELS } from '../data/indianVessels';
import { InvestigationHud } from './InvestigationHud';

interface CenterVisualizationProps {
  incidents: Incident[];
  selectedIncident: Incident;
  onSelectIncident: (incident: Incident) => void;
  onInitiateInvestigation?: (incident: Incident) => void;
  timelineHour?: number;
  isPanelsVisible?: boolean;
  onTogglePanels?: () => void;
  vessels?: Vessel[];
  selectedVessel?: Vessel | null;
  onSelectVessel?: (vessel: Vessel) => void;
  targetRegion?: 'india' | 'atlantic' | null;
  onSetTargetRegion?: (region: 'india' | 'atlantic' | null) => void;
  activeLayer?: 'all' | 'spills' | 'routes' | 'vessels';
  isRotating?: boolean;
  simulationState?: SimulationState;
  hindcastProgress?: number;
  forecastProgress?: number;
  scanAngle?: number;
  onStartSimulation?: () => void;
  onPlayPauseSimulation?: () => void;
  onSkipSimulationStage?: () => void;
  onResetSimulation?: () => void;
  onSelectSimulationStage?: (stage: InvestigationStage) => void;
}

export const CenterVisualization: React.FC<CenterVisualizationProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  isPanelsVisible = true,
  onTogglePanels,
  vessels = INDIAN_VESSELS,
  selectedVessel,
  onSelectVessel,
  targetRegion = null,
  onSetTargetRegion,
  activeLayer = 'all',
  isRotating = false,
  simulationState,
  hindcastProgress = 0,
  forecastProgress = 0,
  scanAngle = 0,
  onStartSimulation,
  onPlayPauseSimulation,
  onSkipSimulationStage,
  onResetSimulation,
  onSelectSimulationStage,
}) => {
  return (
    <main
      id="center-globe-container"
      aria-label="Interactive 3D Earth Maritime Command Intelligence"
      className="w-full h-full relative overflow-hidden select-none bg-[#050508] flex items-center justify-center"
    >
      {/* Deep Space Background Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(12,8,22,0.6) 0%, #050508 75%)',
        }}
      />

      {/* Subtle Purple Optical Corona behind the Earth */}
      <div className="absolute w-[680px] h-[680px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(157,0,255,0.12)_0%,rgba(157,0,255,0.04)_40%,transparent_70%)]" />

      {/* Primary 3D Earth Globe */}
      <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
        <EarthGlobe3D
          incidents={incidents}
          selectedIncident={selectedIncident}
          onSelectIncident={onSelectIncident}
          vessels={vessels}
          selectedVessel={selectedVessel}
          onSelectVessel={onSelectVessel}
          activeLayer={activeLayer}
          isRotating={isRotating}
          targetRegion={targetRegion}
          onRegionFocused={() => {
            if (onSetTargetRegion) onSetTargetRegion(null);
          }}
          simulationState={simulationState}
          hindcastProgress={hindcastProgress}
          forecastProgress={forecastProgress}
          scanAngle={scanAngle}
        />

        {/* Floating Investigation HUD Bar */}
        {simulationState && onStartSimulation && (
          <InvestigationHud
            simulationState={simulationState}
            onPlayPause={onPlayPauseSimulation || (() => {})}
            onSkipStage={onSkipSimulationStage || (() => {})}
            onReset={onResetSimulation || (() => {})}
            onStart={onStartSimulation}
            onSelectStage={onSelectSimulationStage || (() => {})}
          />
        )}

        {/* Interactive Helper Hint */}
        <div className="absolute bottom-24 right-6 pointer-events-none z-20 hidden lg:flex items-center gap-2.5 text-[10px] font-mono text-[#81758F] maris-glass-floating px-3 py-1.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#B026FF]" /> Drag to rotate
          </span>
          <span className="text-[rgba(255,255,255,0.15)]">•</span>
          <span className="flex items-center gap-1">
            <ZoomIn className="w-3 h-3 text-[#B026FF]" /> Scroll to zoom
          </span>
        </div>
      </div>
    </main>
  );
};
