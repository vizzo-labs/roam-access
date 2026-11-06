// Getting there 6 · our checking layer on top of Valhalla (pure, no I/O).
//
// Valhalla's wheelchair costing avoids mapped steps, but the spike
// (docs/research/step-free-routing-spike.md) found it doesn't avoid raised
// kerbs or steep slopes, treats unmapped kerbs as fine and can stop short of
// the destination without saying so. So, after every route, we cross-check
// each edge (by OSM way id, from trace_attributes) against our OSM index
// (checks.json, built by scripts/routing/prepare-extract.py) and say:
//   · crossings: lowered / not mapped / raised — unknown is "check first",
//     never "fine", and a route with more unknown kerbs is never picked over
//     one with mapped lowered kerbs (rankCandidates);
//   · steep stretches from the elevation model (5% and 8%), uphill or down;
//   · unsealed surfaces, `incline` tags, lifts, and (should never happen) steps;
//   · where the route ends: the gap to the entrance or the place.
import { cumulative, metresBetween, round } from './geo';
import {
  END_GAP_M, MODERATE_GRADE, STEEP_GRADE,
  type Grade, type LngLat, type RouteCheck, type RouteEnd, type RoutePoint, type RouteSegment, type RouteStep,
} from './types';

// ── Inputs (the parts of Valhalla's answers we use) ─────────────────────────
export type VManeuver = {
  type: number; street_names?: string[]; length: number; begin_shape_index: number;
};
export type VEdge = {
  way_id?: number; length?: number; use?: string; surface?: string; names?: string[];
  begin_shape_index?: number; end_shape_index?: number;
  max_upward_grade?: number; max_downward_grade?: number;
};
/** checks.json: x = crossing way id → [kerb codes, lat, lng]; s = steps way ids; i = incline tags. */
export type ChecksIndex = {
  osmDate: string | null;
  x: Map<number, [string, number | null, number | null]>;
  s: Set<number>;
  i: Map<number, string>;
};

export type KerbState = 'lowered' | 'unknown' | 'raised' | 'rolled';
/** L lowered · F flush · R raised · r rolled · U height unknown (prepare-extract.py). */
export function kerbState(codes: string): KerbState {
  if (codes.includes('R')) return 'raised';
  if (codes.length < 2 || codes.includes('U')) return 'unknown';
  if (codes.includes('r')) return 'rolled';
  return 'lowered';
}

const UNSEALED = new Set(['compacted', 'dirt', 'gravel', 'path', 'impassable']);
const SAMPLE_M = 10; // elevation_interval
const MIN_STRETCH_M = 30;

/** Valhalla maneuver type → our step type (words come from t('route.step.*')). */
export function stepType(n: number): string {
  if (n >= 1 && n <= 3) return 'start';
  if (n >= 4 && n <= 6) return 'arrive';
  if ([9, 18, 20, 23, 37].includes(n)) return 'slightRight';
  if (n === 10) return 'right';
  if (n === 11) return 'sharpRight';
  if (n === 12 || n === 13) return 'uturn';
  if (n === 14) return 'sharpLeft';
  if (n === 15) return 'left';
  if ([16, 19, 21, 24, 38].includes(n)) return 'slightLeft';
  if (n === 26 || n === 27) return 'roundabout';
  if (n === 39) return 'lift';
  if (n === 41) return 'escalator';
  if (n === 42) return 'enter';
  if (n === 43) return 'exit';
  return 'continue';
}

type Stretch = { from: number; to: number; grade: number; up: boolean; cls: 'moderate' | 'steep' };

/** Grade per 10 m piece over a centred ~50 m window of the elevation samples,
 *  capped by Valhalla's own grade for the edge there (`cap`, from the same
 *  elevation model but filtered per edge) — the raw ~30 m model alone shows
 *  8% on the flat wharf forecourt. Then stretches of 5% or more, 30 m or longer. */
export function slopeStretches(elev: number[], cap: (distM: number) => number = () => Infinity): { pieces: number[]; stretches: Stretch[] } {
  const n = elev.length;
  const pieces: number[] = [];
  for (let k = 0; k < n - 1; k++) {
    const a = Math.max(0, k - 2), b = Math.min(n - 1, k + 3);
    const g = ((elev[b] - elev[a]) / (SAMPLE_M * (b - a))) * 100;
    const c = cap(k * SAMPLE_M + SAMPLE_M / 2);
    pieces.push(Math.sign(g) * Math.min(Math.abs(g), c));
  }
  const stretches: Stretch[] = [];
  let cur: { from: number; to: number; max: number } | null = null;
  const close = () => {
    if (cur && (cur.to - cur.from) * SAMPLE_M >= MIN_STRETCH_M) {
      const rise = elev[Math.min(n - 1, cur.to)] - elev[cur.from];
      stretches.push({
        from: cur.from * SAMPLE_M, to: cur.to * SAMPLE_M, grade: Math.round(cur.max), up: rise > 0,
        cls: cur.max >= STEEP_GRADE ? 'steep' : 'moderate',
      });
    }
    cur = null;
  };
  pieces.forEach((g, k) => {
    const abs = Math.abs(g);
    if (abs >= MODERATE_GRADE) {
      if (!cur) cur = { from: k, to: k + 1, max: abs };
      else { cur.to = k + 1; cur.max = Math.max(cur.max, abs); }
    } else close();
  });
  close();
  return { pieces, stretches };
}

function pointAt(shape: LngLat[], cum: number[], d: number): LngLat {
  if (d <= 0) return shape[0];
  for (let i = 1; i < shape.length; i++) {
    if (cum[i] >= d) {
      const t = (d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
      return [round(shape[i - 1][0] + t * (shape[i][0] - shape[i - 1][0])), round(shape[i - 1][1] + t * (shape[i][1] - shape[i - 1][1]))];
    }
  }
  return shape[shape.length - 1];
}

export type Analysis = {
  summary: { m: number; minutes: number; climbM: number; descentM: number };
  segments: RouteSegment[];
  steps: RouteStep[];
  checks: RouteCheck[];
  crossings: { total: number; lowered: number; unknown: number; raised: number };
  /** Crossing points with raised kerbs the router used anyway (for a retry with exclude_locations). */
  raisedAt: LngLat[];
  endGapM: number;
};

export function analyseRoute(input: {
  shape: LngLat[]; elevation: number[]; maneuvers: VManeuver[]; edges: VEdge[];
  lengthKm: number; timeS: number; to: RouteEnd; index: ChecksIndex;
}): Analysis {
  const { shape, elevation, maneuvers, edges, index, to } = input;
  const cum = cumulative(shape);
  const total = cum[cum.length - 1] || input.lengthKm * 1000;

  // Edge distances along the route (trace_attributes lengths, km).
  const edgeAt: { from: number; to: number; e: VEdge }[] = [];
  let d = 0;
  for (const e of edges) { const len = (e.length || 0) * 1000; edgeAt.push({ from: d, to: d + len, e }); d += len; }
  const nameNear = (dist: number): string | null => {
    let best: string | null = null, bestGap = 80;
    for (const x of edgeAt) {
      const name = x.e.names?.[0];
      if (!name) continue;
      const gap = dist < x.from ? x.from - dist : dist > x.to ? dist - x.to : 0;
      if (gap < bestGap) { best = name; bestGap = gap; }
    }
    return best;
  };

  const checks: RouteCheck[] = [];

  // Crossings and their kerbs (each OSM way once, in route order).
  const seen = new Set<number>();
  const crossings = { total: 0, lowered: 0, unknown: 0, raised: 0 };
  const unknownPts: RoutePoint[] = [], rolledPts: RoutePoint[] = [], raisedPts: RoutePoint[] = [];
  const raisedAt: LngLat[] = [];
  let stepsM = 0, stepsAt: LngLat | null = null, liftAt: LngLat | null = null;
  const surfaceRuns: { from: number; to: number; value: string }[] = [];
  const inclines: { at: number; value: string }[] = [];
  for (const { from, to: end, e } of edgeAt) {
    const id = e.way_id;
    if (e.use === 'steps' || (id != null && index.s.has(id))) {
      stepsM += end - from;
      stepsAt ??= pointAt(shape, cum, from);
    }
    if (e.use === 'elevator') liftAt ??= pointAt(shape, cum, from);
    if (e.surface && UNSEALED.has(e.surface)) {
      const last = surfaceRuns[surfaceRuns.length - 1];
      if (last && from - last.to < 15) last.to = end; else surfaceRuns.push({ from, to: end, value: e.surface });
    }
    if (id == null || seen.has(id)) continue;
    const inc = index.i.get(id);
    if (inc) { seen.add(id); inclines.push({ at: from, value: inc }); continue; }
    const x = index.x.get(id);
    if (!x) continue;
    seen.add(id);
    crossings.total++;
    const at: LngLat = x[1] != null && x[2] != null ? [x[2], x[1]] : pointAt(shape, cum, (from + end) / 2);
    const pt = { at, near: nameNear((from + end) / 2) };
    const st = kerbState(x[0]);
    if (st === 'lowered') crossings.lowered++;
    else if (st === 'raised') { crossings.raised++; raisedPts.push(pt); raisedAt.push(at); }
    else if (st === 'rolled') { crossings.unknown++; rolledPts.push(pt); }
    else { crossings.unknown++; unknownPts.push(pt); }
  }

  if (stepsM > 0) checks.push({ kind: 'steps', at: stepsAt!, m: Math.round(stepsM), near: null });
  for (const p of raisedPts) checks.push({ kind: 'kerbRaised', at: p.at, near: p.near });

  // Where it ends.
  const end = shape[shape.length - 1];
  const endGapM = Math.round(metresBetween(end, [to.lng, to.lat]));
  if (endGapM > END_GAP_M) checks.push({ kind: 'endGap', at: end, m: endGapM, near: nameNear(total) });
  if (to.kind === 'venue') checks.push({ kind: 'noEntrance' });

  // Slopes (elevation model).
  const edgeGrade = (dist: number) => {
    const x = edgeAt.find(y => dist >= y.from && dist < y.to);
    if (!x || (x.e.max_upward_grade == null && x.e.max_downward_grade == null)) return Infinity;
    return Math.max(Math.abs(x.e.max_upward_grade ?? 0), Math.abs(x.e.max_downward_grade ?? 0));
  };
  const { stretches } = slopeStretches(elevation, edgeGrade);
  const climb = elevation.reduce((s, v, i) => (i && v > elevation[i - 1] ? s + v - elevation[i - 1] : s), 0);
  const descent = elevation.reduce((s, v, i) => (i && v < elevation[i - 1] ? s + elevation[i - 1] - v : s), 0);
  // Steep stretches one by one; 5–8% slopes as one item (the dashed line shows them).
  const moderate: RoutePoint[] = [];
  for (const s of stretches) {
    const item = { at: pointAt(shape, cum, s.from), m: Math.round(s.to - s.from), grade: s.grade, up: s.up, near: nameNear((s.from + s.to) / 2) };
    if (s.cls === 'steep') checks.push({ kind: 'steep', ...item });
    else moderate.push(item);
  }
  if (moderate.length) checks.push({ kind: 'moderate', points: moderate, count: moderate.length });
  if (unknownPts.length) checks.push({ kind: 'kerbUnknown', points: unknownPts, count: unknownPts.length });
  if (rolledPts.length) checks.push({ kind: 'kerbRolled', points: rolledPts, count: rolledPts.length });
  for (const r of surfaceRuns) {
    if (r.to - r.from >= MIN_STRETCH_M) {
      checks.push({ kind: 'surface', at: pointAt(shape, cum, r.from), m: Math.round(r.to - r.from), value: r.value, near: nameNear((r.from + r.to) / 2) });
    }
  }
  for (const i of inclines) checks.push({ kind: 'incline', at: pointAt(shape, cum, i.at), value: i.value, near: nameNear(i.at) });
  if (liftAt) checks.push({ kind: 'lift', at: liftAt, near: null });

  // The line, split by slope class (only the stretches we list, so map and list agree).
  const segments: RouteSegment[] = [];
  const classAt = (dist: number): Grade => stretches.find(s => dist >= s.from && dist < s.to)?.cls ?? 'gentle';
  for (let i = 1; i < shape.length; i++) {
    const g = classAt((cum[i - 1] + cum[i]) / 2);
    const last = segments[segments.length - 1];
    if (last && last.grade === g) last.coords.push(shape[i]);
    else segments.push({ grade: g, coords: [shape[i - 1], shape[i]] });
  }

  const wayAt = (dist: number): RouteStep['way'] => {
    const use = edgeAt.find(x => dist >= x.from && dist < x.to)?.e.use || '';
    if (use === 'pedestrian_crossing') return 'crossing';
    if (['footway', 'sidewalk', 'pedestrian', 'living_street'].includes(use)) return 'footpath';
    if (['road', 'service_road', 'driveway', 'alley', 'parking_aisle'].includes(use)) return 'street';
    return 'path';
  };
  let walked = 0;
  const steps: RouteStep[] = maneuvers.map(m => {
    const step: RouteStep = {
      type: stepType(m.type), street: m.street_names?.[0] ?? null,
      m: Math.round(m.length * 1000), at: shape[Math.min(shape.length - 1, m.begin_shape_index)] ?? shape[0],
    };
    if (!step.street) step.way = wayAt(walked + 1);
    walked += m.length * 1000;
    return step;
  });

  return {
    summary: { m: Math.round(input.lengthKm * 1000), minutes: Math.max(1, Math.round(input.timeS / 60)), climbM: Math.round(climb), descentM: Math.round(descent) },
    segments, steps, checks, crossings, raisedAt, endGapM,
  };
}

// ── Choosing between Valhalla's alternatives ────────────────────────────────
/** Lower is better: mapped steps, then raised kerbs, then crossings without
 *  kerb info — so a route over unknown kerbs is never ranked above one over
 *  mapped lowered kerbs — then length. Alternatives more than 50% (and 300 m)
 *  longer than the shortest are not considered. */
export function rankCandidates<T extends { a: Analysis }>(list: T[]): T[] {
  if (list.length < 2) return list;
  const shortest = Math.min(...list.map(c => c.a.summary.m));
  const ok = list.filter(c => c.a.summary.m <= Math.max(shortest * 1.5, shortest + 300));
  const key = (c: T) => [
    c.a.checks.some(x => x.kind === 'steps') ? 1 : 0, c.a.crossings.raised, c.a.crossings.unknown, c.a.summary.m,
  ];
  return [...ok].sort((p, q) => {
    const x = key(p), y = key(q);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
  });
}

/** Most important first; then numbers for map markers in reading order. */
const ORDER = ['steps', 'kerbRaised', 'venueReport', 'barrier', 'endGap', 'noEntrance', 'steep', 'kerbUnknown', 'kerbRolled', 'moderate', 'surface', 'incline', 'lift'];
export function orderAndNumber(checks: RouteCheck[]): RouteCheck[] {
  const sorted = [...checks].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  let n = 0;
  return sorted.map(c => {
    if (c.kind === 'moderate') return c; // shown by the dashed line, not numbered
    if (c.points) return { ...c, points: c.points.map(p => ({ ...p, n: ++n })) };
    return c.at ? { ...c, n: ++n } : c;
  });
}
