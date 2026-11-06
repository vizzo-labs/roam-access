// Valhalla wheelchair vs foot routes, Manly Wharf → pilot venues.
// Light use of the public FOSSGIS server (one request at a time, 1.5 s apart).
// Writes ../data/valhalla-routes.json; cross-checks each route against the cached
// OSM extract (steps, kerbs at crossings, incline tags).
//
//   node docs/research/step-free-routing/scripts/valhalla-routes.mjs
//
// Research spike only: not part of the app.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '..', 'data');
const SERVER = 'https://valhalla1.openstreetmap.de';
const UA = 'RoamAccess-research-spike/0.1 (accessibility routing feasibility study)';

// Manly Wharf forecourt (East Esplanade side, where people step off the ferry).
export const ORIGIN = { name: 'Manly Wharf', lat: -33.79975, lon: 151.2846 };
// Destinations: venue points from the OSM venue extract (the app's venue
// coordinate). `entrance` = an OSM entrance node, if one is mapped for it.
export const DESTS = [
  { id: 'library', name: 'Manly Library', lat: -33.7976, lon: 151.28598, why: 'flat control, town centre',
    entrance: { osm: 'node/12796405760', lat: -33.79781, lon: 151.285734, tags: 'entrance=yes' } },
  { id: 'brighton', name: 'New Brighton Hotel (The Corso)', lat: -33.79738, lon: 151.2872, why: 'flat control, pedestrian mall' },
  { id: 'gallery', name: 'Manly Art Gallery & Museum', lat: -33.79848, lon: 151.2813, why: 'West Esplanade, steps to the harbour beach nearby',
    entrance: { osm: 'node/12038513434', lat: -33.798437, lon: 151.28144, tags: 'entrance=main' } },
  { id: 'fairybower', name: 'Fairy Bower Rock Pool', lat: -33.8008, lon: 151.29437, why: 'Marine Parade, rock pool reached by steps' },
  { id: 'shelly', name: 'The Boathouse, Shelly Beach', lat: -33.80098, lon: 151.29819, why: 'end of Marine Parade, ramps and steps' },
  { id: 'fairlightpool', name: 'Fairlight Beach Pool', lat: -33.80021, lon: 151.27548, why: 'harbour foreshore walk, many steps in Fairlight' },
  { id: 'fairlightshops', name: 'Fairlight Kitchen (Sydney Rd, Fairlight)', lat: -33.79586, lon: 151.2768, why: 'up the hill from the harbour' },
  { id: 'littlemanly', name: 'Ripples Little Manly', lat: -33.80655, lon: 151.28731, why: 'over Eastern Hill' },
  { id: 'collins', name: 'Collins Flat Beach (North Head)', lat: -33.80828, lon: 151.29154, why: 'bush track with steps — likely no step-free route' },
  { id: 'bronze', name: 'Australian Bronze Sculpture House (North Head)', lat: -33.81207, lon: 151.29747, why: 'North Head, long climb',
    entrance: { osm: 'node/13075217757', lat: -33.812261, lon: 151.297445, tags: 'entrance=main' } },
  { id: 'queenscliff', name: 'Queenscliff Rock Pool', lat: -33.78627, lon: 151.28946, why: 'beachfront, steps at the north end' },
  { id: 'balgowlah', name: 'Roasted Grape (Balgowlah shops)', lat: -33.79457, lon: 151.26521, why: 'long climb up Sydney Rd' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function post(endpoint, body) {
  await sleep(1500);
  const res = await fetch(`${SERVER}/${endpoint}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': UA }, body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) return { error: json, status: res.status };
  return json;
}

export function decode(str, precision = 6) {
  let index = 0, lat = 0, lon = 0; const out = []; const f = 10 ** precision;
  while (index < str.length) {
    for (const which of [0, 1]) {
      let shift = 0, result = 0, b;
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d; else lon += d;
    }
    out.push([lon / f, lat / f]);
  }
  return out;
}

function hav([lon1, lat1], [lon2, lat2]) {
  const p = Math.PI / 180;
  const x = Math.sin((lat2 - lat1) * p / 2) ** 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin((lon2 - lon1) * p / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(x));
}

// The cached OSM extract, for cross-checking Valhalla's edges by way id.
const osm = JSON.parse(fs.readFileSync(path.join(DATA, 'osm-pedestrian-2026-11-06.json'), 'utf8'));
const nodes = new Map(); const ways = new Map();
for (const e of osm.elements) (e.type === 'node' ? nodes : ways).set(e.id, e);
const isKerb = n => n && n.tags && ('kerb' in n.tags || n.tags.barrier === 'kerb');

function crossCheck(edges) {
  const steps = [], crossings = [], inclines = [], noSurface = [], kerbsOnRoute = [];
  for (const e of edges) {
    const w = ways.get(e.way_id); const t = w?.tags || {};
    if (t.highway === 'steps') steps.push({ way: e.way_id, m: Math.round(e.length * 1000) });
    if (t.footway === 'crossing' || (t.crossing && ['footway', 'path', 'cycleway'].includes(t.highway))) {
      const kerbs = w.nodes.map(id => nodes.get(id)).filter(isKerb).map(n => n.tags.kerb || 'height unknown');
      crossings.push({ way: e.way_id, kerbs });
    }
    if (t.incline) inclines.push({ way: e.way_id, incline: t.incline });
    if (w && !t.surface && t.highway !== 'steps') noSurface.push(e.way_id);
  }
  return {
    steps, crossings: dedupe(crossings, c => c.way),
    crossings_without_kerb_info: dedupe(crossings, c => c.way).filter(c => c.kerbs.length === 0).length,
    inclines: dedupe(inclines, c => c.way), ways_without_surface: [...new Set(noSurface)].length,
  };
}
const dedupe = (arr, key) => [...new Map(arr.map(x => [key(x), x])).values()];

async function route(dest, type) {
  const body = {
    locations: [{ lat: ORIGIN.lat, lon: ORIGIN.lon }, { lat: dest.lat, lon: dest.lon }],
    costing: 'pedestrian', costing_options: { pedestrian: { type } }, units: 'km',
    elevation_interval: 10, directions_options: { language: 'en-AU' },
  };
  const r = await post('route', body);
  if (r.error) return { error: r.error };
  const leg = r.trip.legs[0];
  const shape = decode(leg.shape);
  // Per-edge attributes along the exact route shape.
  const ta = await post('trace_attributes', {
    shape: shape.map(([lon, lat]) => ({ lat, lon })), costing: 'pedestrian',
    costing_options: { pedestrian: { type } }, shape_match: 'edge_walk',
    filters: { attributes: ['edge.way_id', 'edge.length', 'edge.use', 'edge.surface', 'edge.max_upward_grade',
      'edge.max_downward_grade', 'edge.weighted_grade', 'edge.names', 'edge.sidewalk', 'edge.mean_elevation'], action: 'include' },
  });
  const edges = ta.edges || [];
  const steep = edges.filter(e => Math.max(e.max_upward_grade ?? 0, e.max_downward_grade != null ? -e.max_downward_grade : 0) >= 8)
    .map(e => ({ way: e.way_id, name: e.names?.[0] || e.use, m: Math.round(e.length * 1000), up: e.max_upward_grade, down: e.max_downward_grade }));
  const elev = leg.elevation || [];
  let climb = 0; for (let i = 1; i < elev.length; i++) if (elev[i] > elev[i - 1]) climb += elev[i] - elev[i - 1];
  const end = shape[shape.length - 1];
  return {
    km: leg.summary.length, minutes: Math.round(leg.summary.time / 60),
    climb_m: Math.round(climb), max_elev_m: elev.length ? Math.max(...elev) : null,
    end_gap_m: Math.round(hav(end, [dest.lon, dest.lat])),
    maneuvers: leg.maneuvers.map(m => m.instruction),
    rough: leg.maneuvers.some(m => m.rough),
    uses: [...new Set(edges.map(e => e.use))],
    steep_edges: steep, valhalla_steps_edges: edges.filter(e => e.use === 'steps').length,
    osm: crossCheck(edges), shape, elevation: elev,
  };
}

// ENTRANCES=1: only add routes to mapped OSM entrance nodes to the existing file.
if (process.env.ENTRANCES) {
  const file = path.join(DATA, 'valhalla-routes.json');
  const prev = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const r of prev.routes) {
    const d = DESTS.find(x => x.id === r.id);
    if (!d?.entrance) continue;
    r.entrance = d.entrance;
    r.wheelchair_entrance = await route({ ...d, lat: d.entrance.lat, lon: d.entrance.lon }, 'wheelchair');
    const w = r.wheelchair_entrance;
    console.log(r.id, w.error ? w.error : `${w.km} km, end gap ${w.end_gap_m} m, steps ${w.osm.steps.length}`);
  }
  fs.writeFileSync(file, JSON.stringify(prev, null, 1));
  process.exit(0);
}

const out = { generated: new Date().toISOString(), server: SERVER, origin: ORIGIN, routes: [] };
for (const d of DESTS) {
  const wheelchair = await route(d, 'wheelchair');
  const foot = await route(d, 'foot');
  out.routes.push({ ...d, wheelchair, foot });
  const w = wheelchair;
  console.log(d.id.padEnd(15), w.error ? JSON.stringify(w.error) :
    `wc ${w.km}km ${w.minutes}min climb ${w.climb_m}m steps:${w.osm.steps.length} steep≥8%:${w.steep_edges.length} xings:${w.osm.crossings.length} (no kerb info ${w.osm.crossings_without_kerb_info}) end gap ${w.end_gap_m}m | foot ${foot.km}km steps:${foot.osm?.steps.length}`);
}
fs.writeFileSync(path.join(DATA, 'valhalla-routes.json'), JSON.stringify(out, null, 1));
