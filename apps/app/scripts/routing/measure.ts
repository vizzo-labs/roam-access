// Getting there 6 · measure the local Valhalla: route latency (our whole
// planner: route + alternatives + trace_attributes + checks, and a bare
// /route) over the spike's 12 routes plus ~50 random pilot venues, and the
// container's RAM idle and under load. Writes ~/Vizzo/valhalla-data/measure-*.json.
//
//   VALHALLA_URL=http://127.0.0.1:8002 npx dotenv -e .env.local -- \
//     npx tsx --conditions=react-server scripts/routing/measure.ts
//
// Reads venues from the DEV database (pickDatabaseUrl); writes nothing to it.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getDb, schema } from '../../lib/db';
import { eq } from 'drizzle-orm';
import { loadChecks } from '../../lib/routing/checks-data';
import { planRoute } from '../../lib/routing/plan';
import { routeTrips } from '../../lib/routing/valhalla';
import type { RouteTarget } from '../../lib/data/routing';
import { getRouteTarget } from '../../lib/data/routing';
import type { RouteVM } from '../../lib/routing/types';

process.env.VALHALLA_URL ||= 'http://127.0.0.1:8002';

const WHARF = { lat: -33.79975, lng: 151.2846, kind: 'wharf' as const };
// The spike's 12 destinations (docs/research/step-free-routing/scripts/valhalla-routes.mjs).
const SPIKE = [
  { id: 'library', name: 'Manly Library', lat: -33.7976, lng: 151.28598, entrance: { lat: -33.79781, lng: 151.285734 } },
  { id: 'brighton', name: 'New Brighton Hotel', lat: -33.79738, lng: 151.2872 },
  { id: 'gallery', name: 'Manly Art Gallery & Museum', lat: -33.79848, lng: 151.2813, entrance: { lat: -33.798437, lng: 151.28144 } },
  { id: 'fairybower', name: 'Fairy Bower Rock Pool', lat: -33.8008, lng: 151.29437 },
  { id: 'shelly', name: 'The Boathouse, Shelly Beach', lat: -33.80098, lng: 151.29819 },
  { id: 'fairlightpool', name: 'Fairlight Beach Pool', lat: -33.80021, lng: 151.27548 },
  { id: 'fairlightshops', name: 'Fairlight Kitchen', lat: -33.79586, lng: 151.2768 },
  { id: 'littlemanly', name: 'Ripples Little Manly', lat: -33.80655, lng: 151.28731 },
  { id: 'collins', name: 'Collins Flat Beach', lat: -33.80828, lng: 151.29154 },
  { id: 'bronze', name: 'Australian Bronze Sculpture House', lat: -33.81207, lng: 151.29747, entrance: { lat: -33.812261, lng: 151.297445 } },
  { id: 'queenscliff', name: 'Queenscliff Rock Pool', lat: -33.78627, lng: 151.28946 },
  { id: 'balgowlah', name: 'Roasted Grape (Balgowlah)', lat: -33.79457, lng: 151.26521 },
];

const spikeTarget = (d: (typeof SPIKE)[number]): RouteTarget => ({
  venue: { id: d.id, name: d.name, lat: d.lat, lng: d.lng },
  entrance: d.entrance ? { ...d.entrance, kind: 'main' } : null,
  venueReports: [], facilityReports: [],
});

const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };
// Async on purpose: a synchronous `docker stats` (~2 s) blocks the event loop and inflates latency.
async function memMiB(): Promise<number> {
  const out = (await promisify(execFile)('docker', ['stats', '--no-stream', '--format', '{{.MemUsage}}', 'ra-valhalla'])).stdout;
  const m = out.match(/([\d.]+)([KMG]i?B)/);
  if (!m) return 0;
  return Math.round(Number(m[1]) * ({ KiB: 1 / 1024, MiB: 1, GiB: 1024, kB: 1 / 1000, MB: 1, GB: 1000 } as Record<string, number>)[m[2]]);
}
function line(id: string, r: RouteVM) {
  if (r.status === 'none') return `${id.padEnd(15)} NO ROUTE`;
  const c = r.crossings!;
  const steep = r.checks.filter(x => x.kind === 'steep').map(x => `${x.grade}%/${x.m}m`).join(' ');
  const gap = r.checks.find(x => x.kind === 'endGap')?.m;
  return `${id.padEnd(15)} ${r.status.padEnd(7)} ${(r.summary!.m / 1000).toFixed(2)} km ${String(r.summary!.minutes).padStart(3)} min climb ${String(r.summary!.climbM).padStart(3)} m · crossings ${c.total} (lowered ${c.lowered}, unknown ${c.unknown}, raised ${c.raised}) · steep ${steep || '-'} · end gap ${gap ?? '≤25'} m${r.partial ? ` · partial: ${r.partial.gapM} m short, ${r.partial.steps} flights` : ''}${r.chose ? ` · chose: ${r.chose}` : ''}`;
}

async function main() {
  const index = await loadChecks();
  if (!index) throw new Error('checks.json missing');
  const idle = await memMiB();
  const plans: number[] = [], bare: number[] = [];
  const results: Record<string, unknown>[] = [];

  console.log('— The spike’s 12 routes from Manly Wharf —');
  for (const d of SPIKE) {
    const t = performance.now();
    const r = await planRoute(spikeTarget(d), WHARF, index);
    plans.push(performance.now() - t);
    const t2 = performance.now();
    try { await routeTrips([WHARF.lng, WHARF.lat], [d.entrance?.lng ?? d.lng, d.entrance?.lat ?? d.lat]); } catch { /* no route */ }
    bare.push(performance.now() - t2);
    console.log(line(d.id, r));
    results.push({ id: d.id, status: r.status, summary: r.summary, crossings: r.crossings, checks: r.checks.map(c => ({ kind: c.kind, m: c.m, grade: c.grade, count: c.count })), partial: r.partial, chose: r.chose });
  }

  // ~50 random pilot venues (seeded so it's repeatable).
  const vs = await getDb().select({ id: schema.venues.id }).from(schema.venues).where(eq(schema.venues.active, true));
  let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = [...vs].sort(() => rnd() - 0.5).slice(0, 50);
  let none = 0, partial = 0;
  let peak = idle;
  let sampling = true;
  const sampler = (async () => { while (sampling) { try { peak = Math.max(peak, await memMiB()); } catch { /* */ } } })();
  // 4 at a time = "under load".
  const queue = [...pick];
  await Promise.all([0, 1, 2, 3].map(async () => {
    for (let v = queue.shift(); v; v = queue.shift()) {
      const target = await getRouteTarget(v.id);
      if (!target) continue;
      const t = performance.now();
      const r = await planRoute(target, WHARF, index);
      plans.push(performance.now() - t);
      if (r.status === 'none') none++;
      if (r.status === 'partial') partial++;
      const t2 = performance.now();
      try { await routeTrips([WHARF.lng, WHARF.lat], [target.venue.lng, target.venue.lat]); } catch { /* no route */ }
      bare.push(performance.now() - t2);
    }
  }));
  // Sustained load: 20 s, 8 at a time, random starts within ~1.5 km of the wharf.
  const targets = (await Promise.all(pick.slice(0, 30).map(v => getRouteTarget(v.id)))).filter(Boolean) as RouteTarget[];
  const load: number[] = [];
  const until = Date.now() + 20_000;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (Date.now() < until) {
      const target = targets[Math.floor(rnd() * targets.length)];
      const from = { lat: WHARF.lat + (rnd() - 0.5) * 0.027, lng: WHARF.lng + (rnd() - 0.5) * 0.03, kind: 'me' as const };
      const t = performance.now();
      try { await planRoute(target, from, index); } catch { /* origin in the sea etc. */ }
      load.push(performance.now() - t);
    }
  }));
  sampling = false; await sampler;
  const after = await memMiB();

  const summary = {
    at: new Date().toISOString(), osmDate: index.osmDate, routes: plans.length,
    plan_ms: { p50: Math.round(pct(plans, 50)), p95: Math.round(pct(plans, 95)), max: Math.round(Math.max(...plans)) },
    bare_route_ms: { p50: Math.round(pct(bare, 50)), p95: Math.round(pct(bare, 95)) },
    random: { venues: pick.length, none, partial },
    load: { seconds: 20, concurrency: 8, plans: load.length, per_second: Math.round(load.length / 20), p50: Math.round(pct(load, 50)), p95: Math.round(pct(load, 95)) },
    ram_mib: { idle, peak_under_load: peak, after },
    machine: `${os.cpus()[0]?.model} · ${os.cpus().length} cores`,
  };
  console.log('\n', JSON.stringify(summary, null, 1));
  const file = path.join(os.homedir(), 'Vizzo', 'valhalla-data', `measure-${summary.at.slice(0, 16).replace(/[:T]/g, '')}.json`);
  fs.writeFileSync(file, JSON.stringify({ summary, spike: results }, null, 1));
  console.log('wrote', file);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
