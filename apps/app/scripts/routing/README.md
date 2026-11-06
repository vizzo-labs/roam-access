# Step-free routing (Getting there 6) — local Valhalla

"Route avoiding mapped steps" on the venue page, from your location or Manly Wharf to the
step-free entrance someone marked. Dev only: it appears only when `VALHALLA_URL` is set.
Production has no routing server, so `/api/route` answers 404 there and the section hides.

Measurements and the hosting estimate: [`docs/research/step-free-routing-local.md`](../../../../docs/research/step-free-routing-local.md).

## Try it

```sh
cd apps/app
npm run dev:routing            # starts the ra-valhalla container if needed, then next dev on :3000
PORT=3456 npm run dev:routing  # another port
docker stop ra-valhalla        # stop the router (Ctrl-C stops the app)
```

Open a venue → **Getting there** → **Route avoiding mapped steps**. The container listens on
`127.0.0.1:8002` only.

## One-time setup (≈ 10 minutes, ~1.5 GB download)

Everything lives outside the repo in `~/Vizzo/valhalla-data` (override with `VALHALLA_DATA`).
Never commit extracts, tiles or `checks.json` (`.gitignore` covers the usual names).

```sh
brew install osmium-tool
docker pull ghcr.io/valhalla/valhalla-scripted:3.9.1          # arm64 + amd64
D=~/Vizzo/valhalla-data; mkdir -p $D/src && cd $D
curl -L -o src/australia-latest.osm.pbf https://download.geofabrik.de/australia-oceania/australia-latest.osm.pbf
osmium extract -b 149.97,-34.34,151.64,-32.99 src/australia-latest.osm.pbf -o src/greater-sydney.osm.pbf -s smart
python3 -m venv venv && ./venv/bin/pip install osmium
mkdir -p greater-sydney/custom_files
./venv/bin/python -I <repo>/apps/app/scripts/routing/prepare-extract.py \
  src/greater-sydney.osm.pbf greater-sydney/custom_files/greater-sydney.osm.pbf greater-sydney/checks.json \
  "$(osmium fileinfo -g header.option.osmosis_replication_timestamp src/australia-latest.osm.pbf)"
<repo>/apps/app/scripts/routing/build-tiles.sh greater-sydney   # ~40 s, writes build-metrics.json
```

Other regions: `northern-beaches` = `-b 151.15,-33.86,151.36,-33.56`; `nsw` =
`-b 140.99,-37.51,153.64,-28.15`. Serve one with `VALHALLA_REGION=nsw npm run dev:routing`.

## What's here

| File | What it does |
|---|---|
| `prepare-extract.py` | pyosmium. Tags every crossing with a **raised kerb** `wheelchair=no` so Valhalla avoids it (verified: with it, the Darley Rd raised-kerb crossing from the spike is no longer used; without it, it is), and writes `checks.json` (crossings + kerbs, steps, `incline` tags per OSM way id). |
| `build-tiles.sh` | Builds tiles + elevation in a throwaway container and records time, peak RAM and sizes. |
| `start-valhalla.sh` | Starts/creates `ra-valhalla` on `127.0.0.1:8002`, waits until it answers. |
| `dev-routing.sh` | `npm run dev:routing`: the above, then `next dev` with `VALHALLA_URL` and `VALHALLA_CHECKS`. |
| `measure.ts` | `npm run routing:measure`: latency over the spike's 12 routes + 50 random venues, 20 s at 8 concurrent, container RAM. Reads the dev DB; writes nothing. |

App side: `lib/routing/*` (Valhalla client, our checks, ranking, cache, rate limit),
`lib/data/routing.ts` (entrance + today's reports), `app/api/route/route.ts`,
`components/pilot/arrival/RouteAvoidingSteps.jsx` + `RouteMap.jsx` (the slot).

## Environment

| Variable | Default | |
|---|---|---|
| `VALHALLA_URL` | — | Unset = feature off (404). `dev-routing.sh` sets `http://127.0.0.1:8002`. |
| `VALHALLA_CHECKS` | `~/Vizzo/valhalla-data/$VALHALLA_REGION/checks.json` | Missing file = 503 (no route without our checks). |
| `VALHALLA_REGION` | `greater-sydney` | Which tile set `start-valhalla.sh` serves. |
