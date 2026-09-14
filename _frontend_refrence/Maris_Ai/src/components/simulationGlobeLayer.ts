import * as THREE from 'three';
import { SimulationState } from '../types';
import { CANDIDATE_VESSELS } from '../data/simulationData';
import { latLngToVector3 } from './EarthGlobe3D';

/**
 * Creates authentic organic amber/orange petroleum oil slick texture
 * with viscous core, feathered dispersion lobes, and iridescent thin-film sheen
 */
export function createOrganicOilSlickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;

  // 1. Feathered Iridescent Fringe / Petroleum rainbow sheen
  const iridescentGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 230);
  iridescentGrad.addColorStop(0, 'rgba(245, 158, 11, 0.95)'); // bright amber core
  iridescentGrad.addColorStop(0.35, 'rgba(217, 119, 6, 0.85)'); // rich golden amber
  iridescentGrad.addColorStop(0.65, 'rgba(180, 83, 9, 0.65)');  // dark amber-brown
  iridescentGrad.addColorStop(0.85, 'rgba(147, 51, 234, 0.45)'); // violet sheen fringe
  iridescentGrad.addColorStop(0.95, 'rgba(6, 182, 212, 0.35)');  // cyan water interference
  iridescentGrad.addColorStop(1.0, 'rgba(2, 6, 23, 0.0)');

  ctx.fillStyle = iridescentGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 230, 0, Math.PI * 2);
  ctx.fill();

  // 2. Draw organic asymmetrical oil slick lobes (elongated along hydrodynamic current)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.45); // orient along NE drift angle

  // Multi-lobed crude viscous mass
  ctx.fillStyle = 'rgba(60, 25, 6, 0.88)'; // dark heavy crude petroleum core
  ctx.beginPath();
  const numPoints = 28;
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Asymmetrical harmonic deformation
    const r =
      120 +
      Math.sin(angle * 3) * 35 +
      Math.cos(angle * 5) * 20 +
      Math.sin(angle * 2) * 45; // stretched along drift axis
    const px = Math.cos(angle) * r * 1.35; // elongated
    const py = Math.sin(angle) * r * 0.85;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Secondary viscous dark patches inside slick
  ctx.fillStyle = 'rgba(25, 10, 2, 0.95)';
  ctx.beginPath();
  ctx.ellipse(-15, 10, 65, 38, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(45, -20, 50, 28, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Shimmering golden surface reflections on slick
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 95, 45, 0.1, 0, Math.PI * 1.6);
  ctx.stroke();

  // Filaments & trailing sheens
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 2;
  for (let f = 0; f < 5; f++) {
    ctx.beginPath();
    ctx.moveTo(80 + f * 12, -40 + f * 15);
    ctx.bezierCurveTo(120 + f * 10, -50 + f * 20, 160 + f * 8, -30 + f * 18, 195 + f * 5, -20 + f * 10);
    ctx.stroke();
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Creates soft violet probability field texture for hindcast reconstructed origin
 */
export function createOriginProbabilityTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Gaussian radial gradient
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 120);
  grad.addColorStop(0, 'rgba(233, 213, 255, 0.95)'); // soft luminous core
  grad.addColorStop(0.2, 'rgba(192, 76, 255, 0.80)'); // vibrant violet
  grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.45)'); // deep purple
  grad.addColorStop(0.8, 'rgba(126, 34, 206, 0.20)');
  grad.addColorStop(1.0, 'rgba(10, 5, 20, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fill();

  // Probability Iso-contour rings
  ctx.strokeStyle = 'rgba(216, 180, 254, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, 75, 0, Math.PI * 2); // 80% boundary
  ctx.stroke();

  ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
  ctx.beginPath();
  ctx.arc(cx, cy, 105, 0, Math.PI * 2); // 95% boundary
  ctx.stroke();
  ctx.setLineDash([]);

  // Crosshair reticle ticks
  ctx.strokeStyle = 'rgba(243, 232, 255, 0.8)';
  ctx.lineWidth = 1.5;
  const tickLen = 8;
  // Top
  ctx.beginPath();
  ctx.moveTo(cx, cy - 25);
  ctx.lineTo(cx, cy - 25 - tickLen);
  ctx.stroke();
  // Bottom
  ctx.beginPath();
  ctx.moveTo(cx, cy + 25);
  ctx.lineTo(cx, cy + 25 + tickLen);
  ctx.stroke();
  // Left
  ctx.beginPath();
  ctx.moveTo(cx - 25, cy);
  ctx.lineTo(cx - 25 - tickLen, cy);
  ctx.stroke();
  // Right
  ctx.beginPath();
  ctx.moveTo(cx + 25, cy);
  ctx.lineTo(cx + 25 + tickLen, cy);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates satellite SAR radar sweep swath texture
 */
export function createRadarSwathTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Conic angular sweep gradient
  const sweepAngle = Math.PI * 0.45; // 80-degree radar fan beam
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
  grad.addColorStop(0, 'rgba(103, 232, 249, 0.75)'); // bright cyan
  grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.35)');
  grad.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 120, -sweepAngle / 2, sweepAngle / 2);
  ctx.closePath();
  ctx.fill();

  // Leading edge beam
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sweepAngle / 2) * 120, cy + Math.sin(sweepAngle / 2) * 120);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates 12H forecast fan corridor texture
 */
export function createForecastCorridorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Cone fan stretching upwards
  const grad = ctx.createLinearGradient(128, 230, 128, 20);
  grad.addColorStop(0, 'rgba(103, 232, 249, 0.6)');
  grad.addColorStop(0.4, 'rgba(168, 85, 247, 0.45)');
  grad.addColorStop(0.8, 'rgba(244, 114, 182, 0.3)');
  grad.addColorStop(1.0, 'rgba(217, 70, 239, 0.05)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(128, 230);
  ctx.lineTo(60, 30);
  ctx.quadraticCurveTo(128, 10, 196, 30);
  ctx.closePath();
  ctx.fill();

  // +3h, +6h, +12h boundary contour arcs
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);

  // +3h
  ctx.beginPath();
  ctx.ellipse(128, 170, 35, 12, 0, 0, Math.PI);
  ctx.stroke();

  // +6h
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
  ctx.beginPath();
  ctx.ellipse(128, 110, 52, 16, 0, 0, Math.PI);
  ctx.stroke();

  // +12h
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.8)';
  ctx.beginPath();
  ctx.ellipse(128, 40, 72, 20, 0, 0, Math.PI);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export interface Simulation3DController {
  group: THREE.Group;
  spillAnchor: THREE.Object3D;
  originAnchor: THREE.Object3D;
  nordicStarAnchor: THREE.Object3D;
  forecastAnchor: THREE.Object3D;
  update: (
    simState: SimulationState | undefined,
    hindcastProgress: number,
    forecastProgress: number,
    scanAngle: number,
    delta: number,
    elapsedTime: number
  ) => void;
  dispose: () => void;
}

/**
 * Initializes the full MARIS 8-Stage 3D simulation layer on the globe
 */
export function setupSimulation3DLayer(
  earthGroup: THREE.Group,
  EARTH_RADIUS: number
): Simulation3DController {
  const simGroup = new THREE.Group();
  earthGroup.add(simGroup);

  // Position coordinates in Bay of Bengal
  const SPILL_LAT = 14.85;
  const SPILL_LNG = 88.25;
  const ORIGIN_LAT = 14.20;
  const ORIGIN_LNG = 87.50;
  const NORDIC_LAT = 14.22;
  const NORDIC_LNG = 87.52;
  const FORECAST_LAT = 15.65;
  const FORECAST_LNG = 89.48;

  const currentSpillPos = latLngToVector3(SPILL_LAT, SPILL_LNG, EARTH_RADIUS * 1.0045);
  const originPos = latLngToVector3(ORIGIN_LAT, ORIGIN_LNG, EARTH_RADIUS * 1.0042);
  const nordicPos = latLngToVector3(NORDIC_LAT, NORDIC_LNG, EARTH_RADIUS * 1.005);
  const forecastPos = latLngToVector3(FORECAST_LAT, FORECAST_LNG, EARTH_RADIUS * 1.0045);

  // 1. ORGANIC OIL SLICK MESH (Amber / Orange formation)
  const organicTexture = createOrganicOilSlickTexture();
  const slickGeom = new THREE.PlaneGeometry(0.32, 0.32, 16, 16);
  const slickMat = new THREE.MeshBasicMaterial({
    map: organicTexture,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const slickMesh = new THREE.Mesh(slickGeom, slickMat);
  slickMesh.position.copy(currentSpillPos);
  slickMesh.lookAt(currentSpillPos.clone().multiplyScalar(2));
  simGroup.add(slickMesh);

  // Slick boundary contour ring (Stage 2)
  const contourGeom = new THREE.RingGeometry(0.095, 0.108, 48);
  const contourMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const contourMesh = new THREE.Mesh(contourGeom, contourMat);
  contourMesh.position.copy(currentSpillPos);
  contourMesh.lookAt(currentSpillPos.clone().multiplyScalar(2));
  contourMesh.visible = false;
  simGroup.add(contourMesh);

  // 2. RADAR SWATH SCAN BEAM (Stage 1)
  const radarTexture = createRadarSwathTexture();
  const radarGeom = new THREE.PlaneGeometry(0.55, 0.55);
  const radarMat = new THREE.MeshBasicMaterial({
    map: radarTexture,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const radarMesh = new THREE.Mesh(radarGeom, radarMat);
  radarMesh.position.copy(currentSpillPos);
  radarMesh.lookAt(currentSpillPos.clone().multiplyScalar(2));
  radarMesh.visible = false;
  simGroup.add(radarMesh);

  // 3. PROBABLE ORIGIN (Stage 3+: soft violet probability field ±12km)
  const originTexture = createOriginProbabilityTexture();
  const originGeom = new THREE.PlaneGeometry(0.34, 0.34);
  const originMat = new THREE.MeshBasicMaterial({
    map: originTexture,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const originMesh = new THREE.Mesh(originGeom, originMat);
  originMesh.position.copy(originPos);
  originMesh.lookAt(originPos.clone().multiplyScalar(2));
  originMesh.visible = false;
  simGroup.add(originMesh);

  // Pulsing uncertainty ring around origin
  const originRingGeom = new THREE.RingGeometry(0.07, 0.082, 36);
  const originRingMat = new THREE.MeshBasicMaterial({
    color: 0xc084fc,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });
  const originRing = new THREE.Mesh(originRingGeom, originRingMat);
  originRing.position.copy(originPos);
  originRing.lookAt(originPos.clone().multiplyScalar(2));
  originRing.visible = false;
  simGroup.add(originRing);

  // 4. CANDIDATE VESSELS & HISTORICAL TRAJECTORIES (Stage 4+)
  const candidateVesselObjects: {
    id: string;
    vesselMesh: THREE.Mesh;
    trajectoryLine: THREE.Line;
    beaconMesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    beaconMaterial: THREE.MeshBasicMaterial;
    lineMaterial: THREE.LineBasicMaterial;
  }[] = [];

  CANDIDATE_VESSELS.forEach((v) => {
    // Vessel 3D marker at point of closest approach
    const midIdx = Math.floor(v.trajectory.length / 2);
    const [cLat, cLng] = v.trajectory[midIdx] || [14.2, 87.5];
    const vPos = latLngToVector3(cLat, cLng, EARTH_RADIUS * 1.0048);
    const norm = vPos.clone().normalize();
    const isNordic = v.name === 'NORDIC STAR';

    const vGeom = new THREE.ConeGeometry(0.016, 0.048, 3);
    vGeom.rotateX(Math.PI / 2);
    const vColor = isNordic ? 0x38bdf8 : 0x94a3b8;
    const vMat = new THREE.MeshBasicMaterial({
      color: vColor,
      transparent: true,
      opacity: 0.85,
    });
    const vMesh = new THREE.Mesh(vGeom, vMat);
    vMesh.position.copy(vPos);
    vMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
    const headingVal = parseInt(v.heading, 10) || 45;
    vMesh.rotation.y = headingVal * (Math.PI / 180);
    vMesh.visible = false;
    simGroup.add(vMesh);

    // Closest Point Beacon
    const bGeom = new THREE.RingGeometry(0.018, 0.028, 24);
    const bMat = new THREE.MeshBasicMaterial({
      color: isNordic ? 0x34d399 : 0x64748b,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const bMesh = new THREE.Mesh(bGeom, bMat);
    bMesh.position.copy(vPos);
    bMesh.lookAt(vPos.clone().multiplyScalar(2));
    bMesh.visible = false;
    simGroup.add(bMesh);

    // Trajectory curved line on globe
    const trajPoints = v.trajectory.map(([tLat, tLng]) =>
      latLngToVector3(tLat, tLng, EARTH_RADIUS * 1.0042)
    );
    const curve = new THREE.CatmullRomCurve3(trajPoints);
    const curvePoints = curve.getPoints(36);
    const lineGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: isNordic ? 0x67e8f9 : 0x475569,
      transparent: true,
      opacity: 0.65,
      linewidth: isNordic ? 2 : 1,
    });
    const trajLine = new THREE.Line(lineGeom, lineMat);
    trajLine.visible = false;
    simGroup.add(trajLine);

    candidateVesselObjects.push({
      id: v.id,
      vesselMesh: vMesh,
      trajectoryLine: trajLine,
      beaconMesh: bMesh,
      material: vMat,
      beaconMaterial: bMat,
      lineMaterial: lineMat,
    });
  });

  // 5. 12H FORECAST CORRIDOR (Stage 8 & 9)
  const forecastTexture = createForecastCorridorTexture();
  const forecastGeom = new THREE.PlaneGeometry(0.48, 0.48);
  const forecastMat = new THREE.MeshBasicMaterial({
    map: forecastTexture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const forecastMesh = new THREE.Mesh(forecastGeom, forecastMat);
  const forecastCenter = latLngToVector3(15.25, 88.85, EARTH_RADIUS * 1.004);
  forecastMesh.position.copy(forecastCenter);
  forecastMesh.lookAt(forecastCenter.clone().multiplyScalar(2));
  // Rotate so cone points northeast (along 45° azimuth)
  forecastMesh.rotateZ(-Math.PI * 0.25);
  forecastMesh.visible = false;
  simGroup.add(forecastMesh);

  // Anchors for 2D screen tracking
  const spillAnchor = new THREE.Object3D();
  spillAnchor.position.copy(currentSpillPos);
  simGroup.add(spillAnchor);

  const originAnchor = new THREE.Object3D();
  originAnchor.position.copy(originPos);
  simGroup.add(originAnchor);

  const nordicStarAnchor = new THREE.Object3D();
  nordicStarAnchor.position.copy(nordicPos);
  simGroup.add(nordicStarAnchor);

  const forecastAnchor = new THREE.Object3D();
  forecastAnchor.position.copy(forecastPos);
  simGroup.add(forecastAnchor);

  let ringScale = 1.0;

  return {
    group: simGroup,
    spillAnchor,
    originAnchor,
    nordicStarAnchor,
    forecastAnchor,
    update: (simState, hindcastProgress, forecastProgress, scanAngle, delta, elapsedTime) => {
      if (!simState || simState.stage === 0) {
        simGroup.visible = false;
        return;
      }
      simGroup.visible = true;
      const stage = simState.stage;

      // Pulse ring scaling
      ringScale += 0.02 * delta * 60;
      if (ringScale > 2.2) ringScale = 1.0;

      // STAGE 1: SATELLITE DETECTION
      if (stage === 1) {
        radarMesh.visible = true;
        radarMesh.rotation.z = scanAngle;

        slickMesh.visible = true;
        // Fade in as scan proceeds
        slickMat.opacity = Math.min(0.92, simState.stageProgress * 1.2);
        contourMesh.visible = false;
        originMesh.visible = false;
        originRing.visible = false;
        forecastMesh.visible = false;
        candidateVesselObjects.forEach((cv) => {
          cv.vesselMesh.visible = false;
          cv.trajectoryLine.visible = false;
          cv.beaconMesh.visible = false;
        });
      }

      // STAGE 2: SPILL CHARACTERIZATION
      else if (stage === 2) {
        radarMesh.visible = false;
        slickMesh.visible = true;
        slickMat.opacity = 0.92;
        // Organic gentle pulse
        const breath = Math.sin(elapsedTime * 2.0) * 0.04 + 1.0;
        slickMesh.scale.set(breath, breath, 1.0);

        contourMesh.visible = true;
        contourMesh.scale.set(breath * 1.05, breath * 1.05, 1.0);
        contourMat.opacity = 0.7 + Math.sin(elapsedTime * 3.5) * 0.25;

        originMesh.visible = false;
        originRing.visible = false;
        forecastMesh.visible = false;
        candidateVesselObjects.forEach((cv) => {
          cv.vesselMesh.visible = false;
          cv.trajectoryLine.visible = false;
          cv.beaconMesh.visible = false;
        });
      }

      // STAGE 3: HINDCAST (ORIGIN RECONSTRUCTION)
      else if (stage === 3) {
        radarMesh.visible = false;
        contourMesh.visible = false;
        slickMesh.visible = true;

        // Animate slick translating backward from current position to origin
        const currentVec = currentSpillPos.clone();
        const originVec = originPos.clone();
        const interpPos = currentVec.lerp(originVec, Math.min(1.0, hindcastProgress));
        slickMesh.position.copy(interpPos);
        slickMesh.lookAt(interpPos.clone().multiplyScalar(2));

        // Origin probability field emerges as backtrack nears completion
        originMesh.visible = hindcastProgress > 0.35;
        originMat.opacity = Math.min(0.88, (hindcastProgress - 0.35) * 1.6);
        originRing.visible = hindcastProgress > 0.5;
        originRing.scale.set(ringScale, ringScale, 1.0);
        originRingMat.opacity = Math.max(0, 0.8 * (1 - (ringScale - 1) / 1.2));

        forecastMesh.visible = false;
        candidateVesselObjects.forEach((cv) => {
          cv.vesselMesh.visible = false;
          cv.trajectoryLine.visible = false;
          cv.beaconMesh.visible = false;
        });
      }

      // STAGE 4: AIS RECONSTRUCTION
      else if (stage === 4) {
        radarMesh.visible = false;
        contourMesh.visible = false;
        slickMesh.visible = true;
        slickMesh.position.copy(originPos); // at origin
        slickMesh.lookAt(originPos.clone().multiplyScalar(2));

        originMesh.visible = true;
        originMat.opacity = 0.88;
        originRing.visible = true;
        originRing.scale.set(ringScale, ringScale, 1.0);

        forecastMesh.visible = false;

        // Reveal all 5 candidate vessels and historical trajectories
        candidateVesselObjects.forEach((cv) => {
          cv.vesselMesh.visible = true;
          cv.trajectoryLine.visible = true;
          cv.beaconMesh.visible = true;
          cv.material.opacity = 0.85;
          cv.lineMaterial.opacity = 0.65;
        });
      }

      // STAGE 5: FILTER IRRELEVANT TRAFFIC
      else if (stage === 5) {
        radarMesh.visible = false;
        contourMesh.visible = false;
        slickMesh.visible = true;
        slickMesh.position.copy(originPos);
        originMesh.visible = true;
        originRing.visible = true;
        originRing.scale.set(ringScale, ringScale, 1.0);
        forecastMesh.visible = false;

        // Low-correlation vessels fade away; Nordic Star remains bright
        candidateVesselObjects.forEach((cv) => {
          const isNordic = cv.id === 'VES-NORDIC';
          cv.vesselMesh.visible = true;
          cv.trajectoryLine.visible = true;
          cv.beaconMesh.visible = isNordic;

          if (isNordic) {
            cv.material.opacity = 1.0;
            cv.lineMaterial.opacity = 0.95;
            cv.material.color.setHex(0x38bdf8);
            cv.lineMaterial.color.setHex(0x67e8f9);
          } else {
            // Faded
            cv.material.opacity = 0.15;
            cv.lineMaterial.opacity = 0.12;
          }
        });
      }

      // STAGE 6 & 7: VESSEL ATTRIBUTION & EXPLAINABLE RESULT
      else if (stage === 6 || stage === 7) {
        radarMesh.visible = false;
        contourMesh.visible = false;
        slickMesh.visible = true;
        slickMesh.position.copy(originPos);
        originMesh.visible = true;
        originRing.visible = true;
        originRing.scale.set(ringScale, ringScale, 1.0);
        forecastMesh.visible = false;

        // Nordic Star highlighted with intense beacon & trajectory glow
        candidateVesselObjects.forEach((cv) => {
          const isNordic = cv.id === 'VES-NORDIC';
          cv.vesselMesh.visible = isNordic;
          cv.trajectoryLine.visible = isNordic;
          cv.beaconMesh.visible = isNordic;

          if (isNordic) {
            cv.material.opacity = 1.0;
            cv.lineMaterial.opacity = 0.95;
            cv.lineMaterial.color.setHex(0xd946ef); // vibrant attribution purple
            // Pulse beacon
            const beaconBreath = Math.sin(elapsedTime * 4.0) * 0.4 + 1.2;
            cv.beaconMesh.scale.set(beaconBreath, beaconBreath, 1.0);
            cv.beaconMaterial.color.setHex(0x34d399); // green target
          }
        });
      }

      // STAGE 8 & 9: FUTURE FORECAST & FINAL COMPLETE
      else if (stage === 8 || stage === 9) {
        radarMesh.visible = false;
        contourMesh.visible = false;
        slickMesh.visible = true;
        slickMesh.position.copy(currentSpillPos); // back to current position
        slickMesh.lookAt(currentSpillPos.clone().multiplyScalar(2));

        originMesh.visible = true;
        originMat.opacity = 0.65;
        originRing.visible = true;

        // Reveal translucent forecast corridor expanding northeast (+3h, +6h, +12h)
        forecastMesh.visible = true;
        const targetForecastScale = stage === 9 ? 1.0 : Math.max(0.3, forecastProgress);
        forecastMesh.scale.set(targetForecastScale, targetForecastScale, 1.0);
        forecastMat.opacity = 0.85;

        // Keep Nordic Star visible
        candidateVesselObjects.forEach((cv) => {
          const isNordic = cv.id === 'VES-NORDIC';
          cv.vesselMesh.visible = isNordic;
          cv.trajectoryLine.visible = isNordic;
          cv.beaconMesh.visible = isNordic;
        });
      }
    },
    dispose: () => {
      organicTexture.dispose();
      originTexture.dispose();
      radarTexture.dispose();
      forecastTexture.dispose();
      slickGeom.dispose();
      slickMat.dispose();
      contourGeom.dispose();
      contourMat.dispose();
      radarGeom.dispose();
      radarMat.dispose();
      originGeom.dispose();
      originMat.dispose();
      originRingGeom.dispose();
      originRingMat.dispose();
      forecastGeom.dispose();
      forecastMat.dispose();
      earthGroup.remove(simGroup);
    },
  };
}
