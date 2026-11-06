"""Step-free routing (Getting there 6) · prepare an OSM extract for Valhalla.

Two things, in one pass over a clipped .osm.pbf:

1. Writes a copy of the extract where every crossing path that has a kerb
   mapped as RAISED (kerb=raised, or kerb:height of 4 cm or more) gets
   `wheelchair=no`. Valhalla's wheelchair costing honours that access tag, so
   the router itself stops sending people over those crossings. (The spike
   found Valhalla happily crosses a raised-kerb crossing on Darley Rd.)
2. Writes `checks.json`: the facts our checking layer needs per OSM way id,
   because Valhalla doesn't report kerbs — crossings with their kerbs (and a
   point to show them), steps, and `incline` tags. The route API reads it next
   to the tiles; it is OpenStreetMap data, so the app always calls it
   "unconfirmed".

Run with pyosmium (outside the repo; see scripts/routing/README.md):

    python3 -I prepare-extract.py in.osm.pbf out.osm.pbf checks.json [osm-date]

(osmium extract drops the replication timestamp, so pass the source file's:
`osmium fileinfo -g header.option.osmosis_replication_timestamp australia-latest.osm.pbf`.)

Nothing here is copied into the repo: extracts, tiles and checks.json live in
~/Vizzo/valhalla-data (ODbL data, © OpenStreetMap contributors).
"""
import json
import sys
import time

import osmium

PEDESTRIAN = {"footway", "path", "pedestrian", "cycleway", "steps", "corridor", "living_street", "track", "bridleway"}


def kerb_code(tags):
    """One letter per kerb node: L lowered · F flush/no · R raised · r rolled · U unknown height."""
    kerb = tags.get("kerb")
    height = tags.get("kerb:height")
    if height:
        try:
            h = float(height.replace("m", "").replace("cm", "").strip())
            if "cm" in height:
                h /= 100
            if h >= 0.04:
                return "R"
            if h <= 0.01 and kerb in (None, "lowered", "flush", "no"):
                return "F"
        except ValueError:
            pass
    if kerb == "lowered":
        return "L"
    if kerb in ("flush", "no"):
        return "F"
    if kerb == "raised":
        return "R"
    if kerb == "rolled":
        return "r"
    if kerb is not None or tags.get("barrier") == "kerb":
        return "U"
    return None


def is_crossing(tags):
    hw = tags.get("highway")
    return tags.get("footway") == "crossing" or tags.get("path") == "crossing" or tags.get("cycleway") == "crossing" or (
        hw in PEDESTRIAN and "crossing" in tags and hw != "steps")


class Kerbs(osmium.SimpleHandler):
    """Pass 1: every node that is a kerb, with its code."""

    def __init__(self):
        super().__init__()
        self.kerbs = {}

    def node(self, n):
        if "kerb" in n.tags or n.tags.get("barrier") == "kerb" or "kerb:height" in n.tags:
            code = kerb_code(n.tags)
            if code:
                self.kerbs[n.id] = code


class Rewrite(osmium.SimpleHandler):
    """Pass 2: copy everything; tag raised-kerb crossings wheelchair=no; collect checks."""

    def __init__(self, writer, kerbs):
        super().__init__()
        self.w = writer
        self.kerbs = kerbs
        self.crossings = {}
        self.steps = []
        self.inclines = {}
        self.raised = []

    def node(self, n):
        self.w.add_node(n)

    def relation(self, r):
        self.w.add_relation(r)

    def way(self, w):
        tags = w.tags
        hw = tags.get("highway")
        if hw is None:
            self.w.add_way(w)
            return
        if hw == "steps":
            self.steps.append(w.id)
        if "incline" in tags and hw in PEDESTRIAN:
            self.inclines[str(w.id)] = tags.get("incline")
        if is_crossing(tags):
            codes = "".join(self.kerbs[n.ref] for n in w.nodes if n.ref in self.kerbs)
            try:
                mid = w.nodes[len(w.nodes) // 2]
                lat, lng = round(mid.lat, 6), round(mid.lon, 6)
            except osmium.InvalidLocationError:
                lat = lng = None
            self.crossings[str(w.id)] = [codes, lat, lng]
            if "R" in codes and tags.get("wheelchair") != "no":
                self.raised.append(w.id)
                new_tags = dict(tags)
                new_tags["wheelchair"] = "no"
                self.w.add_way(w.replace(tags=new_tags))
                return
        self.w.add_way(w)


def main():
    src, dst, checks_path = sys.argv[1:4]
    t0 = time.time()
    k = Kerbs()
    k.apply_file(src)
    writer = osmium.SimpleWriter(dst, overwrite=True)
    try:
        h = Rewrite(writer, k.kerbs)
        h.apply_file(src, locations=True)
    finally:
        writer.close()
    # The data date (the extract's replication timestamp), shown as "OpenStreetMap data from …".
    try:
        import subprocess
        osm_date = sys.argv[4] if len(sys.argv) > 4 else subprocess.run(
            ["osmium", "fileinfo", "-g", "header.option.osmosis_replication_timestamp", src],
                                  capture_output=True, text=True, check=True).stdout.strip() or None
    except Exception:
        osm_date = None
    out = {
        "osm_date": osm_date,
        "built": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": src.rsplit("/", 1)[-1],
        "note": "OpenStreetMap data (ODbL). x: crossing way id -> [kerb codes L/F/R/r/U, lat, lng]; s: steps way ids; i: incline tags; raised: crossings tagged wheelchair=no",
        "x": h.crossings,
        "s": h.steps,
        "i": h.inclines,
        "raised": h.raised,
    }
    with open(checks_path, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"kerb nodes {len(k.kerbs)} · crossings {len(h.crossings)} · raised-kerb crossings tagged {len(h.raised)} · "
          f"steps {len(h.steps)} · inclines {len(h.inclines)} · {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
