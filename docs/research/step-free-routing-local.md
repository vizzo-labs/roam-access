# Step-free routing, run locally: measurements and hosting

Getting there 6 (Brief K). Follows the spike in draft PR #18
([`step-free-routing-spike.md`](https://github.com/vizzo-labs/roam-access/blob/spike/step-free-routing/docs/research/step-free-routing-spike.md)).
Measured on 6 November 2026 on Romy's Mac (Apple M3 Pro, 11 cores, 18 GB RAM; Docker 28
with 8 CPUs and 7.65 GB). OSM data: Geofabrik Australia, replication timestamp
`2026-11-04T21:21:03Z`. Engine: `ghcr.io/valhalla/valhalla-scripted:3.9.1` (Valhalla 3.9.1,
released 6 October 2026, the latest; native arm64 and amd64 images). Nothing here touched
production. How to run it: [`apps/app/scripts/routing/README.md`](../../apps/app/scripts/routing/README.md).

## 1. What was built

- **Valhalla in Docker**, container `ra-valhalla`, published on `127.0.0.1:8002` only. Tiles,
  elevation and extracts live in `~/Vizzo/valhalla-data/<region>/` (outside the repo,
  gitignored). Elevation is on (Valhalla's global ~30 m model, downloaded at build time).
- **Pre-processing (pyosmium)**: every crossing path with a kerb mapped raised (`kerb=raised`,
  or `kerb:height` ≥ 4 cm) gets `wheelchair=no`. **Valhalla honours it.** Control test: the
  same Northern Beaches extract built *without* this step still sends the Bronze Sculpture
  House and Collins Flat routes over OSM way 1273244492 (raised kerbs both sides, Darley Rd,
  the crossing the spike flagged); with it, neither route uses it. Greater Sydney has 232 such
  crossings, NSW 515.
- **`checks.json`** (2.2 MB for Greater Sydney): kerbs per crossing, steps and `incline` tags
  per OSM way id. Valhalla doesn't report kerbs, so our checking layer reads this.
- **`GET /api/route`** (dev only — 404 without `VALHALLA_URL`; 401 signed out): wheelchair
  costing with up to 2 alternatives, around today's roadworks / blocked-ramp reports
  (verified: a report on the line turns a 574 m route into a 705 m one), then our checks on
  each candidate (`lib/routing/analyse.ts`, unit-tested):
  - crossings: lowered / not mapped / raised / rolled. **Unknown is "check first", never
    fine**, and a candidate with more unknown kerbs never ranks above one whose kerbs are
    mapped lowered (within 1.5× the length). It changed the pick on 5 of the 12 spike routes;
  - steep (≥ 8%) and 5–8% stretches, uphill or downhill, from the elevation samples over
    50 m windows, **capped by Valhalla's own per-edge grade** (the raw model alone showed 8% on
    the flat wharf forecourt);
  - unsealed surfaces, `incline` tags, lifts, steps (should never appear), the gap between
    where the route ends and the entrance (> 25 m is flagged), no marked entrance, and
    today's reports at the place or on the way;
  - **no route**: a binary search along the walking route finds how close a route avoiding
    mapped steps gets ("gets you to 110 m from Queenscliff Rock Pool").
  Cached 15 minutes in memory; 12 new routes a minute and 300 a day per person. The person's
  location is used for the request only — not stored, not logged.
- **UI**: a Getting there slot (`arrival/RouteAvoidingSteps.jsx`) — see the PR screenshots.

## 2. Measurements

### Data and builds

| | Northern Beaches + margin | Greater Sydney | NSW (bbox, incl. ACT) |
|---|---:|---:|---:|
| Bounding box (W,S,E,N) | 151.15,−33.86,151.36,−33.56 | 149.97,−34.34,151.64,−32.99 | 140.99,−37.51,153.64,−28.15 |
| Download (Geofabrik Australia, once) | 973 MB in 146 s | same | same |
| `osmium extract` | 5 s | 6 s | 9 s |
| Clipped extract | 10 MB | 86 MB | 348 MB |
| Pre-processing (kerbs + checks.json) | 3 s | 28–32 s | 124 s |
| **Tile build** (incl. elevation download, admins) | **12 s** | **38 s** | **218 s** |
| **Peak RAM during the build** (container, sampled ~every 2 s) | **182 MB** | **1.2 GB** | **3.0 GB** |
| **Tiles on disk** (`valhalla_tiles.tar`) | **19 MB** | **165 MB** | **485 MB** |
| Elevation on disk | 25 MB | 201 MB | 3.3 GB |
| `checks.json` | 0.3 MB | 2.2 MB | — |
| Server start (tiles ready) | 1 s | ~3 s | 2 s |
| **RAM idle** | **117 MB** | **163–280 MB** | **115 MB** |
| **RAM under load** | **156 MB** (200 routes) | **350 MB** (20 s at 8 concurrent) | **171 MB** (200 routes) |

RAM is low because Valhalla memory-maps the tile file: the OS pages in only the tiles that
routes touch. A Manly-only workload on NSW tiles touches as little as on Greater Sydney.
Routes across all of NSW would touch more (budget ~1 GB).

### Latency (Greater Sydney tiles, 62 routes: the spike's 12 + 50 random pilot venues, from Manly Wharf)

| | p50 | p95 | max |
|---|---:|---:|---:|
| Bare Valhalla `/route` | 5 ms | 36 ms | |
| **Our whole planner** (route + 2 alternatives + `trace_attributes` per candidate + checks) | **11 ms** | **73 ms** | 99 ms |
| Under load: 8 concurrent for 20 s, random starts within ~1.5 km (6,911 plans, **346/s**) | 16 ms | 59 ms | |

Of the 50 random venues, 0 had no route and 1 got a partial one. (A first run reported p50
4 s under load: the measuring script itself blocked the event loop with a synchronous
`docker stats`. Fixed; numbers above are from the fixed script.)

### The spike's 12 routes, now (local Valhalla + our checks)

| Destination | Result | Climb | Crossings (lowered / not mapped) | Steep ≥ 8% | Notes |
|---|---|---:|---|---|---|
| Manly Library | 0.30 km, 5 min | 10 m | 0 / 1 | – | (with the test entrance: ends at it) |
| New Brighton Hotel | 0.50 km, 8 min | 11 m | 0 / 1 | – | |
| Manly Art Gallery & Museum | 0.35 km, 6 min | 12 m | 0 / 0 | 10% for 60 m | |
| Fairy Bower Rock Pool | 1.32 km, 22 min | 43 m | 0 / 2 | 4 stretches, up to 15% | picked for fewer unknown kerbs |
| Shelly Beach | 1.62 km, 28 min | 51 m | 0 / 2 | 5, up to 15% | picked for fewer unknown kerbs |
| Fairlight Beach Pool | 1.22 km, 21 min | 37 m | 0 / 0 | 7, up to 11% | picked for fewer unknown kerbs |
| Fairlight shops | 1.09 km, 20 min | 56 m | 0 / 3 | 2, 11% | picked for fewer unknown kerbs |
| Little Manly | 1.02 km, 18 min | 32 m | 0 / 1 | 3, up to 14% | picked for fewer unknown kerbs |
| **Collins Flat Beach** | 2.39 km, 40 min | 78 m | 0 / 2, **raised-kerb crossing avoided** | 4, up to 12% | **ends 78–80 m short: flagged** |
| Bronze Sculpture House | 2.17 km, 38 min | 95 m | 0 / 2, **raised-kerb crossing avoided** | 2, up to 11% | |
| **Queenscliff Rock Pool** | **no route all the way** | | | | gets to 110 m away; the rest is a path OSM doesn't let wheelchairs use |
| Balgowlah shops | 2.09 km, 35 min | 67 m | 2 / 7 | 3, up to 14% | |

Slope figures are estimates from a ~30 m elevation model; short ramps and kerb ramps are
invisible to it. They are labelled "about" and "estimated" in the app.

## 3. Hosting estimate

**What it actually needs** (from the measurements above):

| | Northern Beaches | Greater Sydney | NSW |
|---|---|---|---|
| To **serve** (RAM / disk) | 0.5 GB / 1 GB | **1 GB / 2 GB** | 1–2 GB / 5 GB (elevation is 3.3 GB) |
| To **build** as well, on the same box | 1 GB | **2 GB** (1.2 GB peak) | **4 GB** (3.0 GB peak) |
| CPU | 1 vCPU is plenty: one route takes ~10 ms of CPU, so 1 vCPU serves tens of routes a second | | |

Routing load in the pilot is tiny. The size question is almost all about **building**: serving
Greater Sydney, or even NSW, fits in 1 GB because the tiles are memory-mapped.

**Prices** (read 6 November 2026; USD unless marked, monthly, Sydney region; GST not stated
except BinaryLane):

| Option | 1 GB (serve only) | 2 GB (build + serve Sydney) | 4 GB (build + serve NSW) | Source |
|---|---:|---:|---:|---|
| BinaryLane (AU) | A$4.90 + GST | A$9.80 + GST | A$19.60 + GST | [binarylane.com.au/vps-hosting](https://www.binarylane.com.au/vps-hosting) |
| Vultr Sydney | $5 | $10 | $20 | [vultr.com/pricing](https://www.vultr.com/pricing/) (read from its public plans API) |
| DigitalOcean SYD1 | $6 | $12 | $24 | [digitalocean.com/pricing/droplets](https://www.digitalocean.com/pricing/droplets) |
| Akamai / Linode Sydney | $5 | $12 | $24 | [akamai.com/cloud/pricing](https://www.akamai.com/cloud/pricing) |
| AWS Lightsail ap-southeast-2 | $7 | $12 | $24 | [aws.amazon.com/lightsail/pricing](https://aws.amazon.com/lightsail/pricing/) |
| AWS EC2 t4g (+ ~$4 IPv4, + disk) | t4g.micro ≈ $7.74 | t4g.small ≈ $15.48 | t4g.medium ≈ $30.95 | AWS public price list (ap-southeast-2, 5 Nov 2026) |
| Fly.io `syd`, shared-cpu-1x | $8.50 (1 GB) | $16.12 | — | [fly.io/docs/about/pricing](https://fly.io/docs/about/pricing/) (Sydney multiplier from the page) |

**Building elsewhere.** A weekly GitHub Actions job (ubuntu-latest for private repos: 2 CPU,
8 GB RAM, 14 GB disk, 6 h max per job; [runner specs](https://docs.github.com/en/actions/reference/runners/github-hosted-runners))
can download Australia (973 MB, ~2.5 min here), clip, pre-process and build Sydney (or NSW:
3.0 GB peak, ~4–8 min on 2 CPUs, estimated) and upload the tile tar + `checks.json` to
Cloudflare R2 ($0.015/GB-month, no egress fees, first 10 GB free:
[R2 pricing](https://developers.cloudflare.com/r2/pricing/)) — effectively free. Actions
minutes are now a dollar allowance ($12–18/month of included usage; Linux 2-core at
$0.006/min: [billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)),
so a weekly 10-minute job costs about $0.25/month of it. The serving box then only needs 1 GB.
Artifacts (500 MB on the Free plan) are too tight for NSW; use R2.

**Vercel** (read from vercel.com/docs, 6 November 2026):

- **Functions with a container image** ([Container Runtime](https://vercel.com/docs/functions/runtimes/container),
  **beta**): a Dockerfile can be served as a Function in `syd1`, images up to 15 GB
  ([limits](https://vercel.com/docs/container-registry/limits-and-pricing)), Pro up to 4 GB /
  2 vCPU. Billing is Active CPU ($0.180/CPU-hour in syd1) + provisioned memory
  ($0.0149/GB-hour) + $0.60 per million invocations ([pricing](https://vercel.com/docs/functions/usage-and-pricing)).
  But it **scales to zero after 5 minutes idle**, so most pilot requests would hit a cold start
  (container start + Valhalla loading the tiles: 1–3 s here, plus Vercel's own start, not
  measured), and our in-memory cache and rate limit reset each time. Technically possible for
  Greater Sydney; not recommended while it's beta and cold.
- **Plain Functions**: 250 MB bundle limit (Sydney tiles + elevation are 366 MB; 5 GB only with
  the large-functions beta), and Valhalla is a C++ server, not a Node module. No.
- **Vercel Sandbox** ([docs](https://vercel.com/docs/sandbox), [pricing](https://vercel.com/docs/sandbox/pricing)):
  can run a server on an exposed port, but a session lasts at most 24 h on Pro (45 min on
  Hobby) and processes don't survive a stop. Always-on 1 vCPU / 2 GB in syd1 is roughly
  $44/month and needs a restart every day. Built for agents and previews, not a service. No.

**Recommendation**

1. **Now (pilot, Greater Sydney): one small Sydney VPS that builds and serves, 2 GB** —
   BinaryLane A$9.80 + GST (≈ A$10.80) or DigitalOcean / Lightsail US$12. A weekly cron
   re-downloads Australia, rebuilds (~1 minute) and restarts the container. Put Caddy in
   front with HTTPS and a shared-secret header; the Vercel app calls it server-side via
   `VALHALLA_URL` (+ the secret, a small change). **≈ A$11–19 a month.**
2. **Cheaper / more robust as it grows**: build weekly in GitHub Actions → R2, serve from a
   **1 GB** box (BinaryLane A$4.90 + GST, Vultr US$5, DigitalOcean US$6). ≈ A$6–10 a month,
   and the box never needs build headroom. Same pattern scales to **NSW** (serve on 1–2 GB;
   only the build needs 4 GB, which the CI runner has).
3. **Northern Beaches only** saves almost nothing (the 1 GB box is the floor either way) and
   cuts off people coming from the city, so build Greater Sydney.
4. Not Vercel for the router itself, today. Keep the Next.js API route on Vercel as the
   front door (auth, rate limit, our checks), calling the VPS.

These are list prices for the smallest plans; none were bought or signed up for. Not
verified: GST treatment for USD providers, whether DigitalOcean/Vultr/Linode/Lightsail
charge more in Sydney (pages don't say), and Vercel's container cold-start time.

## 4. Limits and follow-ups

- **Route on the big desktop map.** The route shows on its own map inside Getting there. Drawing
  it on the explore map at ≥ 960 px means changing the shared `PilotMap` / `WebLayout`; left
  for a follow-up to avoid colliding with parallel work.
- **Road crossings without a crossing path.** Kerbs are checked where OSM maps the crossing as
  a way (most of the town centre). Where a route crosses at a plain road junction, no kerb is
  known and none is listed; the "Check before you go" footer says kerbs are only as good as
  OSM.
- **Elevation**: ~30 m model, capped by Valhalla's edge grade. No ground truth yet (the
  spike's mapping day would add `incline` tags, which we already read).
- **Rate limit and cache are in memory** (one process). Fine for one routing box; a serverless
  front end would need them in Redis or the database.
- **Data freshness**: tiles are as fresh as the last build (here: 4–5 November 2026).
- A pre-existing React warning ("two children with the same key" for a venue id) shows in
  `next dev` on the venue page; it isn't from this change.

Data © OpenStreetMap contributors (ODbL). Routes by Valhalla (MIT). Elevation: Valhalla's
global elevation tiles (Mapzen/Tilezen terrain, SRTM and others). Basemap © OpenFreeMap /
OpenMapTiles.
