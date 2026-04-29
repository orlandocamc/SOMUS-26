# SOMUS-26

**Sistema de Optimización de Movilidad Urbana Sostenible**
Universidad Iberoamericana — Ciudad de México · 2026

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
git clone https://github.com/victorapc0901-lgtm/SOMUS.git
cd SOMUS
# Cualquier servidor estático funciona
python3 -m http.server 8000
# o
npx serve .
```

Abrir `http://localhost:8000`.

## Despliegue

GitHub Pages está configurado por defecto. Cualquier `git push` a `main`
publica automáticamente en pocos minutos.

## Equipo

- **Daniel Orlando Camacho Campos** — Lead IA & Visión por computadora
- **Víctor** — Lead Frontend & UX
- **Asesoría académica** — Prof. Georgina Paredes

Curso: *Tecnologías para el Desarrollo Sostenible*, Universidad Iberoamericana CDMX.

## Licencia

Proyecto académico. Datos de SEMARNAT, ECOBICI y SIMAT bajo sus respectivas
licencias públicas. Modelo YOLOv8 bajo AGPL-3.0 (Ultralytics).

---

*Construido en CDMX · 2026.*
