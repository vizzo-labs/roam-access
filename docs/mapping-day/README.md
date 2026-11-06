# Map Manly: mapping-day kit (draft)

Kit for one Saturday that maps the Manly town centre in OpenStreetMap for step-free
routing (Getting there, stage 4). **Draft for Romy's approval — don't merge:** GitHub
Pages serves `main`, so anything merged here becomes public.

- **[`kit.html`](kit.html)** — the whole kit, self-contained and printable (maps embedded).
- [`zone-sheets.html`](zone-sheets.html) / [`pdf/zone-sheets.pdf`](pdf/zone-sheets.pdf) — the six A4 zone sheets.
- [`flyer.html`](flyer.html) / [`pdf/flyer-a4.pdf`](pdf/flyer-a4.pdf) — the invitation flyer (fill in the brackets).
- `data/` — `tasks.geojson` (numbered points), `paths.geojson`, `zones.geojson`, `zones.json`,
  the OSM extract it was built from, and `coverage-before.json`.
- `scripts/` — `fetch_osm.py` → `build_tasks.py` → `render_maps.sh` → `coverage.py` →
  `build_kit.py` → `print_pdfs.sh`. Edit `kit.src.html`, not `kit.html`.

Rebuild (Python 3, Node 22+, Google Chrome, macOS `sips` for JPEGs):

```sh
python3 -I docs/mapping-day/scripts/fetch_osm.py
python3 -I docs/mapping-day/scripts/build_tasks.py
sh docs/mapping-day/scripts/render_maps.sh
python3 -I docs/mapping-day/scripts/coverage.py docs/mapping-day/data/osm-centre-<date>.json
python3 -I docs/mapping-day/scripts/build_kit.py
sh docs/mapping-day/scripts/print_pdfs.sh
```

Nothing here edits OpenStreetMap, contacts anyone or touches the app.
Map data © OpenStreetMap contributors (ODbL); basemap OpenFreeMap © OpenMapTiles.
