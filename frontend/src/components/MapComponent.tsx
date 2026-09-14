"use client";

import React, { useEffect, useRef, useState } from "react";
import { Incident, OriginEstimate, VesselTrajectory, CandidateVessel } from "@/lib/api";
import { Layers, Eye, EyeOff, Navigation, AlertCircle, Compass } from "lucide-react";

interface MapComponentProps {
  incident: Incident | null;
  origin: OriginEstimate | null;
  trajectories: VesselTrajectory[];
  candidates: CandidateVessel[];
  selectedMmsi: number | null;
  onSelectVessel: (mmsi: number) => void;
  currentTime?: string | null;
}

const VESSEL_COLORS: { [mmsi: number]: string } = {
  419005678: "#f43f5e", // Pacific Chemist - High Suspect (Rose / Red)
  419009999: "#06b6d4", // Ever Apex - Container Ship (Cyan)
  419007777: "#10b981", // Maratha Pride - Bulk Carrier (Emerald)
  419008888: "#a855f7", // Sagar Kanya - Supply Vessel (Purple)
};

const DEFAULT_COLORS = ["#3b82f6", "#eab308", "#ec4899", "#14b8a6", "#f97316"];

export const MapComponent: React.FC<MapComponentProps> = ({
  incident,
  origin,
  trajectories,
  candidates,
  selectedMmsi,
  onSelectVessel,
  currentTime,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});

  const [layersVisible, setLayersVisible] = useState({
    spill: true,
    origin: true,
    tracks: true,
    blackouts: true,
  });

  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Leaflet map on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Clean up existing map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default center around Mumbai High offshore region
      const centerLat = origin?.probable_origin_lat || 19.32;
      const centerLon = origin?.probable_origin_lon || 71.38;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLon],
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Dark theme maritime basemap (CartoDB Dark Matter)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Add scale control
      L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map features when data or layer visibility changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || typeof window === "undefined") return;

    const L = (window as any).L || require("leaflet");
    const map = mapInstanceRef.current;

    // Clear previous dynamic layers
    Object.values(layersRef.current).forEach((layer: any) => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    layersRef.current = {};

    const bounds = L.latLngBounds([]);

    // 1. Render Spill Polygon
    if (layersVisible.spill && incident?.spills?.[0]) {
      const spill = incident.spills[0];
      const geojson = spill.polygon_geojson;

      if (geojson && geojson.coordinates) {
        const coords = geojson.coordinates[0].map(([lon, lat]: [number, number]) => [lat, lon]);
        const polygon = L.polygon(coords, {
          color: "#f43f5e",
          weight: 2,
          fillColor: "#e11d48",
          fillOpacity: 0.35,
          dashArray: "4, 4",
        }).addTo(map);

        polygon.bindPopup(`
          <div style="font-family: monospace; color: #0f172a; padding: 4px;">
            <strong style="color: #be123c; font-size: 13px;">SAR OIL SPILL DETECTION</strong><br/>
            <strong>Area:</strong> ${spill.area_km2.toFixed(2)} km²<br/>
            <strong>Perimeter:</strong> ${spill.perimeter_km.toFixed(1)} km<br/>
            <strong>Centroid:</strong> ${spill.centroid_lat.toFixed(4)}°N, ${spill.centroid_lon.toFixed(4)}°E<br/>
            <strong>Confidence:</strong> ${(spill.confidence * 100).toFixed(0)}%
          </div>
        `);

        coords.forEach((coord: any) => bounds.extend(coord));
        layersRef.current.spill = polygon;
      }
    }

    // 2. Render Probable Origin & Uncertainty Zone
    if (layersVisible.origin && origin) {
      const originGroup = L.layerGroup();
      const originLat = origin.probable_origin_lat;
      const originLon = origin.probable_origin_lon;
      const radiusMeters = (origin.uncertainty_radius_km || 4.8) * 1000;

      // Uncertainty buffer circle
      const circle = L.circle([originLat, originLon], {
        radius: radiusMeters,
        color: "#fbbf24",
        weight: 1.5,
        dashArray: "6, 6",
        fillColor: "#d97706",
        fillOpacity: 0.15,
      }).addTo(originGroup);

      // Centroid marker with pulsing icon
      const originIcon = L.divIcon({
        className: "origin-marker",
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(245, 158, 11, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; inset: 4px; border-radius: 50%; background: #f59e0b; border: 2px solid #ffffff; box-shadow: 0 0 10px #f59e0b;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([originLat, originLon], { icon: originIcon }).addTo(originGroup);
      marker.bindPopup(`
        <div style="font-family: monospace; color: #0f172a; padding: 4px;">
          <strong style="color: #b45309; font-size: 13px;">ESTIMATED RELEASE ORIGIN</strong><br/>
          <strong>Centroid:</strong> ${originLat.toFixed(4)}°N, ${originLon.toFixed(4)}°E<br/>
          <strong>Uncertainty Radius:</strong> ±${origin.uncertainty_radius_km.toFixed(1)} km<br/>
          <strong>Confidence:</strong> ${(origin.confidence * 100).toFixed(0)}%<br/>
          <strong>Est. Release Window:</strong><br/>
          ${new Date(origin.time_window_start).toLocaleTimeString()} - ${new Date(origin.time_window_end).toLocaleTimeString()} UTC
        </div>
      `);

      originGroup.addTo(map);
      layersRef.current.origin = originGroup;

      bounds.extend([originLat, originLon]);
      bounds.extend(circle.getBounds());
    }

    // 3. Render Reconstructed AIS Trajectories & Blackout Gaps
    if (layersVisible.tracks && trajectories.length > 0) {
      const tracksGroup = L.layerGroup();

      trajectories.forEach((traj, idx) => {
        const mmsi = traj.mmsi;
        const color = VESSEL_COLORS[mmsi] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
        const isSelected = selectedMmsi === mmsi;

        if (traj.points && traj.points.length > 0) {
          const latLngs = traj.points.map((p) => [p.latitude, p.longitude]);

          // Draw polyline
          const polyline = L.polyline(latLngs, {
            color: color,
            weight: isSelected ? 4 : 2.5,
            opacity: isSelected ? 1.0 : 0.75,
            dashArray: isSelected ? undefined : "2, 1",
          }).addTo(tracksGroup);

          polyline.on("click", () => {
            onSelectVessel(mmsi);
          });

          // Draw start and latest positions
          const latestPoint = traj.points[traj.points.length - 1];
          const candidate = candidates.find((c) => c.mmsi === mmsi);
          const scoreText = candidate ? `${candidate.final_score.toFixed(1)}%` : "N/A";

          const vesselIcon = L.divIcon({
            className: "vessel-marker",
            html: `
              <div style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; font-family: monospace; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 2px 5px rgba(0,0,0,0.6); white-space: nowrap;">
                <span>${traj.vessel_name}</span>
                <span style="background: rgba(0,0,0,0.3); padding: 0 3px; border-radius: 2px;">${scoreText}</span>
              </div>
            `,
            iconSize: [120, 24],
            iconAnchor: [60, 12],
          });

          const vesselMarker = L.marker([latestPoint.latitude, latestPoint.longitude], {
            icon: vesselIcon,
          }).addTo(tracksGroup);

          vesselMarker.on("click", () => {
            onSelectVessel(mmsi);
          });

          latLngs.forEach((coord: any) => bounds.extend(coord));
        }

        // Render Blackout Gaps if toggled
        if (layersVisible.blackouts && traj.gaps && traj.gaps.length > 0) {
          traj.gaps.forEach((gap: any) => {
            if (gap.is_suspected_blackout || gap.duration_minutes >= 30) {
              const gapLine = L.polyline(
                [
                  [gap.start_lat, gap.start_lon],
                  [gap.end_lat, gap.end_lon],
                ],
                {
                  color: "#ef4444",
                  weight: 3.5,
                  dashArray: "8, 6",
                  opacity: 0.95,
                }
              ).addTo(tracksGroup);

              const blackoutMarker = L.circleMarker([gap.start_lat, gap.start_lon], {
                radius: 6,
                color: "#ef4444",
                fillColor: "#7f1d1d",
                fillOpacity: 0.9,
                weight: 2,
              }).addTo(tracksGroup);

              blackoutMarker.bindPopup(`
                <div style="font-family: monospace; color: #0f172a; padding: 4px;">
                  <strong style="color: #b91c1c; font-size: 13px;">⚠️ AIS TRANSPONDER BLACKOUT</strong><br/>
                  <strong>Vessel:</strong> ${traj.vessel_name} (${mmsi})<br/>
                  <strong>Duration:</strong> ${gap.duration_minutes.toFixed(0)} minutes<br/>
                  <strong>Signal Lost:</strong> ${new Date(gap.start_time).toLocaleTimeString()} UTC<br/>
                  <strong>Signal Resumed:</strong> ${new Date(gap.end_time).toLocaleTimeString()} UTC<br/>
                  <span style="color: #b91c1c; font-weight: bold;">Suspected Intentional Switch-Off</span>
                </div>
              `);
            }
          });
        }
      });

      tracksGroup.addTo(map);
      layersRef.current.tracks = tracksGroup;
    }

    // Fit map view if bounds are valid
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [mapLoaded, incident, origin, trajectories, candidates, selectedMmsi, layersVisible]);

  return (
    <div className="relative w-full h-full min-h-[480px] bg-[#050507] overflow-hidden select-none font-mono">
      {/* Reticle Brackets */}
      <div className="corner-reticle-tl" />
      <div className="corner-reticle-tr" />
      <div className="corner-reticle-bl" />
      <div className="corner-reticle-br" />

      {/* Map DOM target */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Coordinate HUD readout */}
      <div className="absolute top-4 left-4 z-20 bg-[rgba(12,9,18,0.85)] backdrop-blur-[16px] border border-[rgba(176,38,255,0.35)] rounded-xl px-3 py-1.5 shadow-xl text-[10px] text-[#D9B8FF] flex items-center gap-2 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
        <span>19.350°N, 71.450°E // ARABIAN SEA SECTOR 4</span>
      </div>

      {/* Floating HUD Layer Control */}
      <div className="absolute top-4 right-4 z-20 bg-[rgba(12,9,18,0.92)] backdrop-blur-[20px] border border-[rgba(176,38,255,0.35)] rounded-2xl p-3.5 shadow-2xl text-xs flex flex-col gap-2.5 max-w-[230px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(255,255,255,0.06)] text-[#F2EDF7] font-bold uppercase tracking-wider text-[10px]">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#B026FF]" />
            Tactical Map Layers
          </span>
        </div>

        <label className="flex items-center justify-between cursor-pointer text-[#B9ADBF] hover:text-white transition py-0.5">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B026FF] shadow-[0_0_6px_#b026ff] inline-block" />
            SAR Spill Polygon
          </span>
          <input
            type="checkbox"
            checked={layersVisible.spill}
            onChange={(e) => setLayersVisible({ ...layersVisible, spill: e.target.checked })}
            className="rounded border-[rgba(255,255,255,0.2)] text-[#B026FF] focus:ring-0 bg-[rgba(25,17,34,0.8)]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer text-[#B9ADBF] hover:text-white transition py-0.5">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full border border-amber-400 bg-amber-500/40 inline-block" />
            Origin Uncertainty Cone
          </span>
          <input
            type="checkbox"
            checked={layersVisible.origin}
            onChange={(e) => setLayersVisible({ ...layersVisible, origin: e.target.checked })}
            className="rounded border-[rgba(255,255,255,0.2)] text-[#F59E0B] focus:ring-0 bg-[rgba(25,17,34,0.8)]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer text-[#B9ADBF] hover:text-white transition py-0.5">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Navigation className="w-3 h-3 text-[#67E8F9]" />
            AIS Reconstructed Tracks
          </span>
          <input
            type="checkbox"
            checked={layersVisible.tracks}
            onChange={(e) => setLayersVisible({ ...layersVisible, tracks: e.target.checked })}
            className="rounded border-[rgba(255,255,255,0.2)] text-[#06B6D4] focus:ring-0 bg-[rgba(25,17,34,0.8)]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer text-[#B9ADBF] hover:text-white transition py-0.5">
          <span className="flex items-center gap-1.5 text-[11px]">
            <AlertCircle className="w-3 h-3 text-[#FF858D]" />
            Blackout Gap Zones
          </span>
          <input
            type="checkbox"
            checked={layersVisible.blackouts}
            onChange={(e) => setLayersVisible({ ...layersVisible, blackouts: e.target.checked })}
            className="rounded border-[rgba(255,255,255,0.2)] text-rose-500 focus:ring-0 bg-[rgba(25,17,34,0.8)]"
          />
        </label>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-[rgba(12,9,18,0.92)] backdrop-blur-[20px] border border-[rgba(176,38,255,0.3)] rounded-xl p-3 text-[10px] text-[#81758F] flex flex-col gap-1.5 shadow-xl pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 rounded bg-[#FF858D] shadow-[0_0_6px_#ff858d] inline-block" />
          <span className="text-white font-bold">Top Suspect: Pacific Chemist (89.4%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-[#FF858D] inline-block" />
          <span className="text-[#D6A7FF]">Intentional AIS Transponder Blackout</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 rounded bg-[#67E8F9] inline-block" />
          <span className="text-[#B9ADBF]">Commercial Shipping SLOC Corridors</span>
        </div>
      </div>
    </div>
  );
};
