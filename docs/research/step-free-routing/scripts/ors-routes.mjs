// OpenRouteService `wheelchair` routes, Manly Wharf → the same 12 pilot venues as
// valhalla-routes.mjs, cross-checked against the cached OSM extract.
//
//   node docs/research/step-free-routing/scripts/ors-routes.mjs <pass> [ids...]
//
// Passes (see PASSES): each request is cached in ../data/ors/<pass>/<id>.json and
// never repeated, so re-running costs no quota. The API key is read from
// apps/app/.env.local (ORS_API_KEY) and sent only as a header: never printed,
// logged or written to disk. Research spike only: not part of the app.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..', '..');
const DATA = path.join(HERE, '..', 'data');
const ENDPOINT = 'https://api.openrouteservice.org/v2/directions/wheelchair/geojson';

const ORIGIN = { lat: -33.79975, lon: 151.2846 };
const DESTS = {
  library: [-33.7976, 151.28598], brighton: [-33.79738, 151.2872], gallery: [-33.79848, 151.2813],
  fairybower: [-33.8008, 151.29437], shelly: [-33.80098, 151.29819], fairlightpool: [-33.80021, 151.27548],
  fairlightshops: [-33.79586, 151.2768], littlemanly: [-33.80655, 151.28731], collins: [-33.80828, 151.29154],
  bronze: [-33.81207, 151.29747], queenscliff: [-33.78627, 151.28946], balgowlah: [-33.79457, 151.26521],
  // OSM entrance nodes (same as the Valhalla entrance runs)
  // Gallery: the promenade (Manly to Spit Bridge Walk) 13 m from the entrance, outside the step.
  'gallery-promenade': [-33.7983509, 151.2815403],
  'library-entrance': [-33.79781, 151.285734], 'gallery-entrance': [-33.798437, 151.28144], 'bronze-entrance': [-33.812261, 151.297445],
};

const STRICT = { maximum_incline: 6, maximum_sloped_kerb: 0.06, surface_type: 'cobblestone:flattened', smoothness_type: 'good', minimum_width: 0.9 };
export const PASSES = {
  // No profile_params: what the hosted profile does by default.
  default: {},
  // The documented defaults stated explicitly, plus a 0.9 m minimum width.
  strict: { options: { profile_params: { restrictions: STRICT } } },
  // Tighter: 3% incline, 3 cm kerbs.
  tight: { options: { profile_params: { restrictions: { ...STRICT, maximum_incline: 3, maximum_sloped_kerb: 0.03 } } } },
  // Loosest documented values: to find out *why* a strict route fails.
  loose: { options: { profile_params: { restrictions: { maximum_incline: 15, maximum_sloped_kerb: 0.1, smoothness_type: 'very_horrible', surface_type: 'any', track_type: 'grade5' } } } },
  // Explicitly avoid steps (documented avoid_feature for wheelchair).
  nosteps: { options: { avoid_features: ['steps'] } },
};

function key() {
  const env = fs.readFileSync(path.join(ROOT, 'apps', 'app', '.env.local'), 'utf8');
  const m = env.match(/^ORS_API_KEY=(.+)$/m);
  if (!m) throw new Error('ORS_API_KEY missing');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
let requests = 0;

async function fetchRoute(pass, id) {
  const file = path.join(DATA, 'ors', pass, `${id}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const [lat, lon] = DESTS[id];
  const body = {
    coordinates: [[ORIGIN.lon, ORIGIN.lat], [lon, lat]],
    elevation: true, instructions: true, language: 'en',
    extra_info: ['steepness', 'suitability', 'surface', 'waytype', 'waycategory', 'osmid'],
    ...structuredClone(PASSES[pass]),
  };
  await sleep(2000);
  requests++;
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: key(), 'Content-Type': 'application/json', Accept: 'application/geo+json, application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const out = { request: body, status: res.status, response: json, fetched: new Date().toISOString() };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out));
  return out;
}

// Cross-check against the cached OSM extract.
const osm = JSON.parse(fs.readFileSync(path.join(DATA, 'osm-pedestrian-2026-11-06.json'), 'utf8'));
const nodes = new Map(); const ways = new Map();
for (const e of osm.elements) (e.type === 'node' ? nodes : ways).set(e.id, e);
const isKerb = n => n && n.tags && ('kerb' in n.tags || n.tags.barrier === 'kerb');
function hav([lon1, lat1], [lon2, lat2]) {
  const p = Math.PI / 180;
  const x = Math.sin((lat2 - lat1) * p / 2) ** 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin((lon2 - lon1) * p / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(x));
}
// ORS steepness classes: 0 = 0–1%, ±1 = 1–3%, ±2 = 4–6%, ±3 = 7–9%, ±4 = 10–15%, ±5 = 16%+
export function summarise(id, r) {
  if (r.status !== 200) return { id, error: r.response?.error || r.response, status: r.status };
  const f = r.response.features[0];
  const coords = f.geometry.coordinates;
  const extras = f.properties.extras || {};
  const osmIds = extras.osmId || extras.osmid;
  const wayIds = [...new Set((osmIds?.values || []).map(v => v[2]))];
  const steps = wayIds.filter(w => ways.get(w)?.tags?.highway === 'steps');
  const crossings = wayIds.map(w => ways.get(w)).filter(w => w && (w.tags.footway === 'crossing' || (w.tags.crossing && ['footway', 'path', 'cycleway'].includes(w.tags.highway))))
    .map(w => ({ way: w.id, kerbs: w.nodes.map(n => nodes.get(n)).filter(isKerb).map(n => n.tags.kerb || 'height unknown') }));
  const steep = (extras.steepness?.values || []).filter(v => Math.abs(v[2]) >= 3).map(v => {
    let m = 0; for (let i = v[0]; i < v[1]; i++) m += hav(coords[i], coords[i + 1]);
    return { cls: v[2], m: Math.round(m) };
  });
  let climb = 0; for (let i = 1; i < coords.length; i++) if (coords[i][2] > coords[i - 1][2]) climb += coords[i][2] - coords[i - 1][2];
  const end = coords[coords.length - 1];
  const [lat, lon] = DESTS[id];
  const seg = f.properties.segments?.[0] || {};
  return {
    id, km: +(f.properties.summary.distance / 1000).toFixed(3), minutes: Math.round(f.properties.summary.duration / 60),
    climb_m: Math.round(climb), ascent: f.properties.ascent, end_gap_m: Math.round(hav(end, [lon, lat])),
    steps, crossings, crossings_without_kerb_info: crossings.filter(c => !c.kerbs.length).length,
    raised: crossings.filter(c => c.kerbs.includes('raised')).map(c => c.way),
    steep, max_steepness_class: Math.max(0, ...(extras.steepness?.values || []).map(v => Math.abs(v[2]))),
    suitability: extras.suitability?.summary, surface: extras.surface?.summary,
    warnings: f.properties.warnings || [], last: (seg.steps || []).slice(-2).map(s => s.instruction),
    osm_ways: wayIds.length, osm_ways_unknown_to_extract: wayIds.filter(w => !ways.has(w)).length,
  };
}

const [pass = 'default', ...ids] = process.argv.slice(2);
const list = ids.length ? ids : Object.keys(DESTS).filter(k => !k.includes('-'));
const results = [];
for (const id of list) {
  const r = await fetchRoute(pass, id);
  const s = summarise(id, r); results.push(s);
  console.log(id.padEnd(17), s.error ? `ERROR ${s.status} ${JSON.stringify(s.error).slice(0, 160)}` :
    `${s.km}km ${s.minutes}min climb ${s.climb_m}m steps:${s.steps.length} steepCls≥3:${s.steep.length} (max ${s.max_steepness_class}) xings:${s.crossings.length} noKerb:${s.crossings_without_kerb_info} raised:${s.raised.length} endGap:${s.end_gap_m}m warn:${s.warnings.length}`);
}
fs.writeFileSync(path.join(DATA, 'ors', `${pass}-summary.json`), JSON.stringify(results, null, 1));
console.log(`new requests this run: ${requests}`);
