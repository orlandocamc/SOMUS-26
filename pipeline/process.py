"""
SOMUS-26 · YOLO Video Processor (multi-video)
Procesa cam01.mp4 ... cam04.mp4 con YOLOv8n y genera
cam01-out.mp4 ... cam04-out.mp4 con bounding boxes
estilizados según la paleta SOMUS-26 (sage/forest/coral).

Uso: python process.py
Tarda 2-5 min por video en CPU.
"""
import cv2
import time
from pathlib import Path
from ultralytics import YOLO

# ── CONFIG ─────────────────────────────────────────
# Lista de videos a procesar: (input, output, cam_id, location_label)
VIDEOS = [
    ("cam01.mp4", "cam01-out.mp4", "CAM-0521", "ESTADIO AZTECA"),
    ("cam02.mp4", "cam02-out.mp4", "CAM-0188", "CALZADA TLALPAN"),
    ("cam03.mp4", "cam03-out.mp4", "CAM-0042", "INSURGENTES SUR"),
    ("cam04.mp4", "cam04-out.mp4", "CAM-0317", "PERIFERICO SUR"),
]
MODEL = "yolov8n.pt"
CONF_THRESHOLD = 0.35

# Paleta SOMUS-26 (BGR para OpenCV, no RGB)
COLORS = {
    "person":     (134, 233, 184),   # sage-bright #b8e986
    "vehicle":    (32, 160, 232),    # amber #e8a020
    "bicycle":    (75, 101, 232),    # coral #e8654b
    "default":    (89, 124, 74),
}
PERSON_CLS = {0}
VEHICLE_CLS = {2, 3, 5, 7}  # car, motorcycle, bus, truck
BIKE_CLS = {1}              # bicycle

# ── HELPERS ────────────────────────────────────────
def get_color_and_label(cls_id, name):
    if cls_id in PERSON_CLS:
        return COLORS["person"], "PERSONA"
    elif cls_id == 1:
        return COLORS["bicycle"], "BICI"
    elif cls_id == 3:
        return COLORS["vehicle"], "MOTO"
    elif cls_id in VEHICLE_CLS:
        upper = name.upper()
        return COLORS["vehicle"], upper if upper in ("CAR","BUS","TRUCK") else "VEHICULO"
    return COLORS["default"], name.upper()

def draw_label_box(img, x1, y1, x2, y2, label, conf, color):
    cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
    text = f"{label} {conf:.2f}"
    (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
    cv2.rectangle(img, (x1, y1 - th - 6), (x1 + tw + 6, y1), color, -1)
    cv2.putText(img, text, (x1 + 3, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, (30, 30, 30), 1, cv2.LINE_AA)

def draw_overlay_hud(img, w, h, counts, fps_ema, cam_id, location):
    overlay = img.copy()
    cv2.rectangle(overlay, (0, 0), (w, 56), (14, 20, 16), -1)
    cv2.addWeighted(overlay, 0.78, img, 0.22, 0, img)

    cv2.putText(img, "SOMUS-26", (16, 22),
                cv2.FONT_HERSHEY_SIMPLEX, 0.68, (134, 233, 184), 2, cv2.LINE_AA)
    cv2.putText(img, f"YOLOv8n  {cam_id}  {location}", (16, 44),
                cv2.FONT_HERSHEY_SIMPLEX, 0.36, (200, 220, 195), 1, cv2.LINE_AA)

    items = [
        (f"PER {counts['person']:3d}", COLORS["person"]),
        (f"VEH {counts['vehicle']:3d}", COLORS["vehicle"]),
        (f"BIKE {counts['bicycle']:3d}", COLORS["bicycle"]),
        (f"FPS {fps_ema:4.1f}", (255, 255, 255)),
    ]
    x = w - 16
    for text, color in reversed(items):
        (tw, _), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        x -= tw
        cv2.putText(img, text, (x, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2, cv2.LINE_AA)
        x -= 18

    cv2.circle(img, (w - 24, h - 24), 6, (75, 75, 232), -1)
    cv2.putText(img, "REC", (w - 64, h - 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)


# ── MAIN ───────────────────────────────────────────
def process_video(input_path, output_path, cam_id, location, model):
    if not Path(input_path).exists():
        print(f"  SKIP · No encuentro {input_path}")
        return False

    print(f"\n  Procesando {input_path} -> {output_path}")
    print(f"  CAM={cam_id} LOC={location}")

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"  ERROR: No pude abrir {input_path}")
        return False

    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps_in = cap.get(cv2.CAP_PROP_FPS) or 30
    n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"  {w}x{h} | {fps_in:.0f} FPS | {n_frames} frames | {n_frames/fps_in:.1f}s")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_path, fourcc, fps_in, (w, h))

    frame_idx = 0
    fps_ema = 0
    t_start = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        t0 = time.time()
        results = model(frame, conf=CONF_THRESHOLD, verbose=False)[0]

        counts = {"person": 0, "vehicle": 0, "bicycle": 0}
        if results.boxes is not None:
            for box in results.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                name = model.names[cls_id]

                color, label = get_color_and_label(cls_id, name)
                draw_label_box(frame, x1, y1, x2, y2, label, conf, color)

                if cls_id in PERSON_CLS:
                    counts["person"] += 1
                elif cls_id == 1:
                    counts["bicycle"] += 1
                elif cls_id in VEHICLE_CLS:
                    counts["vehicle"] += 1

        dt = time.time() - t0
        inst_fps = 1.0 / dt if dt > 0 else 0
        fps_ema = inst_fps if fps_ema == 0 else (fps_ema * 0.9 + inst_fps * 0.1)

        draw_overlay_hud(frame, w, h, counts, fps_ema, cam_id, location)
        writer.write(frame)

        frame_idx += 1
        if frame_idx % 30 == 0 or frame_idx == n_frames:
            elapsed = time.time() - t_start
            eta = (n_frames - frame_idx) * (elapsed / frame_idx) if frame_idx else 0
            pct = 100 * frame_idx / n_frames if n_frames else 0
            print(f"    Frame {frame_idx:4d}/{n_frames} ({pct:5.1f}%) | "
                  f"{fps_ema:4.1f} FPS | ETA {eta:5.1f}s")

    cap.release()
    writer.release()

    elapsed = time.time() - t_start
    size_mb = Path(output_path).stat().st_size / 1024 / 1024
    print(f"  OK | {frame_idx} frames en {elapsed:.1f}s | {size_mb:.1f} MB")
    return True


def main():
    print(f"\n{'='*54}")
    print(f"SOMUS-26 · YOLO Video Processor (multi-video)")
    print(f"{'='*54}\n")

    print(f"Cargando modelo {MODEL}...")
    model = YOLO(MODEL)
    print(f"Modelo listo. Procesando {len(VIDEOS)} videos...\n")

    t_total = time.time()
    success = 0
    for input_path, output_path, cam_id, location in VIDEOS:
        if process_video(input_path, output_path, cam_id, location, model):
            success += 1

    print(f"\n{'='*54}")
    print(f"COMPLETADO · {success}/{len(VIDEOS)} videos procesados")
    print(f"Tiempo total: {(time.time() - t_total)/60:.1f} min")
    print(f"{'='*54}\n")

    if success > 0:
        print("Archivos de salida listos para subir al sitio:")
        for _, output_path, cam_id, _ in VIDEOS:
            if Path(output_path).exists():
                print(f"  - {output_path}  ({cam_id})")

if __name__ == "__main__":
    main()