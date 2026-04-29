/* =====================================================
   SOMUS-26 · pipeline.js
   - Demo escenas YOLO con bounding boxes animados
   - Métricas live
   - Fuentes de datos
   - ODS cards
   ===================================================== */

let currentScene = 0;
let detectionInterval;

// 4 escenas distintas para mostrar variedad de detección
const SCENES = [
  {
    name: 'Estadio Azteca · Acceso A',
    cam: 'CAM-0521',
    boxes: [
      { type: 'ped', x: 8,  y: 42, w: 8,  h: 18, label: 'PERSON · 0.96' },
      { type: 'ped', x: 18, y: 48, w: 7,  h: 16, label: 'PERSON · 0.94' },
      { type: 'ped', x: 27, y: 44, w: 8,  h: 19, label: 'PERSON · 0.97' },
      { type: 'ped', x: 38, y: 50, w: 7,  h: 15, label: 'PERSON · 0.91' },
      { type: 'ped', x: 48, y: 46, w: 8,  h: 18, label: 'PERSON · 0.95' },
      { type: 'ped', x: 58, y: 52, w: 7,  h: 14, label: 'PERSON · 0.89' },
      { type: 'ped', x: 68, y: 48, w: 8,  h: 17, label: 'PERSON · 0.93' },
      { type: 'ped', x: 78, y: 50, w: 7,  h: 15, label: 'PERSON · 0.92' },
      { type: 'bike',x: 88, y: 58, w: 9,  h: 12, label: 'BICYCLE · 0.87' }
    ],
    counts: { ped: 142, car: 6, bike: 9 }
  },
  {
    name: 'Insurgentes Sur · Eje 7',
    cam: 'CAM-0042',
    boxes: [
      { type: 'car', x: 18, y: 50, w: 22, h: 18, label: 'CAR · 0.97' },
      { type: 'car', x: 42, y: 54, w: 18, h: 15, label: 'CAR · 0.94' },
      { type: 'car', x: 62, y: 50, w: 20, h: 16, label: 'CAR · 0.96' },
      { type: 'ped', x: 4,  y: 58, w: 7,  h: 16, label: 'PERSON · 0.91' },
      { type: 'ped', x: 86, y: 56, w: 7,  h: 14, label: 'PERSON · 0.89' },
      { type: 'bike',x: 12, y: 65, w: 9,  h: 12, label: 'BICYCLE · 0.85' }
    ],
    counts: { ped: 23, car: 12, bike: 4 }
  },
  {
    name: 'Calzada de Tlalpan',
    cam: 'CAM-0188',
    boxes: [
      { type: 'car', x: 8,  y: 48, w: 24, h: 18, label: 'BUS · 0.93' },
      { type: 'car', x: 36, y: 52, w: 20, h: 16, label: 'CAR · 0.96' },
      { type: 'car', x: 60, y: 48, w: 22, h: 18, label: 'TRUCK · 0.92' },
      { type: 'car', x: 84, y: 56, w: 14, h: 12, label: 'CAR · 0.90' },
      { type: 'ped', x: 50, y: 62, w: 6,  h: 14, label: 'PERSON · 0.88' }
    ],
    counts: { ped: 8, car: 38, bike: 1 }
  },
  {
    name: 'Periférico Sur · Cuemanco',
    cam: 'CAM-0317',
    boxes: [
      { type: 'car', x: 12, y: 46, w: 24, h: 18, label: 'CAR · 0.98' },
      { type: 'car', x: 40, y: 52, w: 18, h: 14, label: 'CAR · 0.94' },
      { type: 'car', x: 62, y: 48, w: 20, h: 16, label: 'CAR · 0.96' },
      { type: 'car', x: 84, y: 54, w: 14, h: 12, label: 'CAR · 0.91' },
      { type: 'car', x: 28, y: 64, w: 18, h: 14, label: 'TRUCK · 0.89' },
      { type: 'car', x: 56, y: 66, w: 20, h: 14, label: 'CAR · 0.93' }
    ],
    counts: { ped: 2, car: 47, bike: 0 }
  }
];

document.addEventListener('DOMContentLoaded', () => {
  loadScene(0);
  renderSources();
  renderODS();
  startMetricsLoop();
});

function loadScene(idx) {
  const scene = SCENES[idx];
  if (!scene) return;
  currentScene = idx;

  // Pintar bboxes con stagger para sensación de detección frame-a-frame
  const overlay = document.getElementById('vp-overlay');
  overlay.innerHTML = '';
  scene.boxes.forEach((b, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = `vp-bbox ${b.type}`;
      div.style.left = b.x + '%';
      div.style.top = b.y + '%';
      div.style.width = b.w + '%';
      div.style.height = b.h + '%';
      div.innerHTML = `<span class="vp-bbox-label">${b.label}</span>`;
      overlay.appendChild(div);
    }, i * 80);
  });

  // Animar contadores
  animateNumber(document.getElementById('vp-c-ped'), scene.counts.ped, 800);
  animateNumber(document.getElementById('vp-c-car'), scene.counts.car, 800);
  animateNumber(document.getElementById('vp-c-bike'), scene.counts.bike, 800);

  animateNumber(document.getElementById('cl-ped'), scene.counts.ped, 800);
  animateNumber(document.getElementById('cl-car'), scene.counts.car, 800);
  animateNumber(document.getElementById('cl-bike'), scene.counts.bike, 800);

  // Update meta
  document.querySelector('.vp-meta-tl .kicker').textContent = scene.cam;
  document.querySelector('.vp-meta-tl .mono').textContent = scene.name;
  document.getElementById('scene-indicator').textContent = `Escena ${idx + 1} / ${SCENES.length}`;
}

function nextScene() {
  loadScene((currentScene + 1) % SCENES.length);
}
function prevScene() {
  loadScene((currentScene - 1 + SCENES.length) % SCENES.length);
}

/* ═════ MÉTRICAS LIVE ═════ */
function startMetricsLoop() {
  function tick() {
    const conf = (0.88 + Math.random() * 0.08).toFixed(2);
    const frameMs = Math.round(28 + Math.random() * 12);
    const fps = Math.round(1000 / frameMs);
    const ds = Math.round(fps * SCENES[currentScene].boxes.length);

    document.getElementById('m-conf').textContent = conf;
    document.getElementById('m-frame').textContent = `${frameMs} ms`;
    document.getElementById('m-ds').textContent = ds;
    document.getElementById('vp-fps').textContent = fps;
  }
  tick();
  setInterval(tick, 1500);
}

/* ═════ FUENTES DE DATOS ═════ */
function renderSources() {
  const grid = document.getElementById('sources-grid');
  grid.innerHTML = SOMUS_DATA.dataSources.map(s => `
    <article class="source-card">
      <div class="source-head">
        <span class="source-name">${s.name}</span>
        <span class="source-status ${s.status}">${s.status === 'live' ? '● Activo' : '○ Planeado'}</span>
      </div>
      <div class="source-type">${s.type}</div>
      <div class="source-note">${s.url || s.note || ''}</div>
    </article>
  `).join('');
}

/* ═════ ODS ═════ */
function renderODS() {
  const grid = document.getElementById('ods-grid');
  const odsTexts = {
    3:  'Mejor calidad del aire y reducción de PM2.5 contribuyen a la salud respiratoria de 21M de habitantes en la ZMVM.',
    7:  'Promoción del transporte eléctrico (Metro, Trolebús, Cablebús) y movilidad activa, reduciendo dependencia de combustibles fósiles.',
    9:  'Aplicación de visión por computadora, edge computing y datos abiertos como infraestructura tecnológica resiliente.',
    10: 'Acceso equitativo a información de movilidad para todos los ciudadanos, sin distinción de nivel socioeconómico.',
    11: 'Optimización del transporte público y reducción de congestión durante el Mundial 2026 con +5.4M visitantes esperados.',
    13: 'Cuantificación y reducción de emisiones de CO₂ con factores reales SEMARNAT 2023, alineado con compromisos climáticos.'
  };

  grid.innerHTML = SOMUS_DATA.sdgs.map(s => `
    <article class="ods-card">
      <div class="ods-card-num" style="background: ${s.color};">${s.num}</div>
      <div class="ods-card-name">${s.name}</div>
      <p class="ods-card-text">${odsTexts[s.num] || ''}</p>
    </article>
  `).join('');
}
