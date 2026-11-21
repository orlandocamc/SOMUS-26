#!/usr/bin/env python3
"""Precompute the routes used by the SOMUS-26 demo (standard library only).

Queries the public OSRM demo servers (no API key) for every ordered pair of
curated places and every mode, and stores each route as GeoJSON in
assets/data/routes/. Existing files are skipped, so the script is resumable;
use --force to regenerate everything.

Usage-policy compliance: one request per second at most, only the requests
that are needed, a generic User-Agent, no personal data.

Data: routing by OSRM, map data (c) OpenStreetMap contributors (ODbL).
"""
import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "data" / "routes"
USER_AGENT = "somus-26-route-precompute/1.0"
PAUSE_S = 1.0

SERVERS = {
    "driving": "https://router.project-osrm.org/route/v1/driving/",
    "cycling": "https://routing.openstreetmap.de/routed-bike/route/v1/bike/",
    "walking": "https://routing.openstreetmap.de/routed-foot/route/v1/foot/",
}

# Curated places = the points the demo already offers as shortcuts in data.js.
PLACES = [
    {"id": "azteca", "name": "Estadio Azteca", "lat": 19.3029, "lng": -99.1505,
     "aliases": ["estadio azteca", "azteca"]},
    {"id": "polanco", "name": "Polanco, CDMX", "lat": 19.4338, "lng": -99.1925,
     "aliases": ["polanco", "polanco, cdmx"]},
    {"id": "centro", "name": "Centro Histórico", "lat": 19.4326, "lng": -99.1332,
     "aliases": ["centro", "centro histórico", "centro historico", "zocalo", "zócalo"]},
    {"id": "roma", "name": "Roma, CDMX", "lat": 19.4151, "lng": -99.1623,
     "aliases": ["roma", "roma norte", "roma, cdmx"]},
    {"id": "condesa", "name": "Condesa, CDMX", "lat": 19.4128, "lng": -99.1734,
     "aliases": ["condesa", "condesa, cdmx"]},
    {"id": "coyoacan", "name": "Coyoacán", "lat": 19.3500, "lng": -99.1622,
     "aliases": ["coyoacán", "coyoacan"]},
    {"id": "tlalpan", "name": "Tlalpan", "lat": 19.2924, "lng": -99.1622,
     "aliases": ["tlalpan"]},
    {"id": "cu", "name": "Ciudad Universitaria", "lat": 19.3274, "lng": -99.1736,
     "aliases": ["cu", "ciudad universitaria", "unam"]},
    {"id": "reforma", "name": "Paseo de la Reforma", "lat": 19.4232, "lng": -99.1675,
     "aliases": ["reforma", "paseo de la reforma"]},
    {"id": "auditorio", "name": "Auditorio Nacional", "lat": 19.4257, "lng": -99.1898,
     "aliases": ["auditorio", "auditorio nacional"]},
    {"id": "aicm", "name": "AICM Terminal 2", "lat": 19.4361, "lng": -99.0719,
     "aliases": ["aicm", "aeropuerto", "aeropuerto cdmx", "aicm terminal 2"]},
]


def fetch_route(mode, a, b):
    url = (f"{SERVERS[mode]}{a['lng']},{a['lat']};{b['lng']},{b['lat']}"
           "?overview=full&geometries=geojson&steps=false")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.load(resp)
    if data.get("code") != "Ok" or not data.get("routes"):
        raise RuntimeError(f"OSRM code={data.get('code')}")
    return data["routes"][0]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--force", action="store_true", help="regenerate existing files")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "index.json").write_text(
        json.dumps({"modes": list(SERVERS), "places": PLACES}, ensure_ascii=False, indent=1),
        encoding="utf-8")

    failures = []
    done = skipped = 0
    for a in PLACES:
        for b in PLACES:
            if a["id"] == b["id"]:
                continue
            for mode in SERVERS:
                path = OUT_DIR / f"{a['id']}__{b['id']}__{mode}.geojson"
                if path.exists() and not args.force:
                    skipped += 1
                    continue
                try:
                    r = fetch_route(mode, a, b)
                except Exception as e:  # noqa: BLE001 - report and continue
                    failures.append((path.name, str(e)))
                    print(f"FAIL {path.name}: {e}", file=sys.stderr)
                    time.sleep(PAUSE_S)
                    continue
                feature = {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": r["geometry"],
                        "properties": {
                            "from": a["id"], "to": b["id"], "mode": mode,
                            "distance_m": round(r["distance"], 1),
                            "duration_s": round(r["duration"], 1),
                            "source": "OSRM / OpenStreetMap contributors (ODbL)",
                        },
                    }],
                }
                path.write_text(json.dumps(feature, separators=(",", ":")), encoding="utf-8")
                done += 1
                print(f"ok {path.name} {r['distance']/1000:.1f} km {r['duration']/60:.0f} min", flush=True)
                time.sleep(PAUSE_S)

    print(f"done={done} skipped={skipped} failed={len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
