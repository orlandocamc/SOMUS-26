/* =====================================================
   SOMUS-26 · control.js
   Centro de Control de Movilidad
   · Reloj live
   · Mapa heatmap + capas (peatonal/vehicular/metro)
   · KPIs animados + sparklines
   · Cámaras CCTV simuladas con bounding boxes
   · Lista de alertas
   · Calidad del aire (SIMAT)
   · Operations log (terminal)
   ===================================================== */

let mapCtrl;
let heatLayerCtrl;
let currentLayer = 'ped';
const sparkCharts = {};

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMapControl();
  initLayerToggles();
  initKPIs();
  initSparklines();
  initCameras();
  renderAlerts();
  renderAir();
  initTerminal();
  // Updates periódicos
  setInterval(updateLiveKPIs, 4000);
  setInterval(updateMapStats, 6000);
});

/* ═════ CLOCK ═════ */
function initClock() {
  const el = document.getElementById('ctrl-clock');
  function tick() {
    const d = new Date();
    el.textContent = d.toLocaleTimeString('es-MX', { hour12: false });
  }
  tick();
  setInterval(tick, 1000);
}

/* ═════ MAPA OPERACIONAL ═════ */
function initMapControl() {
  mapCtrl = L.map('map-control', {
    center: [19.405, -99.165],
    zoom: 12,
    zoomControl: false,
    attributionControl: false
  });

  // Tiles oscuros
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapCtrl);

  L.control.zoom({ position: 'bottomright' }).addTo(mapCtrl);

  refreshHeatmap('pedestrian');

  // Marcadores de estadios + nodos críticos
  L.marker([19.3029, -99.1505], {
    icon: L.divIcon({
      className: '',
      html: `<div style="background:#c44b2b;color:#f5f0e8;font-family:'Archivo Black';font-size:0.55rem;letter-spacing:0.1em;padding:4px 8px;border-radius:6px;border:2px solid rgba(255,255,255,0.4);box-shadow:0 4px 12px rgba(0,0,0,0.5);transform:translate(-50%,-100%);white-space:nowrap;">⚽ AZTECA</div>`,
      iconSize: [80, 30],
      iconAnchor: [40, 30]
    })
  }).addTo(mapCtrl);

  // Algunos nodos de cámara simulados sobre el mapa
  const camNodes = [
    [19.4326, -99.1332], [19.4338, -99.1925], [19.4232, -99.1675],
    [19.4032, -99.1623], [19.3500, -99.1622], [19.3274, -99.1736],
    [19.3825, -99.1741], [19.4257, -99.1898], [19.3929, -99.1547]
  ];
  camNodes.forEach(([lat, lng]) => {
    L.circleMarker([lat, lng], {
      radius: 4,
      color: '#b8e986',
      weight: 2,
      fillColor: '#b8e986',
      fillOpacity: 0.4
    }).addTo(mapCtrl);
  });
}

function refreshHeatmap(type) {
  if (heatLayerCtrl) mapCtrl.removeLayer(heatLayerCtrl);
  const points = generateHeatmapPoints(19.40, -99.16, type);
  heatLayerCtrl = L.heatLayer(points, {
    radius: 30,
    blur: 26,
    maxZoom: 17,
    minOpacity: 0.5,
    gradient: {
      0.2: '#b8e986',
      0.4: '#e8a020',
      0.7: '#e8654b',
      1.0: '#c44b2b'
    }
  }).addTo(mapCtrl);
}

function initLayerToggles() {
  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLayer = btn.dataset.layer;
      const map = { ped: 'pedestrian', veh: 'vehicular', metro: 'metro' };
      refreshHeatmap(map[currentLayer]);
      updateMapStats();
    });
  });
}

function updateMapStats() {
  const map = { ped: 'pedestrian', veh: 'vehicular', metro: 'metro' };
  const flow = getCurrentFlow(map[currentLayer]);
  const peakEl = document.getElementById('ms-peak');
  const peopleEl = document.getElementById('ms-people');
  if (peakEl) peakEl.textContent = `${flow}%`;
  if (peopleEl) {
    const baseEstimate = currentLayer === 'metro' ? 4_800_000 : currentLayer === 'veh' ? 5_400_000 : 8_200_000;
    const estimate = Math.round(baseEstimate * flow / 100);
    peopleEl.textContent = formatNum(estimate);
  }
}

/* ═════ KPIs ANIMADOS ═════ */
function initKPIs() {
  // Valores iniciales basados en hora actual
  const flowPed = getCurrentFlow('pedestrian');
  const flowVeh = getCurrentFlow('vehicular');
  const flowMet = getCurrentFlow('metro');
  const flowEco = getCurrentFlow('ecobici');

  animateNumber(document.getElementById('k-vehicles'), Math.round(flowVeh * 38), 1400);
  animateNumber(document.getElementById('k-peds'),    Math.round(flowPed * 142), 1400);
  document.getElementById('k-metro').textContent = `${flowMet}%`;
  animateNumber(document.getElementById('k-ecobici'), 1284, 1400);
  animateNumber(document.getElementById('k-co2'),    532, 1400, 0, ' kg');
  animateNumber(document.getElementById('k-aqi'),    74, 1400);

  updateMapStats();
}

function updateLiveKPIs() {
  // Pequeñas variaciones para sensación de "vivo"
  const flowPed = getCurrentFlow('pedestrian');
  const flowVeh = getCurrentFlow('vehicular');
  const flowMet = getCurrentFlow('metro');

  const veh = Math.round(flowVeh * 38 * (0.95 + Math.random() * 0.1));
  const peds = Math.round(flowPed * 142 * (0.95 + Math.random() * 0.1));

  animateNumber(document.getElementById('k-vehicles'), veh, 800);
  animateNumber(document.getElementById('k-peds'), peds, 800);
  document.getElementById('k-metro').textContent = `${Math.round(flowMet * (0.97 + Math.random() * 0.06))}%`;
  animateNumber(document.getElementById('k-ecobici'), Math.round(1284 * (0.97 + Math.random() * 0.06)), 800);
  animateNumber(document.getElementById('k-co2'), Math.round(532 + Math.random() * 18), 800, 0, ' kg');
  animateNumber(document.getElementById('k-aqi'), Math.round(74 + (Math.random() - 0.5) * 6), 800);

  // Detecciones tick
  const detEl = document.getElementById('cs-detections');
  if (detEl) {
    const newVal = Math.round(14380 + (Math.random() - 0.5) * 600);
    animateNumber(detEl, newVal, 600);
  }
  const latEl = document.getElementById('cs-latency');
  if (latEl) latEl.textContent = `${Math.round(82 + Math.random() * 18)} ms`;
}

/* ═════ SPARKLINES ═════ */
function initSparklines() {
  document.querySelectorAll('.spark').forEach(canvas => {
    const key = canvas.dataset.key;
    const data = generateSparkData(key);
    const colors = {
      vehicles: '#e8a020',
      peds:     '#b8e986',
      metro:    '#e8654b',
      ecobici:  '#6ba8b8',
      co2:      '#b8e986',
      aqi:      '#e8a020'
    };
    const color = colors[key] || '#b8e986';

    sparkCharts[key] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data: data,
          borderColor: color,
          borderWidth: 2,
          backgroundColor: hexToRgba(color, 0.18),
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: false }
        },
        elements: { line: { borderJoinStyle: 'round' } }
      }
    });
  });
}

function generateSparkData(key) {
  const hour = new Date().getHours();
  const isMatchday = false;
  let pattern;
  if (key === 'vehicles')      pattern = (isMatchday ? FLOW_PATTERNS.matchday : FLOW_PATTERNS.weekday).vehicular;
  else if (key === 'peds')     pattern = (isMatchday ? FLOW_PATTERNS.matchday : FLOW_PATTERNS.weekday).pedestrian;
  else if (key === 'metro')    pattern = (isMatchday ? FLOW_PATTERNS.matchday : FLOW_PATTERNS.weekday).metro;
  else if (key === 'ecobici')  pattern = (isMatchday ? FLOW_PATTERNS.matchday : FLOW_PATTERNS.weekday).ecobici;
  else if (key === 'co2')      pattern = (isMatchday ? FLOW_PATTERNS.matchday : FLOW_PATTERNS.weekday).vehicular.map(v => 100 - v); // inverso
  else if (key === 'aqi')      pattern = (isMatchday ? FLOW_PATTERNS.matchday : FLOW_PATTERNS.weekday).vehicular;
  else pattern = [50, 55, 60, 58, 62, 65, 68, 70, 72, 70, 68];

  // Tomar últimas 12 horas (ventana móvil)
  const start = Math.max(0, hour - 11);
  return pattern.slice(start, hour + 1).map(v => v + (Math.random() - 0.5) * 6);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ═════ CÁMARAS CCTV · VIDEO REAL PROCESADO POR YOLO ═════ */
function initCameras() {
  const grid = document.getElementById('cams-grid');
  // 4 cámaras, 3 videos reales (cam04 reusa cam02 con metadata distinta)
  const cams = [
    { id: 'CAM-0521', loc: 'Estadio Azteca · Acceso A',  src: 'assets/video/cam01-final.mp4', peds: 142, cars: 6,  bikes: 9 },
    { id: 'CAM-0188', loc: 'Calzada Tlalpan · Bandera',  src: 'assets/video/cam02-final.mp4', peds: 8,   cars: 38, bikes: 1 },
    { id: 'CAM-0042', loc: 'Insurgentes Sur · Eje 7',    src: 'assets/video/cam03-final.mp4', peds: 23,  cars: 12, bikes: 4 },
    { id: 'CAM-0317', loc: 'Periférico Sur · Cuemanco',  src: 'assets/video/cam02-final.mp4', peds: 2,   cars: 47, bikes: 0 }
  ];

  grid.innerHTML = cams.map((cam, i) => `
    <div class="cam-feed" title="${cam.loc}">
      <video class="cam-feed-video" autoplay loop muted playsinline preload="auto"
             src="${cam.src}"
             style="animation-delay: ${i * 0.5}s;"></video>
      <div class="cam-meta">${cam.id}</div>
      <div class="cam-rec"><span class="cam-rec-dot"></span> REC · 30FPS</div>
      <div class="cam-stats">
        <span><span class="cam-stat-key">PED</span>${cam.peds}</span>
        <span><span class="cam-stat-key">VEH</span>${cam.cars}</span>
        <span><span class="cam-stat-key">BIKE</span>${cam.bikes}</span>
        <span style="color: var(--sage-bright);">YOLOv8 · ${cam.loc.split('·')[0].trim()}</span>
      </div>
    </div>
  `).join('');

  // Forzar play (algunos navegadores bloquean autoplay sin interacción)
  document.querySelectorAll('.cam-feed-video').forEach(v => {
    v.play().catch(() => {/* autoplay blocked, no-op */});
    // Desincronizar los videos (que cada uno empiece en momento aleatorio)
    v.addEventListener('loadedmetadata', () => {
      if (v.duration && !isNaN(v.duration)) {
        v.currentTime = Math.random() * Math.min(v.duration, 3);
      }
    });
  });
}

/* ═════ ALERTAS ═════ */
function renderAlerts() {
  const list = document.getElementById('alerts-list');
  list.innerHTML = SOMUS_DATA.alerts.map(a => `
    <div class="alert-row ${a.sev}">
      <div class="alert-bar"></div>
      <div class="alert-body">
        <div class="alert-meta">
          <span class="alert-time">${a.time}</span>
          <span class="alert-mode-tag mode-${a.mode}">${a.mode.toUpperCase()}</span>
        </div>
        <div class="alert-loc">${a.loc}</div>
        <div class="alert-msg">${a.msg}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('alerts-count').textContent = `${SOMUS_DATA.alerts.length} ACTIVAS`;
}

/* ═════ AIR QUALITY ═════ */
function renderAir() {
  const list = document.getElementById('air-list');
  list.innerHTML = AIR_QUALITY.map(z => {
    const pct = Math.min(100, (z.pm25 / 60) * 100);
    let cls = 'good', icon = '✓', color = '#b8e986';
    if (z.pm25 > 35) { cls = 'bad'; icon = '!'; color = '#e8654b'; }
    else if (z.pm25 > 22) { cls = 'ok'; icon = '~'; color = '#e8a020'; }

    return `
      <div class="air-row">
        <span class="air-zone">${z.zone}</span>
        <div class="air-bar"><div class="air-bar-fill" style="width:${pct}%;background:${color};"></div></div>
        <span class="air-pm">${z.pm25} µg</span>
        <div class="air-icon ${cls}">${icon}</div>
      </div>
    `;
  }).join('');
}

/* ═════ TERMINAL OPERATIONS LOG ═════ */
function initTerminal() {
  const term = document.getElementById('terminal');
  const logs = [
    { tag: 'ok',   msg: 'YOLOv8 inferencia <strong>OK</strong> · 2412 nodos · 30 FPS' },
    { tag: 'info', msg: 'Heatmap rebuilt · <strong>14 380</strong> detecciones agregadas' },
    { tag: 'info', msg: 'ECOBICI GBFS sync · 480 estaciones · <strong>2 184</strong> bicis' },
    { tag: 'warn', msg: 'Saturación L3 Centro Médico → <strong>87%</strong> aforo' },
    { tag: 'ok',   msg: 'Ruta multimodal recalculada · 12 487 usuarios activos' },
    { tag: 'info', msg: 'SIMAT · PM2.5 promedio <strong>27 µg/m³</strong> (Aceptable)' },
    { tag: 'err',  msg: 'CAM-0042 · pérdida momentánea (recuperada en 1.4s)' },
    { tag: 'ok',   msg: 'Convoyes Metrobús L2 · headway <strong>3.2 min</strong>' },
    { tag: 'info', msg: 'Predicción ML · pico esperado <strong>18:14</strong>' },
    { tag: 'ok',   msg: 'CO₂ acumulado evitado hoy: <strong>532 kg</strong>' },
    { tag: 'warn', msg: 'Incidente vial Calzada Tlalpan · ETA 8 min' },
    { tag: 'info', msg: 'Convenio C5 · 2412 cámaras procesando · 99.97% uptime' }
  ];

  let i = 0;
  function pushLog() {
    const log = logs[i % logs.length];
    const t = new Date().toLocaleTimeString('es-MX', { hour12: false });
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = `
      <span class="term-time">${t}</span>
      <span class="term-tag ${log.tag}">${log.tag.toUpperCase()}</span>
      <span class="term-msg">${log.msg}</span>
    `;
    term.appendChild(line);
    if (term.children.length > 14) term.removeChild(term.children[0]);
    term.scrollTop = term.scrollHeight;
    i++;
  }

  // Llenar inicialmente con 6 logs históricos
  for (let j = 0; j < 6; j++) pushLog();
  // Y luego cada 2.5s un log nuevo
  setInterval(pushLog, 2500);
}
