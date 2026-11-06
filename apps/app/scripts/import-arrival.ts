// Getting there, stage 2 (I2): accessible parking, drop-off points, accessible
// stops and the wharf around the pilot area, from OpenStreetMap (ODbL 1.0,
// © OpenStreetMap contributors — attributed in the app).
//
//   npm run arrival:import                    insert missing rows into the DEV database
//   npm run arrival:import -- --dry           print what would be imported
//   npm run arrival:import -- --fetch         refresh scripts/data/osm-arrival.json first
//   npm run arrival:import -- --sql out.sql   print the seed INSERT for a migration
//
// The public Overpass API refuses most automated requests, so the result is
// cached in scripts/data/osm-arrival.json and the seed reads that file.
// Insert-only (ON CONFLICT DO NOTHING). Never points at production: imports
// reach production through a migration.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OSM, type ArrivalDetails, type ArrivalKind } from '../lib/arrival/places';
import { connectPg } from './lib/pg';

const CACHE = join(__dirname, 'data', 'osm-arrival.json');
const BBOX = { south: -33.8300, west: 151.2450, north: -33.7700, east: 151.3100 }; // same as the toilets
const MIRRORS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const CLUSTER_M = 30; // spaces this close together are one car park

type El = { type: 'node' | 'way' | 'relation'; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
type Cache = { osmBase: string; fetched: string; elements: El[] } & Record<string, unknown>;

function query() {
  const b = `(${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east})`;
  return `[out:json][timeout:60];
(
  nwr["amenity"="parking_space"]${b};
  nwr["amenity"="parking"]["capacity:disabled"]${b};
  nwr["amenity"="parking"]["wheelchair"="designated"]${b};
  nwr["parking"="drop_off"]${b};
  nwr["highway"="bus_stop"]["wheelchair"]${b};
  nwr["public_transport"="platform"]["wheelchair"]${b};
  nwr["amenity"="bus_station"]["wheelchair"]${b};
  nwr["amenity"="ferry_terminal"]${b};
  nwr["amenity"="taxi"]${b};
);
out center tags;`;
}

async function fetchOverpass(): Promise<{ osm3s: { timestamp_osm_base: string }; elements: El[] }> {
  let last = '';
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: 'POST', body: 'data=' + encodeURIComponent(query()),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'roam-access-pilot/1.0' },
        signal: AbortSignal.timeout(120_000),
      });
      if (res.ok) return await res.json();
      last = `${res.status} at ${url}`;
    } catch (e) { last = `${(e as Error).message} at ${url}`; }
    console.log(`[arrival] Overpass failed (${last}); trying the next mirror`);
  }
  throw new Error(`every Overpass mirror failed (last: ${last})`);
}

// ── Which OSM objects count ──────────────────────────────────────────────
const num = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : null);
const yesish = (v?: string) => v === 'yes' || v === 'designated';
const disabledSpaces = (t: Record<string, string>) => num(t['capacity:disabled']) ?? (t['capacity:disabled'] === 'yes' ? null : 0);

function isAccessibleParking(t: Record<string, string>) {
  if (t.access === 'private' || t.access === 'no') return false;
  if (t.amenity === 'parking_space') {
    return t.parking_space === 'disabled' || yesish(t.disabled) || t.wheelchair === 'designated'
      || (num(t['capacity:disabled']) ?? 0) > 0 || t['capacity:disabled'] === 'yes';
  }
  if (t.amenity === 'parking') {
    return t.wheelchair === 'designated' || (num(t['capacity:disabled']) ?? 0) > 0 || t['capacity:disabled'] === 'yes';
  }
  return false;
}
const isDropOff = (t: Record<string, string>) => t.amenity === 'taxi' || t.parking_space === 'drop_off' || t.parking === 'drop_off';
const isStop = (t: Record<string, string>) =>
  (t.highway === 'bus_stop' || t.public_transport === 'platform' || t.amenity === 'bus_station') && ['yes', 'limited'].includes(t.wheelchair);
const isWharf = (t: Record<string, string>) => t.amenity === 'ferry_terminal' && ['yes', 'limited'].includes(t.wheelchair);

// ── Rows ─────────────────────────────────────────────────────────────────
type Row = {
  id: string; layer: 'arrival'; kind: ArrivalKind; name: string; suburb: string | null; address: string | null;
  lat: number; lng: number; details: ArrivalDetails; description: string | null;
  source: string; source_url: string; source_licence: string; sort: number;
};
const pos = (e: El) => ({ lat: e.lat ?? e.center!.lat, lng: e.lon ?? e.center!.lon });
const ref = (e: El) => `${e.type}/${e.id}`;
const round = (x: number) => Math.round(x * 1e7) / 1e7;
function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const base = (e: El) => ({
  layer: 'arrival' as const, suburb: null, address: null, description: null,
  source: 'OpenStreetMap', source_url: OSM.fixUrl(ref(e)), source_licence: OSM.licence,
});

function parkingRows(els: El[]): Row[] {
  // Greedy clustering: individual spaces next to each other (and the car park
  // they sit in) become one row, so the list doesn't repeat itself.
  const cands = els.filter(e => isAccessibleParking(e.tags || {})).map(e => ({ e, p: pos(e) }));
  const clusters: { members: typeof cands }[] = [];
  for (const c of cands) {
    const near = clusters.find(k => k.members.some(m => metres(m.p, c.p) <= CLUSTER_M));
    if (near) near.members.push(c); else clusters.push({ members: [c] });
  }
  return clusters.map(({ members }) => {
    const lots = members.filter(m => m.e.tags!.amenity === 'parking');
    const spaces = members.filter(m => m.e.tags!.amenity === 'parking_space');
    const lotCount = lots.reduce<number | null>((n, m) => {
      const t = m.e.tags!;
      const k = t.wheelchair === 'designated' ? num(t.capacity) : disabledSpaces(t) || null;
      return k == null ? n : (n ?? 0) + k;
    }, null);
    const spaceCount = spaces.length ? spaces.reduce((n, m) => n + (num(m.e.tags!.capacity) ?? 1), 0) : null;
    const count = lotCount == null ? spaceCount : spaceCount == null ? lotCount : Math.max(lotCount, spaceCount);
    const lead = (lots[0] ?? spaces[0]).e;
    const tags = Object.assign({}, ...members.map(m => m.e.tags));
    const lat = members.reduce((s, m) => s + m.p.lat, 0) / members.length;
    const lng = members.reduce((s, m) => s + m.p.lng, 0) / members.length;
    return {
      ...base(lead), id: `osm-parking-${lead.type}-${lead.id}`, kind: 'accessible_parking' as const,
      name: lots.find(m => m.e.tags!.name)?.e.tags!.name || 'Accessible parking',
      lat: round(lat), lng: round(lng), sort: 10,
      details: {
        osm: members.map(m => ref(m.e)).sort(), spaces: count,
        fee: tags.fee === 'yes' || tags.fee === 'no' ? tags.fee : null,
        maxstay: tags.maxstay ?? null, operator: tags.operator ?? null, parking: tags.parking ?? null,
      },
    };
  });
}

function dropOffRows(els: El[]): Row[] {
  return els.filter(e => isDropOff(e.tags || {})).map(e => {
    const t = e.tags!; const p = pos(e);
    const taxi = t.amenity === 'taxi';
    return {
      ...base(e), id: `osm-dropoff-${e.type}-${e.id}`, kind: 'drop_off' as const,
      name: t.name || (taxi ? 'Taxi rank' : 'Drop-off zone'), lat: round(p.lat), lng: round(p.lng), sort: 20,
      details: { osm: [ref(e)], dropOff: taxi ? 'taxi_rank' : 'drop_off', maxstay: t.maxstay ?? null },
    };
  });
}

const bool = (v?: string) => (v === 'yes' ? true : v === 'no' ? false : null);
function stopRows(els: El[]): Row[] {
  return els.filter(e => isStop(e.tags || {})).map(e => {
    const t = e.tags!; const p = pos(e);
    return {
      ...base(e), id: `osm-stop-${e.type}-${e.id}`, kind: 'accessible_stop' as const,
      name: t.name || (t.amenity === 'bus_station' ? `${t.network ? t.network + ' ' : ''}bus station` : 'Bus stop'), lat: round(p.lat), lng: round(p.lng), sort: 30,
      details: {
        osm: [ref(e)], mode: 'bus', wheelchair: t.wheelchair as 'yes' | 'limited', ref: t.ref ?? null,
        shelter: bool(t.shelter), bench: bool(t.bench), tactilePaving: bool(t.tactile_paving),
      },
    };
  });
}

function wharfRows(els: El[]): Row[] {
  return els.filter(e => isWharf(e.tags || {})).map(e => {
    const t = e.tags!; const p = pos(e);
    const manly = /manly wharf/i.test(t.name || '');
    return {
      ...base(e), id: `osm-wharf-${e.type}-${e.id}`, kind: 'wharf' as const,
      name: t.name || 'Ferry wharf', lat: round(p.lat), lng: round(p.lng), sort: 40,
      // The ramp note is Transport for NSW's (see lib/layers/beach-seed.ts).
      description: manly ? 'Transport for NSW says ferry wharf ramps get steeper at low tide and you may need help. Ask the crew, or travel nearer high tide.' : null,
      details: {
        osm: [ref(e)], mode: 'ferry', wheelchair: t.wheelchair as 'yes' | 'limited', ref: t.ref ?? null,
        ...(manly ? { lowTideNote: true, rampFacilityId: 'ferry-manly-wharf' } : {}),
      },
    };
  });
}

export function arrivalRows(cache: Cache): Row[] {
  const els = cache.elements;
  return [...parkingRows(els), ...dropOffRows(els), ...stopRows(els), ...wharfRows(els)]
    .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id, 'en', { numeric: true }));
}

const COLS = ['id', 'layer', 'kind', 'name', 'suburb', 'address', 'lat', 'lng', 'details', 'description',
  'source', 'source_url', 'source_licence', 'sort'] as const;
const lit = (v: unknown) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return `'${s.replace(/'/g, "''")}'` + (typeof v === 'object' ? '::jsonb' : '');
};
function toSql(rows: Row[], cache: Cache) {
  return `-- ${rows.length} rows from OpenStreetMap (${OSM.credit}, ${OSM.licence}, ${OSM.licenceUrl}),
-- OSM data as of ${cache.osmBase}; cached in scripts/data/osm-arrival.json.
-- Generated by scripts/import-arrival.ts (npm run arrival:import -- --sql). Insert-only.
INSERT INTO facilities (${COLS.join(', ')}) VALUES
${rows.map(r => `  (${COLS.map(c => lit(r[c])).join(', ')})`).join(',\n')}
ON CONFLICT (id) DO NOTHING;
`;
}

async function main() {
  const arg = (f: string) => (process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : null);
  if (process.argv.includes('--fetch')) {
    const data = await fetchOverpass();
    const old = JSON.parse(readFileSync(CACHE, 'utf8')) as Cache;
    writeFileSync(CACHE, JSON.stringify({ ...old, osmBase: data.osm3s.timestamp_osm_base, fetched: new Date().toISOString().slice(0, 10), elements: data.elements }, null, 1) + '\n');
    console.log(`[arrival] cached ${data.elements.length} OSM objects`);
  }
  const cache = JSON.parse(readFileSync(CACHE, 'utf8')) as Cache;
  const rows = arrivalRows(cache);
  const count = (k: ArrivalKind) => rows.filter(r => r.kind === k).length;
  console.log(`[arrival] ${cache.elements.length} OSM objects → ${rows.length} rows: ${count('accessible_parking')} accessible parking, ${count('drop_off')} drop-off, ${count('accessible_stop')} stops, ${count('wharf')} wharves`);

  const sqlOut = arg('--sql');
  if (sqlOut) { writeFileSync(sqlOut, toSql(rows, cache)); console.log(`[arrival] wrote ${sqlOut}`); return; }
  if (process.argv.includes('--dry')) {
    for (const r of rows) console.log(`  ${r.kind.padEnd(18)} ${r.id.padEnd(32)} ${r.name}${r.details.spaces ? ` (${r.details.spaces})` : ''}`);
    return;
  }
  const { client, target, host } = await connectPg();
  console.log(`[arrival] writing to the ${target} database (${host})`);
  if (target === 'production') throw new Error('Refusing to write to production — imports reach production through a migration.');
  try {
    for (const r of rows) {
      await client.query(
        `INSERT INTO facilities (${COLS.join(', ')}) VALUES (${COLS.map((_, i) => `$${i + 1}`).join(', ')}) ON CONFLICT (id) DO NOTHING`,
        COLS.map(c => (c === 'details' ? JSON.stringify(r[c]) : r[c])),
      );
    }
    console.log('[arrival] done.');
  } finally { await client.end(); }
}

if (process.argv[1]?.endsWith('import-arrival.ts')) {
  main().catch(e => { console.error(`[arrival] ${(e as Error).message}`); process.exit(1); });
}
