import * as THREE from 'three';

/**
 * Generates an instantaneous, highly realistic procedural satellite Earth texture
 * on an offscreen HTML5 canvas. This guarantees immediate zero-latency rendering
 * while external textures load asynchronously in the background.
 */
export function generateProceduralEarthCanvas(): HTMLCanvasElement {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Deep Ocean Base with Latitudinal Gradients
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0a223e');     // Arctic Deep Blue
  oceanGrad.addColorStop(0.25, '#071b30');  // North Atlantic Deep Navy
  oceanGrad.addColorStop(0.5, '#051627');   // Equatorial Deep Abyss
  oceanGrad.addColorStop(0.75, '#071b30');  // South Atlantic
  oceanGrad.addColorStop(1, '#0c2748');     // Southern Ocean
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Lat / Lng coordinate mapper: lng (-180 to 180) -> x (0 to width), lat (90 to -90) -> y (0 to height)
  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Helper to draw realistic landmass polygon with gradient fill
  const drawLand = (coords: [number, number][], fillStyle: string | CanvasGradient, strokeStyle?: string) => {
    if (coords.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(toX(coords[0][1]), toY(coords[0][0]));
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(toX(coords[i][1]), toY(coords[i][0]));
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  };

  // Helper to draw circular archipelago/island clusters
  const drawIsland = (lat: number, lng: number, rx: number, ry: number, fill: string) => {
    ctx.beginPath();
    ctx.ellipse(toX(lng), toY(lat), (rx / 360) * width, (ry / 180) * height, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  };

  // 3. Realistic Continents Definition

  // --- EUROPE & SCANDINAVIA ---
  const europeCoords: [number, number][] = [
    [71, 28], [70, 20], [64, 11], [58, 6], [54, 8], [51, 2], [47, -4], [43, -9], [37, -9],
    [36, -5], [37, 2], [43, 3], [44, 8], [41, 15], [38, 16], [38, 24], [41, 28], [46, 31],
    [45, 36], [55, 38], [60, 30], [66, 40], [70, 30]
  ];
  const europeGrad = ctx.createLinearGradient(toX(0), toY(60), toX(20), toY(40));
  europeGrad.addColorStop(0, '#1c3e24'); // Emerald Northern Europe / UK
  europeGrad.addColorStop(0.5, '#284e31'); // Central Europe
  europeGrad.addColorStop(1, '#6b663e'); // Mediterranean scrub
  drawLand(europeCoords, europeGrad, '#1b5b48');

  // Great Britain & Ireland
  drawLand([[58, -5], [55, -2], [51, 1.5], [50, -5], [54, -4]], '#204627');
  drawLand([[55, -7], [53, -6], [51, -10], [54, -10]], '#1b4426');

  // --- AFRICA ---
  const africaCoords: [number, number][] = [
    [37, 10], [33, -7], [28, -13], [20, -17], [14, -17.5], [5, -9], [4, 7], [3, 9],
    [-6, 12], [-16, 12], [-28, 16], [-34, 18], [-34, 26], [-26, 33], [-15, 40],
    [-4, 39], [11, 51], [12, 43], [22, 37], [31, 32], [32, 25], [35, 12]
  ];
  const africaGrad = ctx.createLinearGradient(0, toY(35), 0, toY(-35));
  africaGrad.addColorStop(0, '#756846');    // Mediterranean coast
  africaGrad.addColorStop(0.2, '#c79b4a');  // Sahara Desert gold
  africaGrad.addColorStop(0.4, '#ba8a3d');  // Sahel arid ochre
  africaGrad.addColorStop(0.55, '#193f23'); // Congo rainforest deep green
  africaGrad.addColorStop(0.8, '#596131');  // Savanna / Serengeti
  africaGrad.addColorStop(1, '#665d44');    // South Africa / Karoo
  drawLand(africaCoords, africaGrad, '#286249');

  // Madagascar
  drawLand([[-12, 49], [-16, 44], [-25, 44], [-25, 47], [-19, 50]], '#224827');

  // --- SOUTH AMERICA ---
  const southAmericaCoords: [number, number][] = [
    [12, -72], [10, -62], [6, -53], [0, -50], [-5, -35], [-12, -37], [-22, -41], [-30, -50],
    [-40, -62], [-52, -68], [-55, -67], [-50, -75], [-40, -74], [-30, -72], [-18, -71],
    [-5, -81], [5, -77], [10, -75]
  ];
  const saGrad = ctx.createLinearGradient(0, toY(10), 0, toY(-55));
  saGrad.addColorStop(0, '#2d5334');    // Caribbean coastal green
  saGrad.addColorStop(0.25, '#14381b'); // Deep Amazonian jungle
  saGrad.addColorStop(0.5, '#1b4424');  // Mato Grosso
  saGrad.addColorStop(0.7, '#485834');  // Pampas
  saGrad.addColorStop(1, '#53483f');    // Patagonia / Andes
  drawLand(southAmericaCoords, saGrad, '#1b5b48');

  // --- NORTH AMERICA ---
  const northAmericaCoords: [number, number][] = [
    [70, -165], [72, -130], [68, -100], [60, -75], [52, -56], [45, -60], [42, -70],
    [32, -79], [25, -80], [29, -89], [26, -97], [20, -97], [16, -93], [8, -80],
    [9, -84], [16, -95], [23, -106], [32, -117], [38, -123], [48, -125], [58, -137],
    [60, -148], [65, -168]
  ];
  const naGrad = ctx.createLinearGradient(0, toY(70), 0, toY(10));
  naGrad.addColorStop(0, '#3f453a');    // Tundra / Taiga
  naGrad.addColorStop(0.3, '#1c4224');  // Canadian boreal green
  naGrad.addColorStop(0.55, '#2c4b28'); // US East Coast & Great Lakes
  naGrad.addColorStop(0.75, '#857849'); // Great Plains & Sonora
  naGrad.addColorStop(1, '#3b5830');    // Central America
  drawLand(northAmericaCoords, naGrad, '#1b5b48');

  // Greenland & Arctic Ice
  drawLand([[82, -45], [76, -18], [68, -25], [60, -43], [66, -53], [78, -70]], '#dceaf7');
  drawLand([[85, -180], [80, 0], [85, 180], [90, 0]], '#eaf3fc');

  // --- EURASIA (MIDDLE EAST & ASIA) ---
  const eurasiaCoords: [number, number][] = [
    [77, 105], [72, 140], [65, 175], [55, 160], [43, 145], [38, 120], [22, 114],
    [10, 105], [20, 85], [10, 77], [24, 68], [25, 57], [15, 43], [30, 35],
    [40, 35], [55, 38], [68, 60], [75, 75]
  ];
  const eurasiaGrad = ctx.createLinearGradient(0, toY(70), 0, toY(15));
  eurasiaGrad.addColorStop(0, '#2b3f2c');
  eurasiaGrad.addColorStop(0.3, '#244528');
  eurasiaGrad.addColorStop(0.6, '#7e7845');
  eurasiaGrad.addColorStop(0.9, '#c49a51'); // Arabian peninsula & Persian Gulf
  drawLand(eurasiaCoords, eurasiaGrad, '#1b5b48');

  // --- INDIA & SOUTHERN ASIA (High Geographic Accuracy) ---
  // Indian Peninsula including Gujarat (Kutch & Kathiawar), Konkan, Malabar, Coromandel, Andhra, Odisha, Bengal
  const indiaPeninsula: [number, number][] = [
    [24.5, 68.0], // Rann of Kutch
    [23.2, 68.4], // Gulf of Kutch North
    [22.8, 69.8], // Kandla / inner Kutch
    [22.4, 69.0], // Dwarka / Okha
    [21.6, 69.5], // Porbandar
    [20.7, 70.9], // Diu / Gir coast
    [21.5, 72.2], // Gulf of Khambhat / Bhavnagar
    [21.7, 72.8], // Dahej / Bharuch
    [21.1, 72.8], // Surat
    [19.0, 72.8], // Mumbai / JNPT
    [15.5, 73.8], // Goa
    [12.9, 74.8], // Mangalore
    [9.96, 76.2], // Kochi / Kerala
    [8.08, 77.5], // Kanyakumari (Cape Comorin - Southern Tip)
    [8.7, 78.1],  // Tuticorin / Gulf of Mannar
    [9.3, 79.2],  // Rameswaram / Palk Strait
    [10.8, 79.8], // Point Calimere
    [13.1, 80.3], // Chennai / Coromandel
    [15.8, 80.5], // Andhra coast
    [17.7, 83.3], // Visakhapatnam
    [20.3, 86.7], // Paradip / Odisha
    [21.8, 87.5], // Digha / West Bengal
    [22.2, 88.5], // Sundarbans / Haldia / Kolkata
    [23.8, 89.0], // Bengal interior
    [26.0, 88.0], // Bihar / Nepal border
    [29.0, 80.0], // Uttarakhand
    [31.5, 77.0], // Himachal / Himalayas
    [34.5, 75.0], // Kashmir
    [32.0, 74.0], // Punjab
    [27.0, 71.0], // Thar Desert
    [25.0, 68.5], // Indus Delta
  ];
  const indiaGrad = ctx.createLinearGradient(toX(70), toY(25), toX(85), toY(10));
  indiaGrad.addColorStop(0, '#2d5334'); // Lush Western Ghats green
  indiaGrad.addColorStop(0.3, '#3e633d'); // Deccan plateau
  indiaGrad.addColorStop(0.7, '#2f5b35'); // Eastern coastal plains
  indiaGrad.addColorStop(1, '#274e2a');
  drawLand(indiaPeninsula, indiaGrad, '#1b5b48');

  // Sri Lanka
  drawLand([
    [9.8, 80.2], [8.6, 81.2], [7.2, 81.8], [6.0, 80.5], [6.9, 79.8], [8.5, 79.8]
  ], '#27522d', '#1b5b48');

  // Andaman and Nicobar Islands
  drawIsland(12.5, 92.8, 1.2, 3.8, '#27522d');
  drawIsland(7.0, 93.8, 1.0, 2.5, '#27522d');

  // Lakshadweep Islands
  drawIsland(10.5, 72.6, 1.0, 2.2, '#35633b');

  // Maldives Archipelago
  drawIsland(4.2, 73.5, 1.2, 3.5, '#27522d');
  drawIsland(0.5, 73.2, 1.0, 2.2, '#27522d');

  // Persian Gulf & Oman Coastline
  drawLand([
    [23.6, 58.5], [22.5, 59.8], [20.5, 58.5], [17.0, 54.0], [15.0, 50.0],
    [13.0, 45.0], [12.6, 43.3], [15.0, 42.5], [20.0, 39.5], [26.0, 35.5]
  ], '#8a7748', '#385536');

  // --- AUSTRALIA ---
  const ausCoords: [number, number][] = [
    [-11, 142], [-16, 146], [-28, 153], [-37, 150], [-38, 140], [-35, 117],
    [-22, 113], [-15, 125], [-12, 136]
  ];
  drawLand(ausCoords, '#8a6035', '#245a40');

  // --- ANTARCTICA ---
  const antarcticaCoords: [number, number][] = [
    [-65, -64], [-68, -20], [-72, 40], [-66, 90], [-65, 140], [-72, 170],
    [-75, -160], [-73, -100], [-70, -75]
  ];
  drawLand(antarcticaCoords, '#e0effd');

  // 4. Archipelagos & Caribbean Islands
  drawIsland(25, -77, 3, 2, '#2c4b28'); // Bahamas
  drawIsland(21.5, -79, 6, 2, '#2c4b28'); // Cuba
  drawIsland(18.5, -69, 4, 1.5, '#2c4b28'); // Hispaniola
  drawIsland(38.5, -28, 2.5, 1.5, '#284e31'); // Azores
  drawIsland(32.5, -16.8, 1.5, 1.2, '#284e31'); // Madeira
  drawIsland(28.3, -15.5, 2, 1.5, '#857849'); // Canaries
  drawIsland(14.9, -23.5, 1.5, 1.5, '#857849'); // Cape Verde

  // 5. Subtle Coastal Bathymetry Fringes (continental shelves)
  ctx.strokeStyle = 'rgba(28, 120, 150, 0.25)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 6. Subtle Night-Side City Lights (Warm amber points on land)
  const cityClusters = [
    [19.0, 72.8],  // Mumbai / JNPT (Heavy maritime luminescence)
    [13.1, 80.3],  // Chennai / Ennore
    [22.5, 88.3],  // Kolkata / Haldia
    [9.96, 76.2],  // Kochi
    [17.7, 83.3],  // Visakhapatnam
    [22.8, 69.8],  // Kandla / Mundra
    [15.4, 73.8],  // Goa
    [12.9, 74.8],  // Mangalore
    [28.6, 77.2],  // New Delhi
    [12.9, 77.6],  // Bengaluru
    [6.9, 79.8],   // Colombo (Sri Lanka)
    [24.8, 67.0],  // Karachi
    [25.2, 55.3],  // Dubai / UAE
    [23.6, 58.5],  // Muscat (Oman)
    [1.3, 103.8],  // Singapore (Malacca Strait)
    [51.5, -0.1], [48.8, 2.3], [40.7, -74.0], [31.2, 121.5], [35.6, 139.7]
  ];
  for (const [lat, lng] of cityClusters) {
    const cx = toX(lng);
    const cy = toY(lat);
    const cityGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 6);
    cityGrad.addColorStop(0, 'rgba(255, 215, 110, 0.85)');
    cityGrad.addColorStop(0.5, 'rgba(255, 160, 40, 0.4)');
    cityGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = cityGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

/**
 * Generates an instantaneous procedural clouds canvas texture
 * with realistic atmospheric wisps, swirls, and weather fronts.
 */
export function generateProceduralCloudsCanvas(): HTMLCanvasElement {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Clear transparent
  ctx.clearRect(0, 0, width, height);

  // Cloud bands and vortex swirls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';

  // Helper for swirling cloud band
  const drawCloudBand = (startY: number, amplitude: number, frequency: number, thickness: number, alpha: number) => {
    ctx.beginPath();
    ctx.moveTo(0, startY);
    for (let x = 0; x <= width; x += 8) {
      const y = startY + Math.sin((x * frequency) / 100) * amplitude + Math.cos((x * frequency * 0.5) / 100) * (amplitude * 0.5);
      ctx.lineTo(x, y);
    }
    for (let x = width; x >= 0; x -= 8) {
      const y = startY + thickness + Math.sin(((x + 40) * frequency) / 100) * amplitude;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(245, 250, 255, ${alpha})`;
    ctx.fill();
  };

  // Intertropical Convergence Zone (ITCZ)
  drawCloudBand(height * 0.48, 18, 2.2, 35, 0.3);
  drawCloudBand(height * 0.52, 14, 3.1, 25, 0.22);

  // Mid-latitude storm tracks (North Atlantic & Pacific)
  drawCloudBand(height * 0.28, 28, 1.8, 45, 0.32);
  drawCloudBand(height * 0.22, 22, 2.6, 30, 0.25);

  // Southern Ocean Roaring Forties storm systems
  drawCloudBand(height * 0.72, 32, 2.0, 50, 0.35);
  drawCloudBand(height * 0.78, 24, 3.4, 35, 0.28);

  // Cyclone swirls
  const drawCyclone = (cx: number, cy: number, radius: number) => {
    const spiralGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    spiralGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    spiralGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.25)');
    spiralGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = spiralGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  drawCyclone(width * 0.38, height * 0.26, 45); // North Atlantic cyclone
  drawCyclone(width * 0.72, height * 0.32, 40); // Pacific low
  drawCyclone(width * 0.42, height * 0.75, 55); // South Atlantic front

  return canvas;
}

/**
 * Loads high-res satellite textures with procedural fallback
 */
export function createEarthTextures(): {
  dayTexture: THREE.Texture;
  cloudsTexture: THREE.Texture;
} {
  // 1. Instant procedural canvas textures (0ms wait)
  const proceduralEarth = generateProceduralEarthCanvas();
  const dayTexture = new THREE.CanvasTexture(proceduralEarth);
  dayTexture.colorSpace = THREE.SRGBColorSpace;

  const proceduralClouds = generateProceduralCloudsCanvas();
  const cloudsTexture = new THREE.CanvasTexture(proceduralClouds);
  cloudsTexture.colorSpace = THREE.SRGBColorSpace;

  // 2. Asynchronous satellite image upgrade
  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = 'anonymous';

  // Blue marble / NASA satellite day map
  const satelliteUrl = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg';
  textureLoader.load(
    satelliteUrl,
    (loadedTex) => {
      const ctx = proceduralEarth.getContext('2d');
      if (ctx && loadedTex.image) {
        ctx.drawImage(loadedTex.image, 0, 0, proceduralEarth.width, proceduralEarth.height);
        dayTexture.needsUpdate = true;
      }
    },
    undefined,
    () => {
      // Procedural fallback already active
    }
  );

  // Cloud satellite overlay
  const cloudsUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_clouds_1024.png';
  textureLoader.load(
    cloudsUrl,
    (loadedTex) => {
      const cloudCtx = proceduralClouds.getContext('2d');
      if (cloudCtx && loadedTex.image) {
        cloudCtx.clearRect(0, 0, proceduralClouds.width, proceduralClouds.height);
        cloudCtx.drawImage(loadedTex.image, 0, 0, proceduralClouds.width, proceduralClouds.height);
        cloudsTexture.needsUpdate = true;
      }
    },
    undefined,
    () => {
      // Procedural clouds already active
    }
  );

  return { dayTexture, cloudsTexture };
}
