# SOMUS-26

**Sistema de Optimización de Movilidad Urbana Sostenible**
Universidad Iberoamericana — Ciudad de México · 2026

[![Live demo](https://img.shields.io/badge/Live-orlandocamc.github.io%2FSOMUS--26-2d5a3d?style=flat-square)](https://orlandocamc.github.io/SOMUS-26/)
[![Stack](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20Leaflet%20%2B%20Chart.js-4a7c59?style=flat-square)]()
[![License](https://img.shields.io/badge/license-Academic-cddfc0?style=flat-square)]()

---

> Plataforma de inteligencia urbana que combina visión por computadora, datos
> abiertos y modelos de impacto ambiental para optimizar la movilidad de la
> Zona Metropolitana del Valle de México durante el Mundial FIFA 2026.

---

## Tres vistas. Un sistema.

| Vista | Audiencia | URL |
|---|---|---|
| **Planeador multimodal** | Ciudadano | `index.html` |
| **Centro de Control** | Operador / Gobierno | `control.html` |
| **Pipeline IA** | Técnico / Académico | `pipeline.html` |

---

## Stack

- **Frontend** · HTML5 + CSS3 + JavaScript vanilla
- **Mapas** · Leaflet 1.9 + Leaflet.heat (heatmap)
- **Visualización** · Chart.js 4.4
- **Tipografía** · Archivo Black + Space Mono + Archivo
- **Despliegue** · GitHub Pages (CI/CD por push)
- **Visión por computadora** · YOLOv8n (Ultralytics) — INT8 cuantizado
- **Edge** · Raspberry Pi 5 + ONNX Runtime

## Arquitectura

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌────────┐
│  CCTV    │ →  │ Edge IA  │ →  │ Aggregator   │ →  │  Brain    │ →  │  UI    │
│ C5 + Web │    │ YOLOv8n  │    │ MQTT + DB    │    │ Routing   │    │ SOMUS  │
└──────────┘    └──────────┘    └──────────────┘    └───────────┘    └────────┘
   2 412 nodos     30 FPS           14 380 evt/s        Dijkstra +ML    Web app
```

## Fuentes de datos

| Fuente | Tipo | Estado |
|---|---|---|
| C5 CDMX (cámaras) | CCTV / RTSP | Vía convenio institucional |
| ECOBICI GBFS | API REST pública | ● Activo |
| SIMAT (calidad del aire) | API REST pública | ● Activo |
| Datos Abiertos CDMX | Datasets públicos | ● Activo |
| OpenStreetMap (Overpass) | API pública | ● Activo |
| YOLOv8 / Ultralytics | Modelo pre-entrenado COCO | ● Activo |

> **Nota:** la columna «Estado» de la tabla anterior describe el diseño del sistema. Lo que
> realmente existe hoy está en la sección *Implementado vs. propuesto*. En particular, el acceso
> a cámaras del C5 era una **propuesta** de convenio institucional, no un convenio logrado.

**Factores de emisión** referenciados a [SEMARNAT 2023](https://www.gob.mx/semarnat) e
IPCC AR6. Ningún factor inventado.

## Funcionalidades clave

### Vista del ciudadano (`index.html`)
- Optimizador multimodal con 3 rutas comparadas
- Cálculo real de CO₂ con factores SEMARNAT 2023
- Mapa con heatmap, ECOBICI y Metro
- POIs cercanos al destino
- Comparativa por modo de transporte

### Centro de Control (`control.html`)
- 6 KPIs en vivo con sparklines
- Heatmap operacional con 3 capas (peatonal/vehicular/Metro)
- 4 cámaras CCTV con detección YOLOv8 visualizada
- Sistema de alertas con prioridad
- Estaciones SIMAT de calidad del aire
- Reparto modal en tiempo real
- Operations log en tiempo real

### Pipeline IA (`pipeline.html`)
- Demo interactivo de detección con bounding boxes
- 4 escenas distintas (estadio, vialidad, eje vial, periférico)
- Métricas de inferencia en vivo (FPS, latencia, confianza)
- Diagrama de arquitectura del sistema
- Inventario de fuentes integradas
- Alineación a 6 ODS de la Agenda 2030

## ODS atendidos

`3` Salud y bienestar · `7` Energía asequible · `9` Industria e innovación
`10` Reducción de desigualdades · `11` Ciudades sostenibles · `13` Acción por el clima

## Cómo correr localmente

```bash
git clone https://github.com/orlandocamc/SOMUS-26.git
cd SOMUS-26
# Cualquier servidor estático funciona
python3 -m http.server 8000
# o
npx serve .
```

Abrir `http://localhost:8000`.

## Routing

El planeador **no usa ninguna clave ni API de pago**. Las rutas de auto, bici y caminata
entre los lugares predefinidos (Estadio Azteca, Polanco, Centro Histórico, Roma, Condesa,
Coyoacán, Tlalpan, Ciudad Universitaria, Reforma, Auditorio Nacional y AICM; todos los
pares ordenados) están pre-calculadas y guardadas como GeoJSON en
`assets/data/routes/` (`<origen>__<destino>__<driving|cycling|walking>.geojson`, con
`distance_m` y `duration_s`; el catálogo de lugares está en `index.json`). El JS solo lee
esos archivos; si se pide un par que no existe muestra «Route not available in this demo».

Los tramos de Metro/Metrobús y los tiempos multimodales son **estimaciones** (marcadas
como *estimated* en la interfaz), no datos de transporte público.

Para regenerarlas (biblioteca estándar de Python, 1 petición por segundo, User-Agent genérico):

```bash
python tools/precompute_routes.py          # omite archivos existentes
python tools/precompute_routes.py --force  # regenera todo
```

Servidores usados: OSRM demo (`router.project-osrm.org`) para auto y
`routing.openstreetmap.de` (bike/foot) para bici y caminata.

**Atribución:** routing por [OSRM](https://project-osrm.org/); datos de mapa
© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), licencia ODbL.

## Despliegue

GitHub Pages está configurado por defecto. Cualquier `git push` a `main`
publica automáticamente en pocos minutos.

## Implementado vs. propuesto

**Implementado (en este repositorio)**
- Las tres vistas web (planeador multimodal, Centro de Control, Pipeline IA) en HTML/CSS/JS vanilla, desplegadas en GitHub Pages.
- Cálculo de CO₂ por modo de transporte con factores de emisión referenciados a SEMARNAT 2023.
- Routing con rutas pre-calculadas de OSRM (ver «Routing»), selección de origen/destino entre lugares predefinidos y POIs con Overpass.
- Un pipeline offline de detección con YOLOv8n (`pipeline/process.py`) que dibuja las cajas sobre videos y produjo los tres videos de `assets/video/` que se muestran en el Centro de Control. La inferencia se corrió por lotes sobre videos, no en vivo.

**Propuesto (no implementado)**
- Convenio institucional con el C5 CDMX para recibir sus cámaras (RTSP). Fue una propuesta; no hay convenio ni acceso a cámaras reales.
- Inferencia en el borde con Raspberry Pi 5 + ONNX Runtime, y el agregador MQTT + base de datos.
- Las cifras del diagrama de arquitectura (2 412 nodos, 30 FPS, 14 380 evt/s) son parte de esa propuesta.
- El Centro de Control muestra KPIs que se generan de forma simulada en el navegador (`assets/js/control.js` usa valores aleatorios alrededor de una base), y la demo del Pipeline IA lo indica como «inferencia simulada». No son mediciones.

## Equipo y roles

| Persona | Rol |
|---|---|
| Daniel Orlando Camacho Campos (Orlando) | Lead IA & Visión por computadora: pipeline YOLO, routing y videos procesados |
| Víctor Alejandro Palacios Castillo | Lead Frontend & UX |
| Prof. Georgina Paredes | Asesoría académica |

Desarrollado en la primavera de 2026 (primeros commits de abril de 2026) para *Tecnologías para el Desarrollo Sostenible*, Universidad Iberoamericana CDMX.

## Pipeline de detección (`pipeline/process.py`)

Procesa `cam01.mp4 … cam04.mp4` con YOLOv8n y escribe videos con cajas en la paleta de SOMUS-26.
Los videos de entrada y el modelo `yolov8n.pt` **no** están en el repositorio (`.gitignore` excluye `*.mp4` y `*.pt`; los tres videos ya procesados de `assets/video/` sí están versionados).

```bash
pip install ultralytics opencv-python
# colocar cam01.mp4 ... y yolov8n.pt junto al script (Ultralytics descarga el modelo si falta)
python pipeline/process.py
```

## Licencia y AGPL-3.0

El código propio es un proyecto académico. El pipeline usa **YOLOv8 de Ultralytics, licenciado bajo AGPL-3.0**: quien distribuya o ponga en red un software derivado que lo use debe cumplir esa licencia (o contar con una licencia comercial de Ultralytics). Los pesos `yolov8n.pt` no se redistribuyen aquí.

## Licencia

Proyecto académico (ver también la sección AGPL-3.0). Datos de SEMARNAT, ECOBICI y SIMAT bajo sus respectivas
licencias públicas. Modelo YOLOv8 bajo AGPL-3.0 (Ultralytics).

---

*Construido en CDMX · 2026.*
