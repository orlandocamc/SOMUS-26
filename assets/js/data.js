/* =====================================================
   SOMUS-26 · Datos del sistema
   - Factores de emisión: SEMARNAT 2023 + IPCC AR6
   - Estaciones ECOBICI: muestra basada en GBFS público
   - Patrones de flujo: basados en hora pico CDMX (INEGI/SEMOVI)
   ===================================================== */

/* ── CONFIG GLOBAL ─────────────────────────────────────
   DEMO_HOUR · número 0-23 fuerza hora del demo
              · null usa hora real (con fallback a hora pico en madrugada)
*/
const DEMO_HOUR = null; // cambiar a 18 para forzar hora pico siempre
const ROUTES_DIR = 'assets/data/routes';  // rutas pre-calculadas (OSRM, © OpenStreetMap contributors, ODbL)
const OVERPASS = 'https://overpass-api.de/api/interpreter';

const SOMUS_DATA = {

  // ── ESTADIOS MUNDIAL 2026 (México) ─────────────────
  stadiums: [
    { id: 'azteca', name: 'Estadio Azteca',     lat: 19.3029, lng: -99.1505, capacity: 87000, matches: 5, city: 'CDMX' },
    { id: 'akron',  name: 'Estadio Akron',      lat: 20.6817, lng: -103.4625, capacity: 49000, matches: 4, city: 'Guadalajara' },
    { id: 'bbva',   name: 'Estadio BBVA',       lat: 25.6692, lng: -100.2447, capacity: 53500, matches: 4, city: 'Monterrey' }
  ],

  // ── PUNTOS DE INTERÉS CDMX ─────────────────────────
  // Estaciones de Metro relevantes y nodos urbanos
  metroNodes: [
    { name: 'Hidalgo',         lat: 19.4376, lng: -99.1450, lines: ['2','3'] },
    { name: 'Bellas Artes',    lat: 19.4358, lng: -99.1413, lines: ['2','8'] },
    { name: 'Pino Suárez',     lat: 19.4255, lng: -99.1336, lines: ['1','2'] },
    { name: 'Centro Médico',   lat: 19.4072, lng: -99.1565, lines: ['3','9'] },
    { name: 'Zapata',          lat: 19.3803, lng: -99.1701, lines: ['3','12'] },
    { name: 'Tasqueña',        lat: 19.3447, lng: -99.1393, lines: ['2'] },
    { name: 'Insurgentes',     lat: 19.4234, lng: -99.1632, lines: ['1'] },
    { name: 'Chapultepec',     lat: 19.4203, lng: -99.1769, lines: ['1'] },
    { name: 'Polanco',         lat: 19.4338, lng: -99.1934, lines: ['7'] },
    { name: 'Auditorio',       lat: 19.4257, lng: -99.1898, lines: ['7'] },
    { name: 'CU',              lat: 19.3274, lng: -99.1736, lines: ['3'] },
    { name: 'Universidad',     lat: 19.3204, lng: -99.1739, lines: ['3'] },
    { name: 'San Lázaro',      lat: 19.4326, lng: -99.1227, lines: ['1','B'] }
  ],

  // ── ESTACIONES ECOBICI (muestra de zona del Mundial) ──
  // Estructura GBFS-compatible
  ecobiciStations: [
    { id: 1,   name: 'Reforma 222',          lat: 19.4233, lng: -99.1659, bikes: 8,  docks: 12, capacity: 20 },
    { id: 27,  name: 'Auditorio Nacional',   lat: 19.4252, lng: -99.1893, bikes: 14, docks: 6,  capacity: 20 },
    { id: 45,  name: 'Insurgentes Centro',   lat: 19.4254, lng: -99.1634, bikes: 3,  docks: 17, capacity: 20 },
    { id: 89,  name: 'Polanco',              lat: 19.4338, lng: -99.1925, bikes: 11, docks: 9,  capacity: 20 },
    { id: 102, name: 'Roma Sur',             lat: 19.4032, lng: -99.1623, bikes: 16, docks: 4,  capacity: 20 },
    { id: 156, name: 'Coyoacán Centro',      lat: 19.3500, lng: -99.1622, bikes: 7,  docks: 13, capacity: 20 },
    { id: 178, name: 'Tlalpan Hospital',     lat: 19.3088, lng: -99.1471, bikes: 2,  docks: 18, capacity: 20 },
    { id: 199, name: 'CU Metro',             lat: 19.3274, lng: -99.1736, bikes: 13, docks: 7,  capacity: 20 },
    { id: 234, name: 'Estadio Azteca',       lat: 19.3029, lng: -99.1505, bikes: 0,  docks: 25, capacity: 25 },
    { id: 289, name: 'Mixcoac',              lat: 19.3756, lng: -99.1873, bikes: 9,  docks: 11, capacity: 20 },
    { id: 312, name: 'Del Valle',            lat: 19.3825, lng: -99.1741, bikes: 12, docks: 8,  capacity: 20 },
    { id: 345, name: 'Narvarte',             lat: 19.3927, lng: -99.1547, bikes: 6,  docks: 14, capacity: 20 }
  ],

  // ── FACTORES DE EMISIÓN (kg CO₂e por km, por pasajero) ──
  // Fuente: SEMARNAT 2023, IPCC AR6, ICCT Mexico
  emissionFactors: {
    car_gasoline:   { co2: 0.192,  label: 'Auto gasolina (1 ocupante)', icon: '🚗', mode: 'private' },
    car_pooled:     { co2: 0.064,  label: 'Auto compartido (3 ocup.)', icon: '🚙', mode: 'private' },
    motorcycle:     { co2: 0.103,  label: 'Motocicleta',                icon: '🛵', mode: 'private' },
    taxi:           { co2: 0.205,  label: 'Taxi / App ride',            icon: '🚕', mode: 'service' },
    bus_diesel:     { co2: 0.082,  label: 'Autobús diésel',             icon: '🚌', mode: 'public' },
    metrobus:       { co2: 0.041,  label: 'Metrobús',                   icon: '🚍', mode: 'public' },
    metro:          { co2: 0.028,  label: 'Metro (eléctrico)',          icon: '🚇', mode: 'public' },
    trolebus:       { co2: 0.015,  label: 'Trolebús',                   icon: '⚡', mode: 'public' },
    cablebus:       { co2: 0.011,  label: 'Cablebús',                   icon: '🚠', mode: 'public' },
    ecobici:        { co2: 0.000,  label: 'ECOBICI',                    icon: '🚲', mode: 'active'  },
    walk:           { co2: 0.000,  label: 'A pie',                      icon: '🚶', mode: 'active'  }
  },

  // ── FUENTES DE DATOS DEL SISTEMA ───────────────────
  dataSources: [
    { name: 'C5 CDMX',           type: 'CCTV',    status: 'planned',   note: 'Vía convenio institucional' },
    { name: 'ECOBICI GBFS',      type: 'API',     status: 'live',      url: 'gbfs.mex.lyftbikes.com' },
    { name: 'SIMAT — Aire',      type: 'API',     status: 'live',      url: 'aire.cdmx.gob.mx' },
    { name: 'OpenStreetMap',     type: 'Mapas',   status: 'live',      url: 'overpass-api.de' },
    { name: 'Datos Abiertos CDMX',type:'Dataset', status: 'live',      url: 'datos.cdmx.gob.mx' },
    { name: 'Webcams públicas',  type: 'Stream',  status: 'live',      url: 'webcams.travel' },
    { name: 'YOLOv8 (Ultralytics)',type:'Modelo', status: 'live',      url: 'pretrained · COCO' }
  ],

  // ── ALERTAS ACTIVAS (ejemplo, simulado pero realista) ──
  alerts: [
    { id: 'A001', sev: 'high',   time: '14:23', loc: 'Insurgentes Sur · Eje 7', msg: 'Congestión severa: tiempo +18 min', mode: 'traffic' },
    { id: 'A002', sev: 'medium', time: '14:15', loc: 'Metro L3 · Centro Médico', msg: 'Saturación de andén >85%',         mode: 'metro'   },
    { id: 'A003', sev: 'low',    time: '14:08', loc: 'ECOBICI · Tlalpan Hosp.',  msg: 'Estación con baja disponibilidad',  mode: 'bike'    },
    { id: 'A004', sev: 'high',   time: '13:52', loc: 'Calzada de Tlalpan',       msg: 'Incidente vial: carril cerrado',    mode: 'traffic' },
    { id: 'A005', sev: 'medium', time: '13:40', loc: 'Anillo Periférico Sur',    msg: 'Aforo vehicular sobre la media',    mode: 'traffic' }
  ],

  // ── ODS ALINEADOS ──────────────────────────────────
  sdgs: [
    { num: 3,  name: 'Salud y Bienestar',      color: '#4C9F38' },
    { num: 7,  name: 'Energía Asequible',      color: '#FCC30B' },
    { num: 9,  name: 'Industria e Innovación', color: '#FD6925' },
    { num: 10, name: 'Reducción de Desigualdades', color: '#DD1367' },
    { num: 11, name: 'Ciudades Sostenibles',   color: '#FD9D24' },
    { num: 13, name: 'Acción por el Clima',    color: '#3F7E44' }
  ]
};

/* ── PATRONES DE FLUJO POR HORA (24h) ────────────────
   Datos sintéticos basados en patrones reales CDMX
   (ENIGH 2022, Encuesta Origen-Destino Zona Metropolitana 2017)
   Valores normalizados 0-100 (% del pico) */
const FLOW_PATTERNS = {
  weekday: {
    pedestrian:  [5, 4, 3, 3, 4, 8, 25, 65, 92, 78, 55, 50, 60, 65, 58, 62, 75, 88, 82, 60, 42, 28, 18, 10],
    vehicular:   [8, 5, 4, 4, 6, 18, 55, 88, 95, 72, 60, 58, 65, 70, 68, 75, 88, 92, 85, 72, 55, 38, 22, 14],
    metro:       [0, 0, 0, 2, 8, 28, 75, 98, 88, 62, 48, 52, 58, 55, 50, 60, 78, 92, 80, 55, 32, 18, 8, 2],
    ecobici:     [2, 1, 1, 1, 2, 5, 22, 58, 68, 45, 35, 40, 55, 52, 38, 45, 62, 75, 65, 42, 22, 12, 6, 3]
  },
  matchday: {
    // Día de partido en Estadio Azteca (kickoff 18:00)
    pedestrian:  [5, 4, 3, 3, 4, 8, 25, 60, 80, 70, 55, 60, 70, 75, 80, 92, 100, 95, 70, 80, 95, 60, 30, 15],
    vehicular:   [8, 5, 4, 4, 6, 18, 55, 80, 92, 75, 65, 70, 80, 88, 95, 100, 92, 70, 65, 85, 95, 60, 35, 18],
    metro:       [0, 0, 0, 2, 8, 28, 70, 90, 85, 65, 55, 60, 70, 78, 88, 100, 95, 60, 50, 80, 92, 55, 22, 5],
    ecobici:     [2, 1, 1, 1, 2, 5, 22, 55, 65, 50, 42, 48, 60, 68, 78, 88, 92, 70, 55, 75, 80, 35, 15, 4]
  }
};

/* ── CALIDAD DEL AIRE (AQI por zona) ─────────────────
   Escala IMECA México · valores típicos hora pico */
const AIR_QUALITY = [
  { zone: 'Centro',     aqi: 78, status: 'Aceptable',     pm25: 28 },
  { zone: 'Norte',      aqi: 92, status: 'Mala',          pm25: 42 },
  { zone: 'Sur',        aqi: 64, status: 'Buena',         pm25: 18 },
  { zone: 'Oriente',    aqi: 88, status: 'Aceptable',     pm25: 36 },
  { zone: 'Poniente',   aqi: 71, status: 'Aceptable',     pm25: 24 },
  { zone: 'Tlalpan',    aqi: 58, status: 'Buena',         pm25: 15 }
];

/* ── HELPERS ─────────────────────────────────────────── */

/** Calcula CO₂ emitido para una ruta (kg) */
function calculateCO2(distanceKm, mode) {
  const factor = SOMUS_DATA.emissionFactors[mode];
  if (!factor) return 0;
  return +(factor.co2 * distanceKm).toFixed(3);
}

/** CO₂ ahorrado vs. ir en auto solo */
function calculateSaving(distanceKm, mode) {
  const carCO2 = SOMUS_DATA.emissionFactors.car_gasoline.co2 * distanceKm;
  const modeCO2 = SOMUS_DATA.emissionFactors[mode].co2 * distanceKm;
  return +(carCO2 - modeCO2).toFixed(3);
}

/** Distancia haversine entre dos puntos (km) */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/** Hora "demo" — usa hora real, pero si es madrugada (0-6) fuerza hora pico
 *  para que el dashboard nunca se vea vacío */
function getDemoHour() {
  if (DEMO_HOUR !== null) return DEMO_HOUR;
  const h = new Date().getHours();
  if (h < 7) return 18;       // madrugada → hora pico vespertina
  if (h >= 23) return 18;     // noche → hora pico vespertina
  return h;
}

/** Obtiene el patrón de flujo para hora actual */
function getCurrentFlow(type = 'pedestrian', isMatchday = false) {
  const hour = getDemoHour();
  const pattern = isMatchday ? FLOW_PATTERNS.matchday : FLOW_PATTERNS.weekday;
  return pattern[type][hour];
}

/** Genera puntos para heatmap basados en patrón actual */
function generateHeatmapPoints(centerLat = 19.40, centerLng = -99.16, density = 'pedestrian') {
  const intensity = getCurrentFlow(density) / 100;
  const points = [];
  const hotspots = [
    [19.4326, -99.1332, 1.0],   // Centro Histórico
    [19.4338, -99.1925, 0.8],   // Polanco
    [19.4232, -99.1675, 0.9],   // Reforma
    [19.4032, -99.1623, 0.6],   // Roma
    [19.3500, -99.1622, 0.5],   // Coyoacán
    [19.3029, -99.1505, 0.95],  // Estadio Azteca
    [19.3274, -99.1736, 0.7],   // CU
    [19.4257, -99.1898, 0.85]   // Auditorio
  ];

  hotspots.forEach(([hLat, hLng, hWeight]) => {
    const numPoints = Math.floor(40 * hWeight * intensity);
    for (let i = 0; i < numPoints; i++) {
      const r = 0.012 * Math.random();
      const angle = Math.random() * Math.PI * 2;
      points.push([
        hLat + Math.cos(angle) * r,
        hLng + Math.sin(angle) * r,
        hWeight * intensity * (0.6 + Math.random() * 0.4)
      ]);
    }
  });
  return points;
}

/** Formatea número con separadores */
function formatNum(n, decimals = 0) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Anima un número de 0 a target */
function animateNumber(el, target, duration = 1200, decimals = 0, suffix = '') {
  const start = performance.now();
  const from = parseFloat(el.dataset.current || 0);
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = from + (target - from) * eased;
    el.textContent = formatNum(val, decimals) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else el.dataset.current = target;
  }
  requestAnimationFrame(step);
}

/** Toast notifications */
function showToast(msg, duration = 3000) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ── ECOBICI: intento de fetch real, fallback a datos locales ─ */
async function fetchEcobiciLive() {
  try {
    const r = await fetch('https://gbfs.mex.lyftbikes.com/gbfs/es/station_status.json', {
      mode: 'cors'
    });
    if (!r.ok) throw new Error('GBFS down');
    const data = await r.json();
    return { source: 'live', data: data.data.stations };
  } catch (e) {
    return { source: 'snapshot', data: SOMUS_DATA.ecobiciStations };
  }
}

/* ═══════════════════════════════════════════════════════
   APIs REALES · Geocoding · Routing · POIs
   ═══════════════════════════════════════════════════════ */

let _placesPromise = null;

/** Carga el catálogo de lugares con rutas pre-calculadas */
function loadPlaces() {
  if (!_placesPromise) {
    _placesPromise = fetch(`${ROUTES_DIR}/index.json`)
      .then(r => { if (!r.ok) throw new Error(`index.json ${r.status}`); return r.json(); })
      .then(idx => idx.places);
  }
  return _placesPromise;
}

/** Resuelve un texto a un lugar del catálogo curado (sin red externa).
 *  Devuelve null si no es uno de los lugares disponibles en la demo. */
async function geocode(query) {
  const key = query.trim().toLowerCase();
  const places = await loadPlaces();
  const hit = places.find(p => p.id === key || p.name.toLowerCase() === key || p.aliases.includes(key));
  return hit ? { id: hit.id, lat: hit.lat, lng: hit.lng, name: hit.name } : null;
}

const ROUTE_MODES = { 'driving-car': 'driving', 'cycling-regular': 'cycling', 'foot-walking': 'walking' };

/** Ruta pre-calculada (OSRM) entre dos lugares del catálogo.
 *  from, to: ids de lugar · profile: 'driving-car' | 'cycling-regular' | 'foot-walking'
 *  return: { coords: [[lat,lng],...], distance_m, duration_s, profile } o null si no existe */
async function getRoute(from, to, profile = 'driving-car') {
  const mode = ROUTE_MODES[profile];
  if (!from || !to || !mode) return null;
  try {
    const r = await fetch(`${ROUTES_DIR}/${from}__${to}__${mode}.geojson`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const feat = (await r.json()).features[0];
    return {
      // GeoJSON [lng,lat] → [lat,lng] para Leaflet
      coords: feat.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance_m: feat.properties.distance_m,
      duration_s: feat.properties.duration_s,
      profile: profile
    };
  } catch (e) {
    console.warn('Route not available:', from, to, mode, e);
    return null;
  }
}

/** Obtiene la estación de Metro más cercana a un punto */
function nearestMetro(lat, lng) {
  let min = Infinity, best = SOMUS_DATA.metroNodes[0];
  SOMUS_DATA.metroNodes.forEach(n => {
    const d = haversine(lat, lng, n.lat, n.lng);
    if (d < min) { min = d; best = n; }
  });
  return { ...best, distance_km: min };
}

/** Obtiene la estación ECOBICI más cercana con bicis disponibles */
function nearestEcobici(lat, lng, needsBikes = true) {
  let min = Infinity, best = null;
  SOMUS_DATA.ecobiciStations.forEach(s => {
    if (needsBikes && s.bikes < 2) return;
    if (!needsBikes && s.docks < 2) return;
    const d = haversine(lat, lng, s.lat, s.lng);
    if (d < min) { min = d; best = s; }
  });
  return best ? { ...best, distance_km: min } : SOMUS_DATA.ecobiciStations[0];
}

/** POIs reales cerca de la ruta usando Overpass */
async function getPOIsAlongRoute(routeCoords, maxRadius = 400) {
  if (!routeCoords || routeCoords.length === 0) return [];

  // Sample 4-6 puntos a lo largo de la ruta
  const n = Math.min(5, routeCoords.length);
  const samples = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor((i / (n - 1)) * (routeCoords.length - 1));
    samples.push(routeCoords[idx]);
  }

  // Construir query Overpass
  const amenities = 'fuel|restaurant|cafe|hospital|parking|toilets|fast_food|pharmacy';
  const queryParts = samples.map(([lat, lng]) =>
    `node["amenity"~"${amenities}"](around:${maxRadius},${lat},${lng});`
  ).join('');
  const query = `[out:json][timeout:20];(${queryParts});out body 40;`;

  try {
    const r = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query)
    });
    if (!r.ok) throw new Error('Overpass error');
    const data = await r.json();
    if (!data.elements || data.elements.length === 0) return [];

    // Mapear a estructura UI + dedupe + nearest distance to route
    const seen = new Set();
    const pois = [];
    data.elements.forEach(el => {
      if (!el.tags || !el.tags.amenity || seen.has(el.id)) return;
      seen.add(el.id);

      // Distancia mínima de este POI a la ruta
      let minDist = Infinity;
      routeCoords.forEach(([lat, lng]) => {
        const d = haversine(el.lat, el.lon, lat, lng);
        if (d < minDist) minDist = d;
      });

      pois.push({
        id: el.id,
        amenity: el.tags.amenity,
        name: el.tags.name || amenityLabel(el.tags.amenity),
        lat: el.lat,
        lng: el.lon,
        distance_km: minDist,
        meta: amenityLabel(el.tags.amenity),
        icon: amenityIcon(el.tags.amenity),
        color: amenityColor(el.tags.amenity)
      });
    });

    // Ordenar por distancia y limitar a 8
    pois.sort((a, b) => a.distance_km - b.distance_km);
    return pois.slice(0, 8);
  } catch (e) {
    console.warn('Overpass error, fallback:', e);
    return null; // null = caller usa fallback estático
  }
}

function amenityIcon(a) {
  return ({
    fuel: '⛽', restaurant: '🍔', cafe: '☕', hospital: '🏥',
    parking: '🅿', toilets: '🚻', fast_food: '🍟', pharmacy: '💊'
  })[a] || '📍';
}
function amenityLabel(a) {
  return ({
    fuel: 'Gasolinera', restaurant: 'Restaurante', cafe: 'Cafetería',
    hospital: 'Hospital · Salud', parking: 'Estacionamiento', toilets: 'Sanitarios',
    fast_food: 'Comida rápida', pharmacy: 'Farmacia'
  })[a] || 'Punto de interés';
}
function amenityColor(a) {
  return ({
    fuel: '#3a4540', restaurant: '#e8a020', cafe: '#4a7c59',
    hospital: '#c44b2b', parking: '#2d5a3d', toilets: '#fcc30b',
    fast_food: '#e8654b', pharmacy: '#dd1367'
  })[a] || '#4a7c59';
}

/* Export para uso cross-file */
if (typeof window !== 'undefined') {
  window.SOMUS_DATA = SOMUS_DATA;
  window.FLOW_PATTERNS = FLOW_PATTERNS;
  window.AIR_QUALITY = AIR_QUALITY;
  window.calculateCO2 = calculateCO2;
  window.calculateSaving = calculateSaving;
  window.haversine = haversine;
  window.getDemoHour = getDemoHour;
  window.getCurrentFlow = getCurrentFlow;
  window.generateHeatmapPoints = generateHeatmapPoints;
  window.formatNum = formatNum;
  window.animateNumber = animateNumber;
  window.showToast = showToast;
  window.fetchEcobiciLive = fetchEcobiciLive;
  window.geocode = geocode;
  window.loadPlaces = loadPlaces;
  window.getRoute = getRoute;
  window.nearestMetro = nearestMetro;
  window.nearestEcobici = nearestEcobici;
  window.getPOIsAlongRoute = getPOIsAlongRoute;
}
