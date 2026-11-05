// Sensory content (#17): reviews + check-ins → the compact summary sent with
// each venue (buildSensoryVM, server), and the time-dependent reads the
// screens make from it (quiet hours, "quiet now"). Pure — no server imports.
// Nothing here feeds ra2Verdict: sensory facts never change a verdict.

import type { Review, SensoryReport } from '../db/schema';
import {
  classify, dayKindOf, slotOf, LIVE_WINDOW_MS, SENSORY_DIMS, SLOTS,
  type SensoryDim, type SensorySlot, type SensoryDayKind,
} from './defs';

export type SlotStat = {
  quiet: number; some: number; busy: number;
  votes: number;                                   // "usually quiet then" from reviews
  quietDays: { weekday: number; weekend: number; unknown: number }; // day of each quiet report
};
export type LiveCheck = { at: string; noise: string | null; crowd: string | null; light: string | null };
export type SensoryVM = {
  n: number;                                         // observations behind the summary
  noise: Record<string, number>; light: Record<string, number>; crowd: Record<string, number>;
  slots: Partial<Record<SensorySlot, SlotStat>>;
  live: LiveCheck[];                                 // check-ins in the last 24 h, newest first
  last: string | null;                               // newest observation
};

const LIVE_KEEP_MS = 24 * 3600 * 1000;
const iso = (d: Date | string) => new Date(d).toISOString();

/** reviews: visible reviews of one place; reports: its visible sensory_reports. */
export function buildSensoryVM(reviews: Review[], reports: SensoryReport[], now = Date.now()): SensoryVM | null {
  const vm: SensoryVM = { n: 0, noise: {}, light: {}, crowd: {}, slots: {}, live: [], last: null };
  let last = 0;
  const add = (o: { noise?: string | null; light?: string | null; crowd?: string | null }, at: Date) => {
    if (!o.noise && !o.light && !o.crowd) return;
    vm.n++;
    if (o.noise) vm.noise[o.noise] = (vm.noise[o.noise] || 0) + 1;
    if (o.light) vm.light[o.light] = (vm.light[o.light] || 0) + 1;
    if (o.crowd) vm.crowd[o.crowd] = (vm.crowd[o.crowd] || 0) + 1;
    last = Math.max(last, +at);
  };
  const slot = (id: SensorySlot) => (vm.slots[id] ||= { quiet: 0, some: 0, busy: 0, votes: 0, quietDays: { weekday: 0, weekend: 0, unknown: 0 } });

  // Overall: each review once (its own answers), plus each check-in. A review's
  // linked report repeats the review's answers, so it only feeds time of day.
  // A review's "usually quiet then" vote and its own quiet visit in the same
  // slot are one person saying one thing: count it once.
  const quietVisit = new Set(reports.filter(p => p.reviewId && classify(p) === 'quiet').map(p => `${p.reviewId}:${p.slot}`));
  for (const r of reviews) {
    add({ noise: r.sensoryNoise, light: r.sensoryLight, crowd: r.sensoryCrowd }, r.createdAt);
    for (const s of r.quietTimes || []) {
      if (!SLOTS.some(x => x.id === s) || quietVisit.has(`${r.id}:${s}`)) continue;
      slot(s).votes++;
      last = Math.max(last, +r.createdAt);
    }
  }
  for (const p of reports) {
    if (!p.reviewId) add(p, p.observedAt);
    const c = classify(p);
    if (!c) continue;
    const st = slot(p.slot);
    st[c]++;
    if (c === 'quiet') st.quietDays[p.dayKind ?? 'unknown']++;
    if (!p.reviewId && now - +p.observedAt < LIVE_KEEP_MS) {
      vm.live.push({ at: iso(p.observedAt), noise: p.noise, crowd: p.crowd, light: p.light });
    }
  }
  if (!vm.n && !Object.keys(vm.slots).length) return null;
  vm.live.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  vm.last = last ? new Date(last).toISOString() : null;
  return vm;
}

// ── Reads (client and server) ─────────────────────────────────────────────

export type DimSummary = {
  dim: SensoryDim; id: string | null;  // id null = mixed reports
  n: number; total: number; counts: Record<string, number>;
};

/** The most-reported answer per dimension. A tie, or no majority, is "mixed". */
export function dimSummaries(vm: SensoryVM | null | undefined): DimSummary[] {
  if (!vm) return [];
  const out: DimSummary[] = [];
  for (const d of SENSORY_DIMS) {
    const counts = vm[d.id];
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (!total) continue;
    // Ties go to the more intense option (the cautious reading).
    const ranked = [...d.options].reverse().sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    const top = ranked[0];
    const n = counts[top.id] || 0;
    const majority = n * 2 > total;
    out.push({ dim: d.id, id: majority ? top.id : null, n, total, counts });
  }
  return out;
}

export type QuietHour = { slot: SensorySlot; n: number; busy: number; usually: boolean; day: SensoryDayKind | null };

/** Times of day people say are quiet, in order. `usually` needs 2+ reports. */
export function quietHours(vm: SensoryVM | null | undefined): QuietHour[] {
  if (!vm) return [];
  const out: QuietHour[] = [];
  for (const s of SLOTS) {
    const st = vm.slots[s.id];
    if (!st) continue;
    const n = st.quiet + st.votes;
    if (!n || n <= st.busy) continue;
    // "on weekdays" only when every report behind it says the same day kind.
    const d = st.quietDays;
    const day = st.votes || d.unknown ? null : d.weekend && !d.weekday ? 'weekend' : d.weekday && !d.weekend ? 'weekday' : null;
    out.push({ slot: s.id, n, busy: st.busy, usually: n >= 2, day });
  }
  return out;
}

export type QuietNow =
  | { kind: 'live'; reading: 'quiet' | 'some' | 'busy'; at: string; check: LiveCheck }
  | { kind: 'usually-quiet'; hour: QuietHour }
  | { kind: 'usually-busy'; slot: SensorySlot; n: number }
  | null;

/** "Is it quiet now?" — a check-in from the last 90 minutes wins; otherwise
 *  what people report for this time of day. */
export function quietNow(vm: SensoryVM | null | undefined, now = Date.now()): QuietNow {
  if (!vm) return null;
  const recent = vm.live.find(c => now - +new Date(c.at) < LIVE_WINDOW_MS && classify(c));
  if (recent) return { kind: 'live', reading: classify(recent)!, at: recent.at, check: recent };
  const slot = slotOf(now), day = dayKindOf(now);
  const hour = quietHours(vm).find(h => h.slot === slot && (!h.day || h.day === day));
  if (hour) return { kind: 'usually-quiet', hour };
  const st = vm.slots[slot];
  if (st && st.busy >= 2 && st.busy > st.quiet + st.votes) return { kind: 'usually-busy', slot, n: st.busy };
  return null;
}

export const isQuietNow = (vm: SensoryVM | null | undefined, now = Date.now()) => {
  const q = quietNow(vm, now);
  return !!q && (q.kind === 'usually-quiet' || (q.kind === 'live' && q.reading === 'quiet'));
};
export const hasQuietTimes = (vm: SensoryVM | null | undefined) => quietHours(vm).length > 0;

/** Per time of day: what most reports say (for the "through the day" list). */
export function slotReadings(vm: SensoryVM | null | undefined) {
  if (!vm) return [];
  return SLOTS.flatMap(s => {
    const st = vm.slots[s.id];
    if (!st) return [];
    const quiet = st.quiet + st.votes, total = quiet + st.some + st.busy;
    if (!total) return [];
    const reading: 'quiet' | 'some' | 'busy' | 'mixed' =
      quiet * 2 > total ? 'quiet' : st.busy * 2 > total ? 'busy' : st.some * 2 > total ? 'some' : 'mixed';
    return [{ slot: s.id, reading, total, quiet, some: st.some, busy: st.busy }];
  });
}
