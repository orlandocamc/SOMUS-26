/* =====================================================
   SOMUS-26 · pipeline.js
   - Selector de cámaras CCTV con video real procesado por YOLO
   - Fuentes de datos
   - ODS cards
   ===================================================== */

const CAMERA_SOURCES = [
  'assets/video/cam01-final.mp4',
  'assets/video/cam02-final.mp4',
  'assets/video/cam03-final.mp4'
];

document.addEventListener('DOMContentLoaded', () => {
  initCamSwitcher();
  renderSources();
  renderODS();
});

/* ═════ CAMERA SWITCHER ═════ */
function initCamSwitcher() {
  const video = document.getElementById('vp-video');
  const tabs = document.querySelectorAll('.cam-tab');
  if (!video || tabs.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.dataset.cam);
      if (isNaN(idx) || !CAMERA_SOURCES[idx]) return;

      // Marcar activa
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Cambiar fuente con fade suave
      video.style.opacity = '0';
      setTimeout(() => {
        video.src = CAMERA_SOURCES[idx];
        video.load();
        video.play().catch(() => {/* autoplay blocked */});
        video.style.opacity = '1';
      }, 200);
    });
  });

  // Asegurar que el primer video arranque (algunos navegadores bloquean autoplay)
  video.style.transition = 'opacity 0.3s';
  video.play().catch(() => {/* autoplay blocked */});
}

/* ═════ FUENTES DE DATOS ═════ */
function renderSources() {
  const grid = document.getElementById('sources-grid');
  if (!grid) return;
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
  if (!grid) return;
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
