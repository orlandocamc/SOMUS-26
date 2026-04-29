/* =====================================================
   SOMUS-26 · main.js
   Lógica de la vista del ciudadano:
   · Mapa hero (Leaflet + heatmap + ECOBICI + Metro)
   · Optimizador de rutas multimodal con CO₂ real
   · Gráfica comparativa de emisiones
   · Lista de factores
   · POIs con OpenStreetMap (Overpass)
   · Ticker en vivo
   ===================================================== */

let mapHero;
let layerHeatmap, layerEcobici, layerMetro;
let chartEmissions;
let routesData = [];
let selectedRouteId = null;

// ── Tile layer minimal (CartoDB Positron-like) ─────────
const TILE_CARTO = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIB = '© OpenStreetMap, © CARTO';

document.addEventListener('DOMContentLoaded', () => {
  initHeroMap();
  initTicker();
  initMapToggles();
  renderFactorList();
  renderODS();
  renderPOIs();
  // Cálculo inicial al cargar
  calcularRutas();
});

/* ═════ MAPA HERO ═════ */
function initHeroMap() {
  mapHero = L.map('map-hero', {
    center: [19.405, -99.165],
    zoom: 12,
    zoomControl: false,
    attributionControl: false
  });
  L.tileLayer(TILE_CARTO, { attribution: TILE_ATTRIB, subdomains: 'abcd', maxZoom: 19 }).addTo(mapHero);

  L.control.zoom({ position: 'bottomright' }).addTo(mapHero);

  // Capa heatmap (default)
  const heatPoints = generateHeatmapPoints();
  layerHeatmap = L.heatLayer(heatPoints, {
    radius: 32,
    blur: 28,
    maxZoom: 17,
    minOpacity: 0.45,
    gradient: {
      0.2: '#b8e986',
      0.4: '#e8a020',
      0.7: '#e8654b',
      1.0: '#c44b2b'
    }
  }).addTo(mapHero);

  // Capa ECOBICI
  layerEcobici = L.layerGroup();
  SOMUS_DATA.ecobiciStations.forEach(st => {
    const ratio = st.bikes / st.capacity;
    const color = ratio > 0.6 ? '#4a7c59' : ratio > 0.25 ? '#e8a020' : '#c44b2b';
    const m = L.circleMarker([st.lat, st.lng], {
      radius: 7,
      color: color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.6
    });
    m.bindPopup(`
      <strong style="font-family:'Archivo Black';">${st.name}</strong><br/>
      <span style="font-family:'Space Mono';font-size:0.7rem;letter-spacing:1px;text-transform:uppercase;">
        🚲 ${st.bikes} bicis · 🅿 ${st.docks} libres
      </span>
    `);
    layerEcobici.addLayer(m);
  });

  // Capa Metro
  layerMetro = L.layerGroup();
  SOMUS_DATA.metroNodes.forEach(n => {
    const m = L.marker([n.lat, n.lng], {
      icon: L.divIcon({
        className: 'metro-icon',
        html: `<div style="background:#2d5a3d;color:#f5f0e8;font-family:'Archivo Black';font-size:0.65rem;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);">M</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    });
    m.bindPopup(`<strong style="font-family:'Archivo Black';">${n.name}</strong><br/><span style="font-family:'Space Mono';font-size:0.7rem;">Líneas: ${n.lines.join(', ')}</span>`);
    layerMetro.addLayer(m);
  });

  // Marcador Estadio Azteca destacado
  L.marker([19.3029, -99.1505], {
    icon: L.divIcon({
      className: 'stadium-icon',
      html: `<div style="background:#c44b2b;color:#f5f0e8;font-family:'Archivo Black';font-size:0.55rem;letter-spacing:1px;padding:4px 8px;border-radius:6px;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);transform:translate(-50%,-100%);white-space:nowrap;">⚽ AZTECA</div>`,
      iconSize: [80, 30],
      iconAnchor: [40, 30]
    })
  }).addTo(mapHero).bindPopup(`<strong style="font-family:'Archivo Black';">Estadio Azteca</strong><br/>87,000 personas · 5 partidos Mundial`);
}

function initMapToggles() {
  document.querySelectorAll('.map-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const layer = btn.dataset.layer;
      btn.classList.toggle('active');
      const isActive = btn.classList.contains('active');

      if (layer === 'heatmap') {
        if (isActive) mapHero.addLayer(layerHeatmap);
        else mapHero.removeLayer(layerHeatmap);
      }
      if (layer === 'ecobici') {
        if (isActive) mapHero.addLayer(layerEcobici);
        else mapHero.removeLayer(layerEcobici);
      }
      if (layer === 'metro') {
        if (isActive) mapHero.addLayer(layerMetro);
        else mapHero.removeLayer(layerMetro);
      }
    });
  });
}

/* ═════ TICKER LIVE ═════ */
function initTicker() {
  const now = new Date().getHours();
  const items = [
    `🚲 <strong>${SOMUS_DATA.ecobiciStations.reduce((a,s)=>a+s.bikes,0)}</strong> ECOBICI disponibles`,
    `🚇 Metro · ocupación <strong>${getCurrentFlow('metro')}%</strong>`,
    `🚗 Tráfico vehicular: <strong>${getCurrentFlow('vehicular')}%</strong> del pico`,
    `🌬 PM2.5 promedio CDMX: <strong>27 µg/m³</strong>`,
    `🌳 CO₂ evitado hoy: <strong>${(getCurrentFlow('metro')*0.8).toFixed(0)} kg</strong>`,
    `⚡ Trolebús: factor <strong>0.015 kgCO₂/km</strong>`,
    `📍 Cámaras procesando: <strong>2 412</strong> nodos`,
    `🏟 Próximo partido Azteca: <strong>en 3 días</strong>`
  ];
  // Duplicar para loop infinito
  const html = [...items, ...items].map(i => `<span class="ticker-item">${i}</span>`).join('');
  document.getElementById('ticker').innerHTML = html;
}

/* ═════ OPTIMIZADOR DE RUTAS ═════ */
function calcularRutas() {
  const origin = document.getElementById('i-origin').value || 'Polanco';
  const dest = document.getElementById('i-dest').value || 'Estadio Azteca';
  const time = document.getElementById('i-time').value;
  const priority = document.getElementById('i-priority').value;

  // Distancia estimada (ej: Polanco -> Azteca son ~21km)
  let distance = 21.0;
  // Heurística simple: si origen contiene "Centro" usar 18km, "Polanco" 21km, default 15km
  const o = origin.toLowerCase();
  if (o.includes('centro')) distance = 18;
  else if (o.includes('polanco')) distance = 21;
  else if (o.includes('roma')) distance = 17;
  else if (o.includes('coyoacán') || o.includes('coyoacan')) distance = 8;
  else if (o.includes('tlalpan')) distance = 6;
  else distance = 15;

  // Generar 3 rutas
  routesData = [
    {
      id: 'r1',
      name: 'Multimodal Verde',
      tag: 'Recomendada',
      modes: [
        { mode: 'walk',    label: 'A pie',    icon: '🚶', km: 0.6 },
        { mode: 'metro',   label: 'Metro',    icon: '🚇', km: distance * 0.55 },
        { mode: 'metrobus',label: 'Metrobús', icon: '🚍', km: distance * 0.30 },
        { mode: 'walk',    label: 'A pie',    icon: '🚶', km: 0.5 }
      ],
      time: Math.round(distance * 2.4 + 8),
      cost: 12,
      transfers: 2,
      reliability: 92
    },
    {
      id: 'r2',
      name: 'ECOBICI + Metro',
      tag: 'Más activa',
      modes: [
        { mode: 'walk',   label: 'A pie',    icon: '🚶', km: 0.3 },
        { mode: 'ecobici',label: 'ECOBICI',  icon: '🚲', km: distance * 0.35 },
        { mode: 'metro',  label: 'Metro',    icon: '🚇', km: distance * 0.50 },
        { mode: 'walk',   label: 'A pie',    icon: '🚶', km: 0.7 }
      ],
      time: Math.round(distance * 2.8 + 10),
      cost: 9,
      transfers: 2,
      reliability: 78
    },
    {
      id: 'r3',
      name: 'Auto Compartido',
      tag: 'Más rápida',
      modes: [
        { mode: 'car_pooled', label: 'Auto', icon: '🚙', km: distance }
      ],
      time: Math.round(distance * 1.8 + 5),
      cost: 95,
      transfers: 0,
      reliability: 65
    }
  ];

  // Calcular CO2 total para cada ruta
  routesData.forEach(r => {
    r.co2 = r.modes.reduce((acc, m) => acc + calculateCO2(m.km, m.mode), 0);
    r.distance = r.modes.reduce((acc, m) => acc + m.km, 0);
    r.saving = +(SOMUS_DATA.emissionFactors.car_gasoline.co2 * r.distance - r.co2).toFixed(2);
  });

  // Reordenar según prioridad
  if (priority === 'fast') routesData.sort((a, b) => a.time - b.time);
  else if (priority === 'green') routesData.sort((a, b) => a.co2 - b.co2);
  else if (priority === 'cheap') routesData.sort((a, b) => a.cost - b.cost);
  else routesData.sort((a, b) => (a.time/60 + a.co2*5 + a.cost/30) - (b.time/60 + b.co2*5 + b.cost/30));

  // Reasignar clases r1, r2, r3 según orden
  routesData = routesData.map((r, idx) => ({ ...r, _classIdx: idx + 1 }));

  renderRoutes();
  selectRoute(routesData[0].id);
}

function renderRoutes() {
  const board = document.getElementById('routes-board');
  board.innerHTML = routesData.map((r, idx) => {
    const colorClass = `r${idx + 1}`;
    const co2Pct = Math.min(100, (r.co2 / 4) * 100);
    const timePct = Math.min(100, (r.time / 90) * 100);

    return `
      <article class="card route-card ${colorClass}" data-id="${r.id}" onclick="selectRoute('${r.id}')">
        <div class="route-card-head">
          <div>
            <span class="kicker no-line">${r.tag}</span>
          </div>
          <div class="route-rank">0${idx + 1}</div>
        </div>

        <div class="route-modes">
          ${r.modes.map(m => `
            <span class="mode-chip">${m.icon}<span>${m.label}</span></span>
          `).join('')}
        </div>

        <h3 class="route-name">${r.name}</h3>

        <div class="route-stats">
          <div>
            <span class="route-stat-label">Tiempo</span>
            <span class="route-stat-val">${r.time} min</span>
          </div>
          <div>
            <span class="route-stat-label">CO₂</span>
            <span class="route-stat-val ${r.co2 < 1 ? 'green' : r.co2 < 2.5 ? 'amber' : 'red'}">${(r.co2 * 1000).toFixed(0)} g</span>
          </div>
          <div>
            <span class="route-stat-label">Costo</span>
            <span class="route-stat-val">$${r.cost}</span>
          </div>
        </div>

        <div class="route-bar-wrap">
          <div class="route-bar-label">
            <span>Huella ambiental</span>
            <span>${r.co2 < 1 ? 'BAJA' : r.co2 < 2.5 ? 'MEDIA' : 'ALTA'}</span>
          </div>
          <div class="route-bar"><div class="route-bar-fill" style="width: ${co2Pct}%;"></div></div>
        </div>
      </article>
    `;
  }).join('');
}

function selectRoute(id) {
  selectedRouteId = id;
  document.querySelectorAll('.route-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });

  const r = routesData.find(x => x.id === id);
  if (!r) return;

  // Render detalle
  const body = document.getElementById('route-detail-body');
  body.classList.remove('route-detail-empty');
  body.innerHTML = `
    <div class="detail-body">
      <div>
        <div class="kicker no-line" style="margin-bottom:14px;">Paso a paso</div>
        <div class="detail-steps">
          ${r.modes.map((m, i) => `
            <div class="step-row">
              <div class="step-marker">${i + 1}</div>
              <div>
                <div class="step-info-mode">${SOMUS_DATA.emissionFactors[m.mode].label}</div>
                <div class="step-info-text">${m.label} · ${m.km.toFixed(1)} km</div>
              </div>
              <div class="step-time">${Math.round(m.km * 3)} min</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="detail-stats">
        <div class="detail-stat">
          <span class="detail-stat-key">Distancia total</span>
          <span class="detail-stat-val">${r.distance.toFixed(1)} km</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-key">Tiempo estimado</span>
          <span class="detail-stat-val">${r.time} min</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-key">CO₂ emitido</span>
          <span class="detail-stat-val">${(r.co2 * 1000).toFixed(0)} g</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-key">CO₂ ahorrado vs auto</span>
          <span class="detail-stat-val" style="color: var(--forest);">${(r.saving * 1000).toFixed(0)} g</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-key">Transbordos</span>
          <span class="detail-stat-val">${r.transfers}</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-key">Confiabilidad</span>
          <span class="detail-stat-val">${r.reliability}%</span>
        </div>
      </div>
    </div>
  `;

  // Update emissions chart
  updateEmissionsChart(r);
  // Update emissions summary
  updateEmissionsSummary(r);
}

/* ═════ GRÁFICA EMISIONES ═════ */
function updateEmissionsChart(route) {
  const ctx = document.getElementById('chart-emissions').getContext('2d');

  const carBaseline = SOMUS_DATA.emissionFactors.car_gasoline.co2 * route.distance;
  const data = {
    labels: ['Auto solo', 'Auto compartido', 'Taxi', 'Metrobús', 'Esta ruta', 'ECOBICI'],
    datasets: [{
      label: 'kg CO₂',
      data: [
        +(SOMUS_DATA.emissionFactors.car_gasoline.co2 * route.distance).toFixed(3),
        +(SOMUS_DATA.emissionFactors.car_pooled.co2 * route.distance).toFixed(3),
        +(SOMUS_DATA.emissionFactors.taxi.co2 * route.distance).toFixed(3),
        +(SOMUS_DATA.emissionFactors.metrobus.co2 * route.distance).toFixed(3),
        +route.co2.toFixed(3),
        0
      ],
      backgroundColor: [
        '#c44b2b', '#e8654b', '#e8a020', '#6ba8b8', '#2d5a3d', '#b8e986'
      ],
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  if (chartEmissions) chartEmissions.destroy();
  chartEmissions = new Chart(ctx, {
    type: 'bar',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#2c3428',
          titleFont: { family: 'Archivo Black', size: 13 },
          bodyFont: { family: 'Space Mono', size: 12 },
          padding: 12,
          callbacks: {
            label: (ctx) => `${(ctx.parsed.y * 1000).toFixed(0)} g CO₂e`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { family: 'Space Mono', size: 10 },
            color: '#7a9a72',
            callback: v => `${(v*1000).toFixed(0)}g`
          },
          grid: { color: 'rgba(100, 150, 80, 0.1)' }
        },
        x: {
          ticks: {
            font: { family: 'Archivo', size: 11, weight: 600 },
            color: '#2c3428'
          },
          grid: { display: false }
        }
      }
    }
  });

  // Update title and badge
  document.getElementById('em-route-title').textContent = route.name;
  const reduction = ((1 - route.co2/carBaseline) * 100).toFixed(0);
  document.getElementById('em-route-badge').textContent = `−${reduction}% CO₂`;
}

function updateEmissionsSummary(route) {
  const savingG = (route.saving * 1000).toFixed(0);
  const trees = (route.saving * 22 * 4).toFixed(1); // 1 árbol absorbe ~22kg CO2/año
  const pm25 = (route.distance * 0.08).toFixed(2); // estimación PM2.5 evitada por km no-auto
  document.getElementById('em-saved').textContent = `${savingG} g`;
  document.getElementById('em-trees').textContent = trees;
  document.getElementById('em-pm25').textContent = `${pm25} mg`;
}

/* ═════ FACTOR LIST ═════ */
function renderFactorList() {
  const list = document.getElementById('factor-list');
  const factors = Object.entries(SOMUS_DATA.emissionFactors)
    .sort((a, b) => a[1].co2 - b[1].co2);
  list.innerHTML = factors.map(([key, f]) => `
    <div class="factor-row ${f.co2 === 0 ? 'zero' : ''}">
      <span class="factor-icon">${f.icon}</span>
      <span class="factor-name">${f.label}</span>
      <span class="factor-val">${f.co2.toFixed(3)}</span>
    </div>
  `).join('');
}

/* ═════ POIs ═════ */
function renderPOIs() {
  // Datos simulados pero con coordenadas reales cerca del Azteca
  const pois = [
    { icon: '🏪', name: 'Mercado de Coyoacán',     type: 'Comida tradicional', dist: 4.2, color: '#e8a020' },
    { icon: '🥑', name: 'La Casa del Pan Coyoacán',type: 'Vegano · Café',      dist: 3.8, color: '#4a7c59' },
    { icon: '🍔', name: 'El Califa de León',       type: 'Tacos al pastor',    dist: 2.1, color: '#c44b2b' },
    { icon: '🎨', name: 'Museo Frida Kahlo',       type: 'Cultura',            dist: 5.1, color: '#dd1367' },
    { icon: '🏥', name: 'Hospital General SR',     type: 'Emergencias 24h',    dist: 1.4, color: '#6ba8b8' },
    { icon: '⛽', name: 'Pemex Tlalpan',           type: 'Gasolinera',         dist: 0.9, color: '#3a4540' },
    { icon: '🅿', name: 'Estacionamiento Azteca',  type: 'Capacidad 5,200',    dist: 0.2, color: '#2d5a3d' },
    { icon: '🚻', name: 'Baños públicos',          type: 'Plaza de la Bandera',dist: 0.5, color: '#fcc30b' }
  ];
  const grid = document.getElementById('poi-grid');
  grid.innerHTML = pois.map(p => `
    <article class="poi-card" style="--accent-color: ${p.color};">
      <div class="poi-icon">${p.icon}</div>
      <h3 class="poi-name">${p.name}</h3>
      <div class="poi-meta">${p.type}</div>
      <span class="poi-distance">📍 ${p.dist} km</span>
    </article>
  `).join('');
}

/* ═════ ODS ═════ */
function renderODS() {
  const wrap = document.getElementById('ods-chips');
  wrap.innerHTML = SOMUS_DATA.sdgs.map(s => `
    <span class="ods-chip">
      <span class="ods-num" style="background: ${s.color};">${s.num}</span>
      ${s.name}
    </span>
  `).join('');
}
