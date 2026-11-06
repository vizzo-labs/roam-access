import 'server-only';
// Getting there 6 · plan one "route avoiding mapped steps": ask Valhalla
// (wheelchair costing, up to 2 alternatives, around temporary reports), run
// our checks on every candidate, pick the best (rankCandidates), and if there
// is no route, find how close a route without steps can get.
import type { RouteTarget } from '../data/routing';
import { analyseRoute, orderAndNumber, rankCandidates, type Analysis, type ChecksIndex } from './analyse';
import { boxAround, decodePolyline, distanceToLine, metresBetween } from './geo';
import type { LngLat, RouteCheck, RouteEnd, RouteFrom, RouteVM } from './types';
import { NoRoute, edgesFor, routeTrips, type VTrip } from './valhalla';

/** Reports on a facility (a stop, parking, a beach ramp…) that mean "don't send people through here". */
const AVOID = new Set(['ramp_blocked', 'roadworks']);
/** Reports worth saying when they're on or near the way. */
const FLAG = new Set(['ramp_blocked', 'roadworks', 'lift_out', 'other', 'low_tide', 'matting_missing']);
const AVOID_HALF_M = 12;  // exclusion box: ±12 m around the report
const NEAR_ROUTE_M = 30;

type Candidate = { trip: VTrip; shape: LngLat[]; a: Analysis };

async function analyse(trip: VTrip, to: RouteEnd, index: ChecksIndex): Promise<Candidate> {
  const leg = trip.legs[0];
  const shape = decodePolyline(leg.shape);
  const { edges } = await edgesFor(leg.shape);
  const a = analyseRoute({
    shape, elevation: leg.elevation || [], maneuvers: leg.maneuvers, edges,
    lengthKm: leg.summary.length, timeS: leg.summary.time, to, index,
  });
  return { trip, shape, a };
}

export async function planRoute(target: RouteTarget, from: RouteFrom, index: ChecksIndex): Promise<RouteVM> {
  const to: RouteEnd = target.entrance
    ? { lat: target.entrance.lat, lng: target.entrance.lng, kind: 'entrance', entranceKind: target.entrance.kind }
    : { lat: target.venue.lat, lng: target.venue.lng, kind: 'venue' };
  const A: LngLat = [from.lng, from.lat];
  const B: LngLat = [to.lng, to.lat];
  const source = { osmDate: index.osmDate, engine: 'valhalla' as const };

  // Temporary reports: send the route around them, unless they're at either end.
  const avoidable = target.facilityReports.filter(r => AVOID.has(r.type));
  const excluded = avoidable.filter(r => metresBetween([r.lng, r.lat], A) > 40 && metresBetween([r.lng, r.lat], B) > 40);
  const excludePolygons = excluded.map(r => boxAround([r.lng, r.lat], AVOID_HALF_M));

  const venueChecks: RouteCheck[] = target.venueReports.filter(r => FLAG.has(r.type))
    .map(r => ({ kind: 'venueReport' as const, value: r.type, date: r.date }));

  let trips: VTrip[];
  try {
    trips = await routeTrips(A, B, { excludePolygons, alternates: 2 });
  } catch (e) {
    if (!(e instanceof NoRoute)) throw e;
    return await partialRoute(A, B, from, to, index, excludePolygons, venueChecks, source);
  }

  let cands = await Promise.all(trips.map(t => analyse(t, to, index)));
  // Safety net: if checks.json knows a raised kerb the tiles don't (data
  // newer than the tiles), ask again without those crossings.
  if (cands.every(c => c.a.crossings.raised > 0)) {
    const raised = [...new Set(cands.flatMap(c => c.a.raisedAt.map(p => p.join(','))))].map(s => s.split(',').map(Number) as LngLat);
    try {
      const retry = await routeTrips(A, B, { excludePolygons, excludeLocations: raised, alternates: 1 });
      cands = [...cands, ...(await Promise.all(retry.map(t => analyse(t, to, index))))];
    } catch (e) { if (!(e instanceof NoRoute)) throw e; }
  }
  const ranked = rankCandidates(cands);
  const best = ranked[0];
  const chose = best !== cands[0] && best.a.crossings.unknown < cands[0].a.crossings.unknown ? 'fewerUnknownKerbs' as const : null;

  // Reports near the chosen line that we didn't (or couldn't) route around.
  const checks: RouteCheck[] = [...venueChecks, ...best.a.checks];
  for (const r of target.facilityReports) {
    if (!FLAG.has(r.type) || excluded.includes(r)) continue;
    if (distanceToLine([r.lng, r.lat], best.shape) <= NEAR_ROUTE_M) {
      checks.push({ kind: 'barrier', at: [r.lng, r.lat], value: r.type, near: r.name, date: r.date });
    }
  }
  const avoided = excluded.filter(r => distanceToLine([r.lng, r.lat], best.shape) < 100)
    .map(r => ({ type: r.type, name: r.name, date: r.date }));

  return {
    status: 'ok', from, to, summary: best.a.summary, segments: best.a.segments, steps: best.a.steps,
    checks: orderAndNumber(checks), crossings: best.a.crossings, avoided, chose, source,
  };
}

/** No route without steps: how close can one get? Walk the walking route
 *  (which may use steps or paths not suitable for wheelchairs) and find, by
 *  binary search, the furthest point along it that a route avoiding mapped
 *  steps still reaches. Then say how far short that is, and how many flights
 *  of steps are in the rest. */
async function partialRoute(
  A: LngLat, B: LngLat, from: RouteFrom, to: RouteEnd, index: ChecksIndex,
  excludePolygons: LngLat[][], venueChecks: RouteCheck[], source: RouteVM['source'],
): Promise<RouteVM> {
  const none: RouteVM = { status: 'none', from, to, checks: orderAndNumber(venueChecks), avoided: [], source };
  let foot: VTrip;
  try { [foot] = await routeTrips(A, B, { type: 'foot', excludePolygons }); } catch (e) {
    if (e instanceof NoRoute) return none;
    throw e;
  }
  const leg = foot.legs[0];
  const { edges, shape: traceShape } = await edgesFor(leg.shape, 'foot');
  const tshape = traceShape ? decodePolyline(traceShape) : decodePolyline(leg.shape);
  if (!edges.length) return none;
  const endOf = (k: number) => tshape[Math.min(tshape.length - 1, edges[k].end_shape_index ?? tshape.length - 1)];

  let lo = -1, hi = edges.length - 1, best: VTrip[] | null = null, bestK = -1;
  for (let tries = 0; tries < 8 && hi - lo > 1; tries++) {
    const mid = Math.floor((lo + hi) / 2);
    try {
      const trips = await routeTrips(A, endOf(mid), { excludePolygons, alternates: 1 });
      // Only if it really gets there (not snapped somewhere else).
      const shape = decodePolyline(trips[0].legs[0].shape);
      if (metresBetween(shape[shape.length - 1], endOf(mid)) <= 25) { lo = mid; best = trips; bestK = mid; } else hi = mid;
    } catch (e) {
      if (!(e instanceof NoRoute)) throw e;
      hi = mid;
    }
  }
  if (!best || bestK < 0) return none;
  const P = endOf(bestK);
  const rest = edges.slice(bestK + 1);
  const gapM = Math.round(rest.reduce((sum, e) => sum + (e.length || 0) * 1000, 0));
  const steps = new Set(rest.filter(e => e.use === 'steps' || (e.way_id != null && index.s.has(e.way_id))).map(e => e.way_id)).size;
  const near: RouteEnd = { lat: P[1], lng: P[0], kind: to.kind };
  const cands = await Promise.all(best.map(t => analyse(t, near, index)));
  const pick = rankCandidates(cands)[0];
  // Its own end-gap/no-entrance checks are about P, not the place: drop them.
  const checks = pick.a.checks.filter(c => c.kind !== 'endGap' && c.kind !== 'noEntrance');
  return {
    status: 'partial', from, to, summary: pick.a.summary, segments: pick.a.segments, steps: pick.a.steps,
    checks: orderAndNumber([...venueChecks, ...checks]), crossings: pick.a.crossings, avoided: [],
    partial: { gapM, steps, at: P }, chose: null, source,
  };
}
