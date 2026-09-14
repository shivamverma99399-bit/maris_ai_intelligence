"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ActiveIncidentsPanel } from '@/components/ActiveIncidentsPanel';
import { RightIntelligencePanel } from '@/components/RightIntelligencePanel';
import { TimelinePanel } from '@/components/TimelinePanel';
import { InvestigationModal } from '@/components/InvestigationModal';
import { HomeKpiRibbon } from '@/components/HomeKpiRibbon';
import { SignOutModal } from '@/components/SignOutModal';
import { LoginScreen } from '@/components/LoginScreen';
import { SatelliteImageAnalysisModal } from '@/components/SatelliteImageAnalysisModal';
import { FleetPage } from '@/views/FleetPage';
import { RoutesPage } from '@/views/RoutesPage';
import { OperationsPage } from '@/views/OperationsPage';
import { SettingsPage } from '@/views/SettingsPage';
import { HelpPage } from '@/views/HelpPage';
import { SurveillancePage } from '@/views/SurveillancePage';
import { mockIncidents, mockNotifications } from '@/mockData';
import { INDIAN_VESSELS } from '@/data/indianVessels';
import { Incident, NavItem, AppNotification, Vessel, MaritimeRoute } from '@/types';
import { CheckCircle2, Info, Waves, BarChart3, X, Eye } from 'lucide-react';
import { useInvestigationSimulation } from '@/hooks/useInvestigationSimulation';

// Dynamically load Three.js 3D Globe with SSR disabled
const CenterVisualization = dynamic(
  () => import('@/components/CenterVisualization').then((mod) => mod.CenterVisualization),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#050508] text-slate-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#B026FF] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(176,38,255,0.5)]" />
          <span className="text-[#D6A7FF] tracking-wider uppercase text-[11px]">
            RENDERING 3D TACTICAL SATELLITE GLOBE...
          </span>
        </div>
      </div>
    ),
  }
);

const GlobeControlToolbar = dynamic(
  () => import('@/components/GlobeControlToolbar').then((mod) => mod.GlobeControlToolbar),
  { ssr: false }
);

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isSatelliteModalOpen, setIsSatelliteModalOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<NavItem>('home');
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [selectedIncident, setSelectedIncident] = useState<Incident>(mockIncidents[0]);
  const [investigatingIncident, setInvestigatingIncident] = useState<Incident | null>(null);

  // Indian Vessels AIS fleet telemetry state
  const [vessels, setVessels] = useState<Vessel[]>(INDIAN_VESSELS);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [targetRegion, setTargetRegion] = useState<'india' | 'atlantic' | null>('india');

  // Full-page globe overlay controls: whether dashboard panels are shown or minimized
  const [isPanelsVisible, setIsPanelsVisible] = useState(true);
  const [activeLayer, setActiveLayer] = useState<'all' | 'spills' | 'routes' | 'vessels'>('all');
  const [isRotating, setIsRotating] = useState<boolean>(false);

  // Mobile collapsible drawers state
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  // Interactive notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);

  // Interactive timeline state (0 to 100)
  const [timelineSlider, setTimelineSlider] = useState<number>(34); // ~08:14 UTC

  // MARIS Deterministic 8-Stage Investigation Simulation Engine
  const simulation = useInvestigationSimulation();

  // Sync timeline progress smoothly when simulation is active
  useEffect(() => {
    if (simulation.state.stage > 0) {
      setTimelineSlider(simulation.state.timelineProgress);
    }
  }, [simulation.state.timelineProgress, simulation.state.stage]);

  const handleTimelineChange = (pos: number) => {
    setTimelineSlider(pos);
    if (simulation.state.stage > 0) {
      simulation.seekTimeline(pos);
    }
  };

  // Sleek HUD Toast system for operations feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3800);
  };

  // Derive scrubbed time (00:00 to 23:59 UTC)
  const { scrubbedTime, timelineHour, activityLabel } = useMemo(() => {
    const totalMinutes = Math.round((timelineSlider / 100) * (23 * 60 + 59));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const timeFormatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} UTC`;

    // Dynamic operational activity indicator based on scrub time
    let activity = 'GLOBAL MARITIME PATROL STABLE // ORBITAL SAR ONLINE';
    if (h >= 7 && h <= 10) {
      activity = 'SPILL-042 PEAK PLUME DISPERSION (NORTH SEA)';
    } else if (h >= 13 && h <= 16) {
      activity = 'SPILL-041 HIGH TRAFFIC ANOMALY (MEDITERRANEAN)';
    } else if (h >= 17 && h <= 20) {
      activity = 'ATLANTIC SHIPPING CORRIDOR CONGESTION 86%';
    } else if (h >= 21 || h <= 3) {
      activity = 'SPILL-031 SANTOS BASIN NIGHT RADAR ACTIVE';
    }

    return {
      scrubbedTime: timeFormatted,
      timelineHour: h,
      activityLabel: activity,
    };
  }, [timelineSlider]);

  // Handle selecting an incident
  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setSelectedVessel(null);
    setIsLeftDrawerOpen(false);
  };

  // Handle selecting an Indian vessel
  const handleSelectVessel = (vessel: Vessel) => {
    setSelectedVessel(vessel);
    setTargetRegion('india');
    showToast(`Tracking Indian Vessel: ${vessel.name} [${vessel.type}]`, 'info');
    setIsLeftDrawerOpen(false);
  };

  // Select incident from notification click
  const handleSelectIncidentById = (incidentId: string) => {
    const found = incidents.find((inc) => inc.id === incidentId);
    if (found) {
      setSelectedIncident(found);
      setSelectedVessel(null);
      showToast(`Targeted ${found.id} // ${found.location}`, 'info');
      setActiveNav('home');
    }
  };

  // Mark notification read
  const handleMarkNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, unread: false } : n))
    );
  };

  // Mark all notifications read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All maritime alerts marked as read', 'info');
  };

  // Open and start 8-stage interactive simulation investigation
  const handleInitiateInvestigation = (incident: Incident) => {
    setSelectedIncident(incident);
    setActiveNav('home');
    simulation.start();
    showToast(`MARIS Simulation Workflow Initiated: ${incident.id} (Bay of Bengal)`, 'info');
  };

  // Successfully started an investigation
  const handleInvestigationSuccess = (incident: Incident) => {
    showToast('Investigation initiated successfully', 'success');

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `Investigation initiated: ${incident.id}`,
      description: `Dispatched MARIS Autonomous Tier 1 rapid response units to ${incident.location}.`,
      timeAgo: 'Just now',
      incidentId: incident.id,
      unread: true,
      severity: 'warning',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Handle focusing route on 3D globe from Routes page
  const handleFocusRouteOnGlobe = (route: MaritimeRoute) => {
    setTargetRegion('india');
    setActiveNav('home');
    showToast(`Centered on corridor: ${route.name}`, 'info');
  };

  // Handle focusing vessel on 3D globe from Fleet page
  const handleFocusVesselOnGlobe = (vessel: Vessel) => {
    setSelectedVessel(vessel);
    setTargetRegion('india');
    setActiveNav('home');
    showToast(`Centered on vessel: ${vessel.name}`, 'info');
  };

  // If user signed out, show professional Login Screen
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onSignIn={() => {
          setIsLoggedIn(true);
          setActiveNav('home');
          showToast('Welcome back, Commander. MARIS command terminal authorized.', 'success');
        }}
        onDemoAccess={() => {
          setIsLoggedIn(true);
          setActiveNav('home');
          showToast('Demo access granted. Indian Ocean surveillance active.', 'success');
        }}
      />
    );
  }

  return (
    <div
      id="maris-app-root"
      className="flex flex-col h-screen w-screen bg-[#050507] text-[#F2EDF7] overflow-hidden select-none font-sans relative"
    >
      {/* Top Header */}
      <div className="shrink-0 z-40">
        <Header
          notifications={notifications}
          onSelectIncidentId={handleSelectIncidentById}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onOpenHelp={() => setActiveNav('help')}
          onOpenSatelliteAnalysis={() => setIsSatelliteModalOpen(true)}
          onOpenSignOut={() => setIsLogoutModalOpen(true)}
        />
      </div>

      {/* Main Content Row: Sidebar on Left + Active Page View on Right */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
        {/* Left Vertical Navigation Rail (Persistent desktop sidebar) */}
        <div className="hidden md:flex h-full shrink-0 z-40">
          <Sidebar
            activeNav={activeNav}
            setActiveNav={(nav) => {
              if (nav === 'logout') {
                setIsLogoutModalOpen(true);
              } else {
                setActiveNav(nav);
              }
            }}
            onShowToast={(msg) => showToast(msg, 'info')}
            onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
          />
        </div>

        {/* Dynamic Page Router based on activeNav */}
        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden relative">
          {/* TAB 1: HOME / DASHBOARD */}
          {(activeNav === 'home' || activeNav === 'incidents') && (
            <div className="flex-1 flex flex-col min-h-0 w-full h-full relative overflow-hidden">
              {/* Full-Page 3D Globe Visualization Background */}
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                <CenterVisualization
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleSelectIncident}
                  onInitiateInvestigation={handleInitiateInvestigation}
                  timelineHour={timelineHour}
                  isPanelsVisible={isPanelsVisible}
                  onTogglePanels={() => setIsPanelsVisible((prev) => !prev)}
                  vessels={vessels}
                  selectedVessel={selectedVessel}
                  onSelectVessel={handleSelectVessel}
                  targetRegion={targetRegion}
                  onSetTargetRegion={setTargetRegion}
                  activeLayer={activeLayer}
                  isRotating={isRotating}
                  simulationState={simulation.state}
                  hindcastProgress={simulation.hindcastProgress}
                  forecastProgress={simulation.forecastProgress}
                  scanAngle={simulation.scanAngle}
                  onStartSimulation={() => simulation.start()}
                  onPlayPauseSimulation={() => simulation.togglePlayPause()}
                  onSkipSimulationStage={() => simulation.skipStage()}
                  onResetSimulation={() => simulation.reset()}
                  onSelectSimulationStage={(stg) => simulation.goToStage(stg)}
                />
              </div>

              {/* Dashboard Floating Panels Overlay */}
              <div className="relative z-10 flex flex-col h-full w-full pointer-events-none overflow-hidden justify-between p-2 sm:p-3 lg:p-4 gap-2.5">
                {/* Top KPI Ribbon (5 Primary Telemetry Cards) */}
                <div className="shrink-0 w-full">
                  <HomeKpiRibbon
                    onCardClick={(metric) => {
                      if (metric === 'vessels-tracked' || metric === 'alert-zones') {
                        setActiveNav('fleet');
                      } else if (metric === 'traffic-index') {
                        setActiveNav('routes');
                      } else if (metric === 'oil-spills') {
                        setActiveLayer('spills');
                        showToast('Filtered layer: Active Oil Spill Plumes', 'info');
                      } else if (metric === 'active-incidents') {
                        setActiveLayer('all');
                        showToast('Filtered layer: Composite Incidents', 'info');
                      }
                    }}
                  />
                </div>

                {/* Mobile Drawer Trigger Buttons (Visible only on screens below lg) */}
                <div className="flex lg:hidden items-center justify-between px-3 py-2 bg-[rgba(12,9,18,0.85)] border border-[rgba(255,255,255,0.06)] rounded-xl backdrop-blur-[18px] z-30 font-mono text-xs pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLeftDrawerOpen(true);
                      setIsRightDrawerOpen(false);
                    }}
                    aria-expanded={isLeftDrawerOpen}
                    aria-label="Open Active Incidents Drawer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg maris-btn-glass text-[#D6A7FF] hover:text-white transition-all cursor-pointer"
                  >
                    <Waves className="w-3.5 h-3.5 text-[#B026FF]" />
                    <span>Incidents ({incidents.length})</span>
                  </button>

                  <span className="text-[10px] text-[#81758F] font-mono uppercase tracking-wider">
                    {selectedIncident.id}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRightDrawerOpen(true);
                      setIsLeftDrawerOpen(false);
                    }}
                    aria-expanded={isRightDrawerOpen}
                    aria-label="Open Intelligence Telemetry Drawer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg maris-btn-glass text-[#D6A7FF] hover:text-white transition-all cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#B026FF]" />
                    <span>Intelligence</span>
                  </button>
                </div>

                {/* Middle Row: Left Incidents Panel + Transparent Globe Canvas + Right Intelligence Panel */}
                <div className="flex-1 flex items-stretch justify-between min-h-0 gap-3 pointer-events-none">
                  {/* Left Column: Active Incidents */}
                  <div
                    className={`transition-all duration-300 pointer-events-auto flex items-stretch gap-3 h-full shrink-0 ${
                      isPanelsVisible
                        ? 'translate-x-0 opacity-100'
                        : '-translate-x-full opacity-0 pointer-events-none w-0 overflow-hidden'
                    }`}
                  >
                    <div className="hidden lg:flex h-full">
                      <ActiveIncidentsPanel
                        incidents={incidents}
                        selectedIncident={selectedIncident}
                        onSelectIncident={handleSelectIncident}
                        onInitiateInvestigation={handleInitiateInvestigation}
                        vessels={vessels}
                        selectedVessel={selectedVessel}
                        onSelectVessel={handleSelectVessel}
                      />
                    </div>
                  </div>

                  {/* Center Area: Transparent for direct 3D globe interaction + Floating Globe Toolbar */}
                  <div className="flex-1 pointer-events-none flex flex-col items-center justify-between min-w-0 h-full">
                    {/* Globe Layer & Navigation Toolbar */}
                    <div className="pointer-events-auto pt-0.5 z-30">
                      <GlobeControlToolbar
                        activeLayer={activeLayer}
                        onChangeLayer={(layer) => {
                          setActiveLayer(layer);
                          showToast(`Layer mode: ${layer.toUpperCase()}`, 'info');
                        }}
                        onFocusRegion={(region) => {
                          setTargetRegion(region);
                          showToast(
                            `Camera focused on ${
                              region === 'india'
                                ? 'Indian Subcontinent & Arabian Sea'
                                : 'Atlantic Ocean'
                            }`,
                            'info'
                          );
                        }}
                        isRotating={isRotating}
                        onToggleRotate={() => {
                          setIsRotating((prev) => !prev);
                          showToast(!isRotating ? 'Planetary spin enabled' : 'Planetary spin paused', 'info');
                        }}
                        isPanelsVisible={isPanelsVisible}
                        onTogglePanels={() => {
                          setIsPanelsVisible((prev) => !prev);
                          showToast(!isPanelsVisible ? 'Dashboard panels restored' : 'Full globe focus mode', 'info');
                        }}
                      />
                    </div>

                    {/* Center space remains transparent for direct 3D globe drag & zoom */}
                    <div className="flex-1 w-full pointer-events-none" />
                  </div>

                  {/* Right Column: Incident Intelligence Panel */}
                  <div
                    className={`transition-all duration-300 pointer-events-auto flex items-stretch h-full shrink-0 ${
                      isPanelsVisible
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0 pointer-events-none w-0 overflow-hidden'
                    }`}
                  >
                    <div className="hidden lg:flex h-full">
                      <RightIntelligencePanel
                        incident={selectedIncident}
                        onInitiateInvestigation={handleInitiateInvestigation}
                        timelineHour={timelineHour}
                        selectedVessel={selectedVessel}
                        onClearVessel={() => setSelectedVessel(null)}
                        onFocusVessel={(v) => {
                          setTargetRegion('india');
                          showToast(`Centered on ${v.name} in Arabian Sea`, 'info');
                        }}
                        simulationState={simulation.state}
                        onRestartSimulation={() => simulation.start()}
                        onSelectStage={(stg) => simulation.goToStage(stg)}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Interactive Timeline Panel */}
                <div
                  className={`transition-all duration-300 pointer-events-auto shrink-0 w-full ${
                    isPanelsVisible
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-full opacity-0 pointer-events-none h-0 overflow-hidden'
                  }`}
                >
                  <TimelinePanel
                    sliderPosition={timelineSlider}
                    onSliderChange={handleTimelineChange}
                    scrubbedTime={scrubbedTime}
                    activityLabel={activityLabel}
                    simulationState={simulation.state}
                    onStartSimulation={() => simulation.start()}
                    onPlayPauseSimulation={() => simulation.togglePlayPause()}
                    onSkipSimulationStage={() => simulation.skipStage()}
                    onResetSimulation={() => simulation.reset()}
                    onReplaySimulation={() => simulation.start()}
                    onSelectSimulationStage={(stg) => simulation.goToStage(stg)}
                  />
                </div>

                {/* Floating Pill when panels are minimized */}
                {!isPanelsVisible && (
                  <div className="pointer-events-auto fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
                    <button
                      onClick={() => setIsPanelsVisible(true)}
                      className="px-4 py-2 rounded-full maris-glass-floating border border-[rgba(176,38,255,0.4)] text-[#E9D5FF] text-xs font-mono font-bold flex items-center gap-2 hover:border-[#B026FF] shadow-[0_8px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(157,0,255,0.3)] transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#B026FF]" />
                      <span>RESTORE DASHBOARD PANELS</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MARITIME SURVEILLANCE */}
          {activeNav === 'surveillance' && (
            <SurveillancePage
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={handleSelectIncident}
              onInitiateInvestigation={handleInitiateInvestigation}
              vessels={vessels}
              selectedVessel={selectedVessel}
              onSelectVessel={handleSelectVessel}
            />
          )}

          {/* TAB 3: FLEET / VESSELS */}
          {activeNav === 'fleet' && (
            <FleetPage
              onSelectVesselOnGlobe={handleFocusVesselOnGlobe}
              onNavigateToSurveillance={(vessel) => {
                setSelectedVessel(vessel);
                setTargetRegion('india');
                setActiveNav('surveillance');
              }}
            />
          )}

          {/* TAB 4: MARITIME ROUTES */}
          {activeNav === 'routes' && (
            <RoutesPage
              onFocusRouteOnGlobe={handleFocusRouteOnGlobe}
            />
          )}

          {/* TAB 5: TIMELINE / OPERATIONS */}
          {activeNav === 'operations' && (
            <OperationsPage />
          )}

          {/* TAB 6: SETTINGS */}
          {activeNav === 'settings' && (
            <SettingsPage
              onShowToast={(msg, type) => showToast(msg, type || 'info')}
            />
          )}

          {/* TAB 7: HELP */}
          {activeNav === 'help' && (
            <HelpPage />
          )}
        </div>
      </div>

      {/* MOBILE COLLAPSIBLE DRAWER: Left Active Incidents */}
      {isLeftDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in pointer-events-auto"
          onClick={() => setIsLeftDrawerOpen(false)}
        >
          <div
            className="w-[85vw] max-w-sm h-full bg-[rgba(12,9,18,0.95)] border-r border-[rgba(255,255,255,0.08)] backdrop-blur-[24px] p-2 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-2 mb-1 border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-xs font-mono font-bold text-[#D6A7FF]">ACTIVE INCIDENTS DIRECTORY</span>
              <button
                type="button"
                onClick={() => setIsLeftDrawerOpen(false)}
                className="p-1 rounded-lg text-[#81758F] hover:text-white"
                aria-label="Close Incidents Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ActiveIncidentsPanel
                incidents={incidents}
                selectedIncident={selectedIncident}
                onSelectIncident={handleSelectIncident}
                onInitiateInvestigation={(inc) => {
                  setIsLeftDrawerOpen(false);
                  handleInitiateInvestigation(inc);
                }}
                vessels={vessels}
                selectedVessel={selectedVessel}
                onSelectVessel={(v) => {
                  handleSelectVessel(v);
                  setIsLeftDrawerOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MOBILE COLLAPSIBLE DRAWER: Right Incident Intelligence */}
      {isRightDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in pointer-events-auto"
          onClick={() => setIsRightDrawerOpen(false)}
        >
          <div
            className="w-[85vw] max-w-sm h-full bg-[rgba(12,9,18,0.95)] border-l border-[rgba(255,255,255,0.08)] backdrop-blur-[24px] p-2 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-2 mb-1 border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-xs font-mono font-bold text-[#D6A7FF]">TELEMETRY & INTELLIGENCE</span>
              <button
                type="button"
                onClick={() => setIsRightDrawerOpen(false)}
                className="p-1 rounded-lg text-[#81758F] hover:text-white"
                aria-label="Close Intelligence Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <RightIntelligencePanel
                incident={selectedIncident}
                onInitiateInvestigation={(inc) => {
                  setIsRightDrawerOpen(false);
                  handleInitiateInvestigation(inc);
                }}
                timelineHour={timelineHour}
                selectedVessel={selectedVessel}
                onClearVessel={() => setSelectedVessel(null)}
                onFocusVessel={(v) => {
                  setTargetRegion('india');
                  setIsRightDrawerOpen(false);
                  showToast(`Centered on ${v.name} in Arabian Sea`, 'info');
                }}
                simulationState={simulation.state}
                onRestartSimulation={() => simulation.start()}
                onSelectStage={(stg) => simulation.goToStage(stg)}
              />
            </div>
          </div>
        </div>
      )}

      {/* SATELLITE IMAGE ANALYSIS MODAL (Featured prominently in Video) */}
      <SatelliteImageAnalysisModal
        isOpen={isSatelliteModalOpen}
        onClose={() => setIsSatelliteModalOpen(false)}
        onContinueInvestigation={() => {
          setIsSatelliteModalOpen(false);
          handleInitiateInvestigation(mockIncidents[0]);
        }}
      />

      {/* Tactical Investigation Mission Briefing Modal */}
      <InvestigationModal
        incident={investigatingIncident}
        onClose={() => setInvestigatingIncident(null)}
        onSuccess={handleInvestigationSuccess}
      />

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmSignOut={() => {
          setIsLogoutModalOpen(false);
          setIsLoggedIn(false);
          showToast('Session terminated. Signed out of MARIS terminal.', 'info');
        }}
      />

      {/* Sleek Floating Tactical HUD Toast */}
      {toastMessage && (
        <div
          id="maris-hud-toast"
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border maris-glass-floating font-mono text-xs transition-all duration-300 animate-fade-in pointer-events-auto ${
            toastMessage.type === 'success'
              ? 'border-[rgba(176,38,255,0.60)] text-[#F2EDF7] shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_24px_rgba(176,38,255,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'text-[#D6A7FF]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#D6A7FF] shrink-0 animate-pulse" />
          ) : (
            <Info className="w-4 h-4 text-[#B026FF] shrink-0" />
          )}
          <span className="tracking-wide font-medium">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
