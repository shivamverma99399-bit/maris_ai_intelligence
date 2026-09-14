"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Incident, Vessel, SimulationState } from '../types';
import { MARITIME_ROUTES } from '../data/maritimeRoutes';
import { INDIAN_VESSELS } from '../data/indianVessels';
import { AlertOctagon, AlertTriangle, ShieldCheck, Wind, Ship, Navigation } from 'lucide-react';
import { setupSimulation3DLayer } from './simulationGlobeLayer';

export interface EarthGlobe3DProps {
  incidents: Incident[];
  selectedIncident: Incident;
  onSelectIncident: (incident: Incident) => void;
  vessels?: Vessel[];
  selectedVessel?: Vessel | null;
  onSelectVessel?: (vessel: Vessel) => void;
  activeLayer?: 'all' | 'spills' | 'routes' | 'vessels';
  isRotating?: boolean;
  targetRegion?: 'india' | 'atlantic' | null;
  onRegionFocused?: () => void;
  simulationState?: SimulationState;
  hindcastProgress?: number;
  forecastProgress?: number;
  scanAngle?: number;
}

interface ActiveFlight {
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
  startDistance: number;
  targetDistance: number;
  angle: number;
}

export function getIncidentLabelOffset(id: string): { x: number; y: number } {
  if (id.includes('042')) return { x: 32, y: -18 };
  if (id.includes('041')) return { x: 30, y: -12 };
  if (id.includes('031')) return { x: 26, y: -10 };
  return { x: 24, y: -16 };
}

/**
 * Converts Latitude & Longitude to 3D Cartesian coordinates matching Three.js Sphere UV mapping
 * u = (lng + 180) / 360, v = (90 - lat) / 180
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(theta) * Math.sin(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Creates high-detail procedural swirl texture for oil slick surface detection
 */
function createSpillVortexTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Soft multi-spiral radial gradient
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 120);
  grad.addColorStop(0, 'rgba(235, 180, 255, 0.95)');
  grad.addColorStop(0.15, 'rgba(192, 76, 255, 0.85)');
  grad.addColorStop(0.45, 'rgba(157, 0, 255, 0.55)');
  grad.addColorStop(0.75, 'rgba(100, 15, 175, 0.25)');
  grad.addColorStop(1, 'rgba(15, 10, 25, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fill();

  // Draw spiral eddy arms
  ctx.strokeStyle = 'rgba(215, 130, 255, 0.45)';
  ctx.lineWidth = 2.5;
  for (let arm = 0; arm < 3; arm++) {
    ctx.beginPath();
    const baseAngle = (arm * Math.PI * 2) / 3;
    for (let r = 10; r < 110; r += 2) {
      const angle = baseAngle + (r / 25);
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (r === 10) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Earth Vertex Shader: Passes UV, normal, and world position
 */
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

/**
 * Earth Fragment Shader: Realistic satellite daytime oceans and continents,
 * specular ocean sheen, night-side city lights, smooth twilight terminator, and soft atmospheric rim
 */
const earthFragmentShader = `
  uniform sampler2D uDayTexture;
  uniform sampler2D uNightTexture;
  uniform sampler2D uSpecularTexture;
  uniform vec3 uSunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 sunDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Sunlight dot product
    float cosTheta = dot(normal, sunDir);

    // Smooth twilight terminator
    float dayFactor = smoothstep(-0.12, 0.20, cosTheta);

    vec4 dayTex = texture2D(uDayTexture, vUv);
    vec4 nightTex = texture2D(uNightTexture, vUv);
    vec4 specTex = texture2D(uSpecularTexture, vUv);

    // Vibrant deep oceanic satellite blues
    vec3 dayColor = dayTex.rgb;
    if (specTex.r > 0.05) {
      dayColor = mix(dayColor, vec3(0.04, 0.16, 0.38), 0.20);
    }

    // Warm golden city night lights on the dark hemisphere
    vec3 nightColor = nightTex.rgb * vec3(1.6, 1.35, 0.90);

    // Specular sunlight reflection on ocean waters
    vec3 halfDir = normalize(sunDir + viewDir);
    float specAngle = max(dot(normal, halfDir), 0.0);
    float specular = pow(specAngle, 32.0) * specTex.r * 0.55 * dayFactor;

    // Atmospheric limb scattering on day side
    float rim = 1.0 - max(dot(normal, viewDir), 0.0);
    vec3 rimColor = vec3(0.25, 0.55, 1.0) * pow(rim, 3.2) * max(cosTheta + 0.3, 0.0) * 0.70;

    // Composite day and night
    vec3 finalColor = mix(nightColor, dayColor, dayFactor);
    finalColor += vec3(0.8, 0.9, 1.0) * specular;
    finalColor += rimColor;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Atmosphere Outer Rim Halo Shader
 */
const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.70 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
    vec3 atmosColor = mix(vec3(0.15, 0.45, 0.95), vec3(0.65, 0.30, 0.95), intensity);
    gl_FragColor = vec4(atmosColor, 1.0) * intensity * 0.85;
  }
`;

export const EarthGlobe3D: React.FC<EarthGlobe3DProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  vessels,
  selectedVessel,
  onSelectVessel,
  activeLayer = 'all',
  isRotating = false,
  targetRegion = null,
  onRegionFocused,
  simulationState,
  hindcastProgress = 0,
  forecastProgress = 0,
  scanAngle = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const routeMeshesRef = useRef<{ id: string; line: THREE.Line; material: THREE.LineBasicMaterial }[]>([]);
  const selectedIncidentRef = useRef<Incident>(selectedIncident);
  const selectedVesselRef = useRef<Vessel | null>(selectedVessel ?? null);
  const onRegionFocusedRef = useRef(onRegionFocused);

  const simulationStateRef = useRef<SimulationState | undefined>(simulationState);
  const hindcastProgressRef = useRef<number>(hindcastProgress);
  const forecastProgressRef = useRef<number>(forecastProgress);
  const scanAngleRef = useRef<number>(scanAngle);

  const simSpillBadgeRef = useRef<HTMLDivElement>(null);
  const simOriginBadgeRef = useRef<HTMLDivElement>(null);
  const simNordicBadgeRef = useRef<HTMLDivElement>(null);
  const simForecastBadgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    simulationStateRef.current = simulationState;
  }, [simulationState]);
  useEffect(() => {
    hindcastProgressRef.current = hindcastProgress;
  }, [hindcastProgress]);
  useEffect(() => {
    forecastProgressRef.current = forecastProgress;
  }, [forecastProgress]);
  useEffect(() => {
    scanAngleRef.current = scanAngle;
  }, [scanAngle]);

  const activeFlightRef = useRef<ActiveFlight | null>(null);
  const autoRotateSpeedRef = useRef<number>(0);
  const markerElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const vesselElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const [hoveredIncident, setHoveredIncident] = useState<Incident | null>(null);
  const [hoveredVessel, setHoveredVessel] = useState<Vessel | null>(null);

  const activeVesselsList = vessels && vessels.length > 0 ? vessels : INDIAN_VESSELS;

  const startCameraFlight = useCallback((targetVector: THREE.Vector3, customDuration?: number) => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object as THREE.PerspectiveCamera;
    if (!camera) return;

    const startPos = camera.position.clone();
    const startDistance = startPos.length();
    const targetDistance = targetVector.length();

    const v1 = startPos.clone().normalize();
    const v2 = targetVector.clone().normalize();
    const dot = Math.min(Math.max(v1.dot(v2), -1), 1);
    const angle = Math.acos(dot);

    const duration = customDuration ?? Math.max(900, Math.min(1700, angle * 750 + 500));

    activeFlightRef.current = {
      startPos,
      targetPos: targetVector.clone(),
      startTime: performance.now(),
      duration,
      startDistance,
      targetDistance,
      angle,
    };
  }, []);

  useEffect(() => {
    selectedIncidentRef.current = selectedIncident;
    if (selectedIncident) {
      startCameraFlight(latLngToVector3(selectedIncident.lat, selectedIncident.lng, 4.45), 1100);
    }
  }, [selectedIncident, startCameraFlight]);

  useEffect(() => {
    selectedVesselRef.current = selectedVessel ?? null;
    if (selectedVessel) {
      startCameraFlight(latLngToVector3(selectedVessel.lat, selectedVessel.lng, 4.3), 1100);
    }
  }, [selectedVessel, startCameraFlight]);

  useEffect(() => {
    onRegionFocusedRef.current = onRegionFocused;
  }, [onRegionFocused]);

  useEffect(() => {
    if (targetRegion === 'india') {
      startCameraFlight(latLngToVector3(12.5, 76.0, 5.05), 1400);
    } else if (targetRegion === 'atlantic') {
      startCameraFlight(latLngToVector3(15.0, -22.0, 5.15), 1400);
    }
  }, [targetRegion, startCameraFlight]);

  // Cinematic camera fly-overs during MARIS simulation stages
  useEffect(() => {
    if (!simulationState || simulationState.stage === 0) return;
    if (simulationState.stage === 1) {
      // Smooth zoom to Bay of Bengal spill
      startCameraFlight(latLngToVector3(14.85, 88.25, 3.45), 1400);
    } else if (simulationState.stage === 3) {
      // Frame both probable origin and current spill
      startCameraFlight(latLngToVector3(14.50, 87.85, 3.6), 1100);
    } else if (simulationState.stage === 6) {
      // Focus directly on Nordic Star intersection
      startCameraFlight(latLngToVector3(14.22, 87.52, 3.35), 1100);
    } else if (simulationState.stage === 8) {
      // Pull back slightly to view the full northeast forecast corridor
      startCameraFlight(latLngToVector3(15.2, 88.8, 3.85), 1200);
    }
  }, [simulationState?.stage, startCameraFlight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 650;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera - Initially framed on Atlantic Ocean showing Europe, Africa, Mediterranean, and South America
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const initialCamPos = latLngToVector3(15, -22, 5.15);
    camera.position.copy(initialCamPos);
    camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls with ultra-smooth damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 3.0;
    controls.maxDistance = 6.8;
    // Clamped polar angle to prevent spinning upside down excessively
    controls.minPolarAngle = Math.PI * 0.18; // ~32 deg
    controls.maxPolarAngle = Math.PI * 0.82; // ~148 deg
    controls.enablePan = false;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0;
    controlsRef.current = controls;

    // Gracefully release flight if user grabs the globe manually
    controls.addEventListener('start', () => {
      activeFlightRef.current = null;
    });

    // 5. Sun and Lighting (Sun from top-right / Africa-Europe direction)
    const sunLightPos = new THREE.Vector3(3.2, 2.2, -2.6).normalize();
    const sunLight = new THREE.DirectionalLight(0xfff8ee, 2.4);
    sunLight.position.copy(sunLightPos.clone().multiplyScalar(10));
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x060610, 0.5);
    scene.add(ambientLight);

    // Subtle purple operational backlight
    const purpleRimLight = new THREE.DirectionalLight(0x9333ea, 0.8);
    purpleRimLight.position.set(-6, -2, 4);
    scene.add(purpleRimLight);

    // 6. Earth Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const EARTH_RADIUS = 2.0;

    // Load High-Resolution NASA Textures from /textures/
    const textureLoader = new THREE.TextureLoader();
    const dayTexture = textureLoader.load('/textures/earth_day.jpg');
    const nightTexture = textureLoader.load('/textures/earth_lights.png');
    const specularTexture = textureLoader.load('/textures/earth_specular.jpg');
    const cloudsTexture = textureLoader.load('/textures/earth_clouds.png');

    [dayTexture, nightTexture, specularTexture, cloudsTexture].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
    });

    // 7. Earth Mesh with Day/Night & Specular Shader
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const earthMaterial = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        uDayTexture: { value: dayTexture },
        uNightTexture: { value: nightTexture },
        uSpecularTexture: { value: specularTexture },
        uSunDirection: { value: sunLightPos },
      },
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMeshRef.current = earthMesh;
    earthGroup.add(earthMesh);

    // 8. Atmospheric Clouds Layer
    const cloudsGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.006, 64, 64);
    const cloudsMaterial = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    cloudsMeshRef.current = cloudsMesh;
    earthGroup.add(cloudsMesh);

    // 9. Soft Blue Atmospheric Rim Halo
    const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.022, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // 10. MARITIME SHIPPING ROUTES (Glowing thin purple curved routes)
    const routesGroup = new THREE.Group();
    earthGroup.add(routesGroup);
    const routeMeshes: { id: string; line: THREE.Line; material: THREE.LineBasicMaterial }[] = [];
    const routeCurves: { id: string; curve: any }[] = [];

    MARITIME_ROUTES.forEach((route) => {
      const splinePoints: THREE.Vector3[] = [];
      const waypoints = route.coordinates || route.waypoints || [];
      if (waypoints.length < 2) return;

      for (let i = 0; i < waypoints.length - 1; i++) {
        const [lat1, lng1] = waypoints[i];
        const [lat2, lng2] = waypoints[i + 1];
        const p1 = latLngToVector3(lat1, lng1, EARTH_RADIUS * 1.0028);
        const p2 = latLngToVector3(lat2, lng2, EARTH_RADIUS * 1.0028);
        const distance = p1.distanceTo(p2);

        const subSegments = Math.max(12, Math.floor(distance * 28));
        for (let s = 0; s <= subSegments; s++) {
          if (i > 0 && s === 0) continue;
          const t = s / subSegments;
          const pt = new THREE.Vector3().copy(p1).lerp(p2, t);
          // Conform smoothly to sphere curvature with slight elevation
          pt.normalize().multiplyScalar(EARTH_RADIUS * 1.0032);
          splinePoints.push(pt);
        }
      }

      if (splinePoints.length >= 2) {
        const curve = new (THREE as any).CatmullRomCurve3(splinePoints);
        routeCurves.push({ id: route.id, curve });
        const curvePoints = curve.getPoints(splinePoints.length * 3);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0xb026ff,
          transparent: true,
          opacity: 0.45,
          linewidth: 1,
        });
        const lineMesh = new THREE.Line(lineGeometry, lineMaterial);
        routesGroup.add(lineMesh);
        routeMeshes.push({ id: route.id, line: lineMesh, material: lineMaterial });
      }
    });

    routeMeshesRef.current = routeMeshes;

    // 11. Animated Traffic Pulses along Routes
    const pulseCount = routeCurves.length * 3;
    const pulseGeometry = new THREE.BufferGeometry();
    const pulsePositions = new Float32Array(pulseCount * 3);
    pulseGeometry.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));

    const pulseCanvas = document.createElement('canvas');
    pulseCanvas.width = 64;
    pulseCanvas.height = 64;
    const pctx = pulseCanvas.getContext('2d')!;
    const pgrad = pctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    pgrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    pgrad.addColorStop(0.25, 'rgba(215, 140, 255, 0.85)');
    pgrad.addColorStop(0.7, 'rgba(176, 38, 255, 0.45)');
    pgrad.addColorStop(1, 'rgba(15, 10, 25, 0.0)');
    pctx.fillStyle = pgrad;
    pctx.beginPath();
    pctx.arc(32, 32, 30, 0, Math.PI * 2);
    pctx.fill();
    const pulseTexture = new THREE.CanvasTexture(pulseCanvas);

    const pulseMaterial = new THREE.PointsMaterial({
      size: 0.045,
      map: pulseTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulsePoints = new THREE.Points(pulseGeometry, pulseMaterial);
    routesGroup.add(pulsePoints);

    // Pulse tracking progress: 3 pulses per route with staggered offsets
    const pulsesData: { routeIdx: number; progress: number; speed: number }[] = [];
    routeCurves.forEach((_, rIdx) => {
      for (let p = 0; p < 3; p++) {
        pulsesData.push({
          routeIdx: rIdx,
          progress: (p / 3) + Math.random() * 0.1,
          speed: 0.00075 + Math.random() * 0.0003,
        });
      }
    });

    // 12. OIL SPILL PLUMES + INCIDENT MARKERS
    const spillsGroup = new THREE.Group();
    earthGroup.add(spillsGroup);

    const spillVortexTexture = createSpillVortexTexture();

    interface PlumeObject {
      incidentId: string;
      mesh: THREE.Mesh;
      baseScale: number;
    }
    const plumeObjects: PlumeObject[] = [];
    const pulsingRings: { ring: THREE.Mesh; scale: number; incidentId: string }[] = [];
    const incidentMarkers: { id: string; mesh: THREE.Object3D; incident: Incident; labelOffsetX: number; labelOffsetY: number }[] = [];

    incidents.forEach((incident) => {
      const incidentPos = latLngToVector3(incident.lat, incident.lng, EARTH_RADIUS * 1.004);

      // A. Surface Oil Spill Vortex (Translucent purple swirl slick)
      const plumeGeom = new THREE.PlaneGeometry(0.24, 0.24, 16, 16);
      const plumeMat = new THREE.MeshBasicMaterial({
        map: spillVortexTexture,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const plumeMesh = new THREE.Mesh(plumeGeom, plumeMat);
      plumeMesh.position.copy(incidentPos);
      plumeMesh.lookAt(incidentPos.clone().multiplyScalar(2));

      // Rotate swirl slightly to match current flow
      plumeMesh.rotateZ((incident.currentVectorAngle || 45) * (Math.PI / 180));
      spillsGroup.add(plumeMesh);

      plumeObjects.push({
        incidentId: incident.id,
        mesh: plumeMesh,
        baseScale: incident.severity === 'critical' ? 1.3 : 1.0,
      });

      // B. Glowing Center Core + Outer Pulsing Ring
      const markerAnchor = new THREE.Group();
      markerAnchor.position.copy(incidentPos);
      markerAnchor.lookAt(incidentPos.clone().multiplyScalar(2));

      // Glowing purple circular core
      const coreGeom = new THREE.CircleGeometry(0.026, 24);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xe9d5ff,
        side: THREE.DoubleSide,
      });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      markerAnchor.add(coreMesh);

      // Soft purple outer glow circle
      const softGlowGeom = new THREE.CircleGeometry(0.052, 24);
      const softGlowMat = new THREE.MeshBasicMaterial({
        color: 0xb026ff,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      });
      const softGlowMesh = new THREE.Mesh(softGlowGeom, softGlowMat);
      softGlowMesh.position.z = -0.001;
      markerAnchor.add(softGlowMesh);

      // Outer expanding pulsing ring
      const ringGeom = new THREE.RingGeometry(0.045, 0.062, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xd946ef,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.z = 0.001;
      markerAnchor.add(ringMesh);

      pulsingRings.push({ ring: ringMesh, scale: 1.0, incidentId: incident.id });
      spillsGroup.add(markerAnchor);

      // Compute label badge offset based on region (matching reference image layout)
      let labelOffsetX = 24;
      let labelOffsetY = -16;
      if (incident.id.includes('042')) {
        labelOffsetX = 32;
        labelOffsetY = -18;
      } else if (incident.id.includes('041')) {
        labelOffsetX = 30;
        labelOffsetY = -12;
      } else if (incident.id.includes('031')) {
        labelOffsetX = 26;
        labelOffsetY = -10;
      }

      incidentMarkers.push({
        id: incident.id,
        mesh: markerAnchor,
        incident,
        labelOffsetX,
        labelOffsetY,
      });
    });

    // 12b. INDIAN MARITIME VESSELS & SHIPS (Directional Hulls, Surface Beacons & AIS Pulse)
    const vesselsGroup = new THREE.Group();
    earthGroup.add(vesselsGroup);

    const vesselPulsingRings: { ring: THREE.Mesh; scale: number; vesselId: string }[] = [];
    const vesselMarkers: { id: string; mesh: THREE.Object3D; vessel: Vessel }[] = [];

    activeVesselsList.forEach((vessel) => {
      const vesselPos = latLngToVector3(vessel.lat, vessel.lng, EARTH_RADIUS * 1.0036);
      const norm = vesselPos.clone().normalize();

      const vAnchor = new THREE.Object3D();
      vAnchor.position.copy(vesselPos);
      vAnchor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);

      // Distinct color theme by ship type
      let shipColor = 0x06b6d4; // cyan for Container / Cargo
      if (vessel.type === 'Oil Tanker') {
        shipColor = 0xf59e0b; // luminous amber for Tankers
      } else if (vessel.type === 'LNG Carrier') {
        shipColor = 0x10b981; // emerald green for LNG
      } else if (vessel.name.includes('ICGS')) {
        shipColor = 0xc084fc; // bright purple for Coast Guard Patrol
      } else if (vessel.type === 'Bulk Carrier') {
        shipColor = 0x38bdf8; // sky blue for Bulk Carriers
      }

      // Sleek triangular directional ship hull pointing along headingDeg
      const shipGeom = new THREE.ConeGeometry(0.016, 0.046, 3);
      shipGeom.rotateX(Math.PI / 2);

      const shipMat = new THREE.MeshBasicMaterial({ color: shipColor });
      const shipMesh = new THREE.Mesh(shipGeom, shipMat);
      shipMesh.rotation.y = (vessel.headingDeg || 0) * (Math.PI / 180);
      vAnchor.add(shipMesh);

      // Glowing radar pulse circle around ship
      const vRingGeom = new THREE.RingGeometry(0.022, 0.034, 20);
      const vRingMat = new THREE.MeshBasicMaterial({
        color: shipColor,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const vRingMesh = new THREE.Mesh(vRingGeom, vRingMat);
      vRingMesh.rotateX(Math.PI / 2);
      vAnchor.add(vRingMesh);

      vesselPulsingRings.push({ ring: vRingMesh, scale: 1.0, vesselId: vessel.id });
      vesselsGroup.add(vAnchor);
      vesselMarkers.push({ id: vessel.id, mesh: vAnchor, vessel });
    });

    // 12c. MARIS 8-STAGE SIMULATION 3D LAYER (SAR Swath, Organic Slick, Hindcast, AIS Attribution, Forecast)
    const sim3D = setupSimulation3DLayer(earthGroup, EARTH_RADIUS);

    // 13. Animation Loop with buttery smooth frame-rate scaling
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const timeFactor = delta * 60; // 1.0 at 60fps, 0.5 at 120fps
      const elapsedTime = clock.getElapsedTime();

      // Controls update with smooth damping
      controls.update();

      // Smooth auto-rotation with gentle acceleration / deceleration
      const targetAutoSpeed = isRotating ? 0.35 : 0.0;
      autoRotateSpeedRef.current += (targetAutoSpeed - autoRotateSpeedRef.current) * Math.min(0.06 * timeFactor, 1.0);
      if (autoRotateSpeedRef.current > 0.005) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = autoRotateSpeedRef.current;
      } else {
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0;
      }

      // Smooth cinematic spherical camera flight (Slerp)
      if (activeFlightRef.current) {
        const flight = activeFlightRef.current;
        const now = performance.now();
        const progress = Math.min((now - flight.startTime) / flight.duration, 1.0);

        // Quintic smooth ease-in-out curve
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        if (flight.angle > 0.001) {
          const sinAngle = Math.sin(flight.angle);
          const weightA = Math.sin((1 - ease) * flight.angle) / sinAngle;
          const weightB = Math.sin(ease * flight.angle) / sinAngle;

          const dir = flight.startPos
            .clone()
            .normalize()
            .multiplyScalar(weightA)
            .add(flight.targetPos.clone().normalize().multiplyScalar(weightB))
            .normalize();

          // Subtle panoramic altitude curve for long-distance flights
          const lift = Math.sin(ease * Math.PI) * Math.min(0.35, flight.angle * 0.15);
          const distance =
            (1 - ease) * flight.startDistance + ease * flight.targetDistance + lift;

          camera.position.copy(dir.multiplyScalar(distance));
        } else {
          camera.position.lerpVectors(flight.startPos, flight.targetPos, ease);
        }

        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);

        if (progress >= 1.0) {
          camera.position.copy(flight.targetPos);
          activeFlightRef.current = null;
          if (onRegionFocusedRef.current) {
            onRegionFocusedRef.current();
          }
        }
      }

      // Slow realistic cloud rotation
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += 0.00014 * timeFactor;
      }

      const currentSelected = selectedIncidentRef.current;
      const activeRouteIds = currentSelected?.associatedRouteIds || [];

      // A. Update route glow
      routeMeshes.forEach((rm) => {
        const isAssociated = activeRouteIds.includes(rm.id);
        if (isAssociated) {
          rm.material.opacity = 0.85;
          rm.material.color.setHex(0xd946ef);
        } else {
          rm.material.opacity = 0.38;
          rm.material.color.setHex(0xb026ff);
        }
      });

      // B. Animate Traffic Pulses along Routes scaled by timeFactor
      const positionsAttr = pulseGeometry.attributes.position as THREE.BufferAttribute;
      const posArray = positionsAttr.array as Float32Array;

      pulsesData.forEach((pd, idx) => {
        pd.progress += pd.speed * timeFactor;
        if (pd.progress > 1.0) pd.progress -= 1.0;

        const routeCurve = routeCurves[pd.routeIdx]?.curve;
        if (routeCurve) {
          const pt = routeCurve.getPointAt(pd.progress);
          posArray[idx * 3] = pt.x;
          posArray[idx * 3 + 1] = pt.y;
          posArray[idx * 3 + 2] = pt.z;
        }
      });
      positionsAttr.needsUpdate = true;

      // C. Animate Oil Spill Vortex scaled by timeFactor
      plumeObjects.forEach((po, idx) => {
        po.mesh.rotateZ(0.0035 * timeFactor);
        const breath = Math.sin(elapsedTime * 1.5 + idx * 1.3) * 0.06 + 1.0;
        po.mesh.scale.set(po.baseScale * breath, po.baseScale * breath, 1.0);
      });

      // D. Animate Pulsing Incident Rings scaled by timeFactor
      pulsingRings.forEach((item) => {
        const isSelected = item.incidentId === currentSelected?.id;
        const growthSpeed = (isSelected ? 0.024 : 0.016) * timeFactor;
        const maxScale = isSelected ? 2.4 : 1.9;

        item.scale += growthSpeed;
        if (item.scale > maxScale) {
          item.scale = 1.0;
        }
        item.ring.scale.set(item.scale, item.scale, item.scale);
        const opacity = Math.max(0, (isSelected ? 0.9 : 0.65) * (1 - (item.scale - 1) / (maxScale - 1)));
        (item.ring.material as THREE.MeshBasicMaterial).opacity = opacity;
      });

      // D2. Animate Vessel Pulse Rings scaled by timeFactor
      vesselPulsingRings.forEach((item) => {
        const isVSelected = selectedVesselRef.current?.id === item.vesselId;
        const vGrowthSpeed = (isVSelected ? 0.024 : 0.013) * timeFactor;
        const vMaxScale = isVSelected ? 2.5 : 1.8;

        item.scale += vGrowthSpeed;
        if (item.scale > vMaxScale) item.scale = 1.0;
        item.ring.scale.set(item.scale, item.scale, item.scale);
        const vOpacity = Math.max(0, (isVSelected ? 0.95 : 0.45) * (1 - (item.scale - 1) / (vMaxScale - 1)));
        (item.ring.material as THREE.MeshBasicMaterial).opacity = vOpacity;
      });

      // E. Layer Visibility
      routesGroup.visible = activeLayer === 'all' || activeLayer === 'routes';
      spillsGroup.visible = activeLayer === 'all' || activeLayer === 'spills';
      vesselsGroup.visible = activeLayer === 'all' || activeLayer === 'vessels';

      // F. High-Performance Direct Screen-Space Marker Projection (Zero React state overhead)
      const curW = container.clientWidth;
      const curH = container.clientHeight;
      const camNorm = camera.position.clone().normalize();

      const showSpills = activeLayer !== 'routes' && activeLayer !== 'vessels';
      incidentMarkers.forEach((im) => {
        const el = markerElementsRef.current.get(im.id);
        if (!el) return;

        if (!showSpills) {
          if (el.style.display !== 'none') el.style.display = 'none';
          return;
        }

        const worldPos = new THREE.Vector3();
        im.mesh.getWorldPosition(worldPos);
        const isFacing = camNorm.dot(worldPos.clone().normalize()) > 0.06;
        const screenV = worldPos.clone().project(camera);
        const screenX = ((screenV.x + 1) / 2) * curW;
        const screenY = ((-screenV.y + 1) / 2) * curH;
        const isVisible =
          isFacing &&
          screenV.z < 1 &&
          screenX >= -40 &&
          screenX <= curW + 40 &&
          screenY >= 95 &&
          screenY <= curH - 85;

        if (isVisible) {
          if (el.style.display !== 'block') el.style.display = 'block';
          el.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0) translate(-50%, -50%)`;
        } else {
          if (el.style.display !== 'none') el.style.display = 'none';
        }
      });

      const showVessels = activeLayer === 'all' || activeLayer === 'vessels';
      vesselMarkers.forEach((vm) => {
        const vEl = vesselElementsRef.current.get(vm.id);
        if (!vEl) return;

        if (!showVessels) {
          if (vEl.style.display !== 'none') vEl.style.display = 'none';
          return;
        }

        const worldPos = new THREE.Vector3();
        vm.mesh.getWorldPosition(worldPos);
        const isFacing = camNorm.dot(worldPos.clone().normalize()) > 0.08;
        const screenV = worldPos.clone().project(camera);
        const screenX = ((screenV.x + 1) / 2) * curW;
        const screenY = ((-screenV.y + 1) / 2) * curH;
        const isVisible =
          isFacing &&
          screenV.z < 1 &&
          screenX >= -40 &&
          screenX <= curW + 40 &&
          screenY >= 95 &&
          screenY <= curH - 85;

        if (isVisible) {
          if (vEl.style.display !== 'block') vEl.style.display = 'block';
          vEl.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0) translate(-50%, -50%)`;
        } else {
          if (vEl.style.display !== 'none') vEl.style.display = 'none';
        }
      });

      // G. MARIS Simulation 3D Layer Update & Screen-Space Badge Projection
      sim3D.update(
        simulationStateRef.current,
        hindcastProgressRef.current,
        forecastProgressRef.current,
        scanAngleRef.current,
        delta,
        elapsedTime
      );

      const projectSimAnchor = (anchor: THREE.Object3D, el: HTMLDivElement | null) => {
        if (!el) return;
        const worldPos = new THREE.Vector3();
        anchor.getWorldPosition(worldPos);
        const isFacing = camNorm.dot(worldPos.clone().normalize()) > 0.05;
        const screenV = worldPos.clone().project(camera);
        const screenX = ((screenV.x + 1) / 2) * curW;
        const screenY = ((-screenV.y + 1) / 2) * curH;
        const isVisible =
          isFacing &&
          screenV.z < 1 &&
          screenX >= 20 &&
          screenX <= curW - 20 &&
          screenY >= 50 &&
          screenY <= curH - 50;

        if (isVisible) {
          el.style.display = 'block';
          el.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0) translate(-50%, -125%)`;
        } else {
          el.style.display = 'none';
        }
      };

      const simState = simulationStateRef.current;
      if (simState && simState.stage > 0) {
        if (simState.stage <= 2) {
          projectSimAnchor(sim3D.spillAnchor, simSpillBadgeRef.current);
        } else if (simSpillBadgeRef.current) {
          simSpillBadgeRef.current.style.display = 'none';
        }

        if (simState.stage >= 3 && simState.stage <= 7) {
          projectSimAnchor(sim3D.originAnchor, simOriginBadgeRef.current);
        } else if (simOriginBadgeRef.current) {
          simOriginBadgeRef.current.style.display = 'none';
        }

        if (simState.stage === 6 || simState.stage === 7) {
          projectSimAnchor(sim3D.nordicStarAnchor, simNordicBadgeRef.current);
        } else if (simNordicBadgeRef.current) {
          simNordicBadgeRef.current.style.display = 'none';
        }

        if (simState.stage >= 8) {
          projectSimAnchor(sim3D.forecastAnchor, simForecastBadgeRef.current);
        } else if (simForecastBadgeRef.current) {
          simForecastBadgeRef.current.style.display = 'none';
        }
      } else {
        if (simSpillBadgeRef.current) simSpillBadgeRef.current.style.display = 'none';
        if (simOriginBadgeRef.current) simOriginBadgeRef.current.style.display = 'none';
        if (simNordicBadgeRef.current) simNordicBadgeRef.current.style.display = 'none';
        if (simForecastBadgeRef.current) simForecastBadgeRef.current.style.display = 'none';
      }

      renderer.render(scene, camera);
    };

    animate();

    // 14. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      sim3D.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [incidents, activeLayer, activeVesselsList]);

  const handleMarkerClick = useCallback(
    (incident: Incident) => {
      onSelectIncident(incident);
    },
    [onSelectIncident]
  );

  const handleVesselClick = useCallback(
    (vessel: Vessel) => {
      if (onSelectVessel) {
        onSelectVessel(vessel);
      }
    },
    [onSelectVessel]
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none">
      {/* Three.js Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2D SCREEN-SPACE INCIDENT LABELS (Direct GPU hardware-accelerated tracking) */}
      {incidents.map((incident) => {
        const isSelected = selectedIncident.id === incident.id;
        const isHovered = hoveredIncident?.id === incident.id;
        const offset = getIncidentLabelOffset(incident.id);

        return (
          <div
            key={incident.id}
            ref={(el) => {
              if (el) markerElementsRef.current.set(incident.id, el);
              else markerElementsRef.current.delete(incident.id);
            }}
            className="absolute pointer-events-none select-none z-30 will-change-transform"
            style={{
              left: 0,
              top: 0,
              transform: 'translate3d(-9999px, -9999px, 0)',
              display: 'none',
            }}
          >
            {/* Center Click Target over the 3D vortex core */}
            <button
              type="button"
              id={`target-${incident.id}`}
              aria-label={`Select incident ${incident.id}`}
              onClick={(e) => {
                e.stopPropagation();
                handleMarkerClick(incident);
              }}
              onMouseEnter={() => setHoveredIncident(incident)}
              onMouseLeave={() => setHoveredIncident(null)}
              className="pointer-events-auto absolute -top-4 -left-4 w-8 h-8 rounded-full cursor-pointer group flex items-center justify-center"
            >
              <span className={`w-3 h-3 rounded-full ${isSelected ? 'bg-[#D946EF] ring-2 ring-white' : 'bg-transparent'}`} />
            </button>

            {/* Small Dark Label Tag (As seen in reference image) */}
            <div
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: `${offset.x}px`,
                top: `${offset.y}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleMarkerClick(incident);
              }}
              onMouseEnter={() => setHoveredIncident(incident)}
              onMouseLeave={() => setHoveredIncident(null)}
            >
              {/* Thin connection indicator line to vortex core */}
              <div
                className="absolute w-5 h-px bg-[rgba(192,76,255,0.6)] shadow-[0_0_6px_#c04cff] pointer-events-none"
                style={{
                  left: '-18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />

              {/* Dark Label Badge with White/Purple Text */}
              <div
                id={`badge-${incident.id}`}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold tracking-wider transition-all duration-150 border ${
                  isSelected
                    ? 'bg-[rgba(18,10,28,0.94)] border-[#C04CFF] text-[#FFFFFF] shadow-[0_0_16px_rgba(192,76,255,0.7),0_4px_12px_rgba(0,0,0,0.85)] ring-1 ring-[rgba(217,70,239,0.7)] scale-105'
                    : isHovered
                    ? 'bg-[rgba(14,8,22,0.92)] border-[rgba(192,76,255,0.85)] text-[#F2EDF7] shadow-[0_0_12px_rgba(176,38,255,0.5)] scale-102'
                    : 'bg-[rgba(10,6,16,0.88)] border-[rgba(168,85,247,0.55)] text-[#E9D5FF] shadow-[0_2px_8px_rgba(0,0,0,0.7)]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    incident.severity === 'critical'
                      ? 'bg-[#F87171]'
                      : incident.severity === 'high'
                      ? 'bg-[#FBBF24]'
                      : 'bg-[#C084FC]'
                  } ${isSelected ? 'animate-ping' : ''}`}
                />
                <span>{incident.id}</span>
              </div>

              {/* Hover Quick Telemetry Popover */}
              {isHovered && !isSelected && (
                <div className="absolute top-full left-0 mt-2 w-56 p-2.5 rounded-lg bg-[rgba(10,8,16,0.95)] border border-[rgba(176,38,255,0.5)] shadow-[0_8px_24px_rgba(0,0,0,0.85),0_0_16px_rgba(157,0,255,0.3)] backdrop-blur-[14px] text-[10px] font-mono z-50 pointer-events-auto">
                  <div className="flex items-center justify-between pb-1 border-b border-[rgba(255,255,255,0.08)] mb-1.5">
                    <span className="font-bold text-[#F2EDF7] tracking-wider flex items-center gap-1.5">
                      {incident.severity === 'critical' && <AlertOctagon className="w-3 h-3 text-[#F87171]" />}
                      {incident.severity === 'high' && <AlertTriangle className="w-3 h-3 text-[#FBBF24]" />}
                      {incident.severity === 'medium' && <ShieldCheck className="w-3 h-3 text-[#C084FC]" />}
                      {incident.id}
                    </span>
                    <span className="text-[8px] uppercase font-bold text-[#D6A7FF]">
                      {incident.severity}
                    </span>
                  </div>

                  <div className="space-y-1 text-[9.5px]">
                    <div className="flex justify-between text-[#B9ADBF]">
                      <span className="text-[#81758F]">LOCATION:</span>
                      <span className="text-right text-[#D6A7FF] font-semibold truncate max-w-[130px]">
                        {incident.zone || incident.location}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#B9ADBF]">
                      <span className="text-[#81758F]">ESTIMATED SPILL:</span>
                      <span className="text-right text-[#F87171] font-bold">
                        {incident.estimatedSpillLiters || incident.incidentCost}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#B9ADBF]">
                      <span className="text-[#81758F]">SURFACE DRIFT:</span>
                      <span className="text-right text-[#D6A7FF] text-[9px] flex items-center gap-1">
                        <Wind className="w-2.5 h-2.5" />
                        {incident.currentVectorName || 'Coastal Drift'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 2D SCREEN-SPACE INDIAN VESSELS & SHIPS LABELS (Direct GPU hardware-accelerated tracking) */}
      {activeVesselsList.map((vessel) => {
        const isSelected = selectedVessel?.id === vessel.id;
        const isHovered = hoveredVessel?.id === vessel.id;

        let badgeColorBorder = 'border-[rgba(6,182,212,0.65)] text-[#67E8F9]';
        let dotColor = 'bg-[#06B6D4]';
        if (vessel.type === 'Oil Tanker') {
          badgeColorBorder = 'border-[rgba(245,158,11,0.65)] text-[#FBBF24]';
          dotColor = 'bg-[#F59E0B]';
        } else if (vessel.type === 'LNG Carrier') {
          badgeColorBorder = 'border-[rgba(16,185,129,0.65)] text-[#34D399]';
          dotColor = 'bg-[#10B981]';
        } else if (vessel.name.includes('ICGS')) {
          badgeColorBorder = 'border-[rgba(192,132,252,0.65)] text-[#E9D5FF]';
          dotColor = 'bg-[#A855F7]';
        }

        return (
          <div
            key={vessel.id}
            ref={(el) => {
              if (el) vesselElementsRef.current.set(vessel.id, el);
              else vesselElementsRef.current.delete(vessel.id);
            }}
            className="absolute pointer-events-none select-none z-30 will-change-transform"
            style={{
              left: 0,
              top: 0,
              transform: 'translate3d(-9999px, -9999px, 0)',
              display: 'none',
            }}
          >
            {/* Click / Hover Target */}
            <button
              type="button"
              id={`target-vessel-${vessel.id}`}
              aria-label={`Select vessel ${vessel.name}`}
              onClick={(e) => {
                e.stopPropagation();
                handleVesselClick(vessel);
              }}
              onMouseEnter={() => setHoveredVessel(vessel)}
              onMouseLeave={() => setHoveredVessel(null)}
              className="pointer-events-auto absolute -top-4 -left-4 w-8 h-8 rounded-full cursor-pointer group flex items-center justify-center"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-[#38BDF8] ring-2 ring-white animate-pulse' : 'bg-transparent'}`} />
            </button>

            {/* Sleek Floating Vessel Tag */}
            <div
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: '16px',
                top: '-12px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleVesselClick(vessel);
              }}
              onMouseEnter={() => setHoveredVessel(vessel)}
              onMouseLeave={() => setHoveredVessel(null)}
            >
              {/* Thin connection line */}
              <div
                className="absolute w-3.5 h-px bg-[rgba(6,182,212,0.5)] pointer-events-none"
                style={{
                  left: '-14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />

              {/* Vessel Badge */}
              <div
                id={`vessel-badge-${vessel.id}`}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wide transition-all duration-150 border backdrop-blur-[12px] ${
                  isSelected
                    ? 'bg-[rgba(6,25,35,0.95)] border-[#38BDF8] text-[#FFFFFF] shadow-[0_0_14px_rgba(56,189,248,0.7),0_4px_12px_rgba(0,0,0,0.85)] ring-1 ring-[#38BDF8] scale-105'
                    : isHovered
                    ? 'bg-[rgba(6,20,30,0.92)] border-[#67E8F9] text-[#F0FDFA] shadow-[0_0_10px_rgba(6,182,212,0.5)] scale-102'
                    : `bg-[rgba(8,12,20,0.85)] ${badgeColorBorder} shadow-[0_2px_8px_rgba(0,0,0,0.7)]`
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isSelected ? 'animate-ping' : ''}`} />
                <span className="text-[11px]">🇮🇳</span>
                <span className="truncate max-w-[95px]">{vessel.name.replace('MV ', '').replace('MT ', '').replace('ICGS ', '')}</span>
                <span className="text-[9px] opacity-75 font-normal">{vessel.speed}</span>
              </div>

              {/* Hover AIS Telemetry Tooltip */}
              {isHovered && !isSelected && (
                <div className="absolute top-full left-0 mt-2 w-64 p-3 rounded-lg bg-[rgba(8,12,22,0.96)] border border-[rgba(6,182,212,0.5)] shadow-[0_8px_24px_rgba(0,0,0,0.85),0_0_16px_rgba(6,182,212,0.25)] backdrop-blur-[16px] text-[10px] font-mono z-50 pointer-events-auto">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(255,255,255,0.08)] mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Ship className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span className="font-bold text-[#F0FDFA] tracking-wider truncate max-w-[130px]">
                        {vessel.name}
                      </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-[rgba(6,182,212,0.2)] text-[#67E8F9] border border-[rgba(6,182,212,0.4)]">
                      {vessel.type}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[9.5px]">
                    <div className="flex justify-between text-[#B9ADBF]">
                      <span className="text-[#81758F]">FLAG / REGISTRY:</span>
                      <span className="text-right text-[#F0FDFA] font-semibold flex items-center gap-1">
                        <span>{vessel.flag}</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-[#B9ADBF]">
                      <span className="text-[#81758F]">SOG / COG:</span>
                      <span className="text-right text-[#67E8F9] font-bold">
                        {vessel.speed} • {vessel.heading}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#B9ADBF]">
                      <span className="text-[#81758F]">DESTINATION:</span>
                      <span className="text-right text-[#FDE047] font-semibold truncate max-w-[140px]">
                        {vessel.destination}
                      </span>
                    </div>
                    {vessel.cargo && (
                      <div className="flex justify-between text-[#B9ADBF]">
                        <span className="text-[#81758F]">CARGO:</span>
                        <span className="text-right text-[#E2E8F0] truncate max-w-[140px]">
                          {vessel.cargo}
                        </span>
                      </div>
                    )}
                    {vessel.operator && (
                      <div className="flex justify-between text-[#B9ADBF] pt-1 border-t border-[rgba(255,255,255,0.06)]">
                        <span className="text-[#81758F]">OPERATOR:</span>
                        <span className="text-right text-[#94A3B8] truncate max-w-[140px]">
                          {vessel.operator}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 2D SCREEN-SPACE MARIS INVESTIGATION SIMULATION BADGES */}
      <div
        ref={simSpillBadgeRef}
        style={{ display: 'none', position: 'absolute', top: 0, left: 0 }}
        className="pointer-events-none z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(15,10,24,0.92)] border border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.55)] backdrop-blur-[16px] text-[10px] font-mono whitespace-nowrap"
      >
        <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
        <span className="text-[#FBBF24] font-bold">OIL SPILL DETECTED</span>
        <span className="text-[#F2EDF7] font-semibold">42.8 km²</span>
        <span className="text-[#81758F] font-mono">• 92% SAR CONF</span>
      </div>

      <div
        ref={simOriginBadgeRef}
        style={{ display: 'none', position: 'absolute', top: 0, left: 0 }}
        className="pointer-events-none z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(20,10,35,0.92)] border border-[#C084FC] shadow-[0_0_22px_rgba(192,132,252,0.65)] backdrop-blur-[16px] text-[10px] font-mono whitespace-nowrap"
      >
        <span className="w-2 h-2 rounded-full bg-[#C084FC] animate-pulse" />
        <span className="text-[#D6A7FF] font-bold">PROBABLE ORIGIN</span>
        <span className="text-white font-mono">10:24 UTC</span>
        <span className="text-[#81758F] font-mono">• ±12 km • 81% CONF</span>
      </div>

      <div
        ref={simNordicBadgeRef}
        style={{ display: 'none', position: 'absolute', top: 0, left: 0 }}
        className="pointer-events-none z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(8,18,30,0.95)] border border-[#38BDF8] shadow-[0_0_25px_rgba(56,189,248,0.7)] backdrop-blur-[16px] text-[10px] font-mono whitespace-nowrap"
      >
        <span className="w-2 h-2 rounded-full bg-[#34D399] animate-ping" />
        <span className="text-[#38BDF8] font-bold">NORDIC STAR</span>
        <span className="text-[#34D399] font-bold">92% CORRELATION</span>
        <span className="text-[#F2EDF7] font-mono text-[9px]">• CPA 2.1 km</span>
      </div>

      <div
        ref={simForecastBadgeRef}
        style={{ display: 'none', position: 'absolute', top: 0, left: 0 }}
        className="pointer-events-none z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(22,10,30,0.95)] border border-[#D946EF] shadow-[0_0_22px_rgba(217,70,239,0.6)] backdrop-blur-[16px] text-[10px] font-mono whitespace-nowrap"
      >
        <span className="w-2 h-2 rounded-full bg-[#D946EF] animate-pulse" />
        <span className="text-[#F0ABFC] font-bold">+12H FORECAST: 67.4 km²</span>
        <span className="text-[#81758F] font-mono">• DRIFT: NE 1.2 m/s</span>
      </div>
    </div>
  );
};
