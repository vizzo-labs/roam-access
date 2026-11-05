// npx tsx lib/sensory/summary.test.ts
import assert from 'node:assert/strict';
import type { Review, SensoryReport } from '../db/schema';
import { buildSensoryVM, dimSummaries, isQuietNow, quietHours, quietNow, hasQuietTimes } from './summary';
import { slotOf, dayKindOf } from './defs';

const T = (iso: string) => new Date(iso);
// Sydney is UTC+11 in November: 2026-11-04T21:00Z = Thu 5 Nov 8am (weekday, early).
const THU_8AM = '2026-11-04T21:00:00Z';
const SAT_8AM = '2026-11-06T21:00:00Z';
const SAT_7PM = '2026-11-07T08:00:00Z';
const LAST_THU_8AM = T('2026-10-28T21:00:00Z'); // a week earlier: pattern, not "right now"
assert.equal(slotOf(THU_8AM), 'early');
assert.equal(dayKindOf(THU_8AM), 'weekday');
assert.equal(dayKindOf(SAT_8AM), 'weekend');
assert.equal(slotOf(SAT_7PM), 'evening');

const review = (id: string, o: Partial<Review>): Review => ({
  id, venueId: 'v', userId: 'u-' + id, verdict: 'works', needs: [], features: {}, note: null, hidden: false,
  createdAt: T(THU_8AM), entranceAlt: null, entranceNote: null,
  sensoryNoise: null, sensoryLight: null, sensoryCrowd: null, quietTimes: [], ...o,
});
const report = (id: string, o: Partial<SensoryReport>): SensoryReport => ({
  id, venueId: 'v', userId: 'u', reviewId: null, noise: null, light: null, crowd: null,
  slot: 'early', dayKind: 'weekday', observedAt: T(THU_8AM), hidden: false, createdAt: T(THU_8AM), ...o,
});

// Nothing said → no summary.
assert.equal(buildSensoryVM([], []), null);

// One reviewer: quiet visit before 10am AND "usually quiet before 10am" → one report, not two.
{
  const r = review('r1', { sensoryNoise: 'quiet', quietTimes: ['early'] });
  const vm = buildSensoryVM([r], [report('p1', { reviewId: 'r1', noise: 'quiet' })]);
  const h = quietHours(vm);
  assert.equal(h.length, 1);
  assert.equal(h[0].n, 1);
  assert.equal(h[0].usually, false);
  assert.equal(vm!.n, 1); // the linked report doesn't double the overall count
}

// Two people → "usually"; both weekday → "on weekdays"; busy evenings aren't quiet hours.
{
  const vm = buildSensoryVM([], [
    report('a', { noise: 'quiet', crowd: 'few', observedAt: LAST_THU_8AM }),
    report('b', { noise: 'quiet', observedAt: LAST_THU_8AM }),
    report('c', { noise: 'loud', slot: 'evening', dayKind: 'weekend', observedAt: LAST_THU_8AM }),
  ]);
  const h = quietHours(vm);
  assert.deepEqual(h.map(x => [x.slot, x.n, x.usually, x.day]), [['early', 2, true, 'weekday']]);
  assert.equal(hasQuietTimes(vm), true);
  // Thursday 8am → usually quiet now; Saturday 8am → not (weekday-only).
  assert.equal(quietNow(vm, +T(THU_8AM) + 3600e3)?.kind, 'usually-quiet');
  assert.equal(isQuietNow(vm, +T(SAT_8AM)), false);
  // Noise: 2 quiet vs 1 loud → majority quiet.
  const noise = dimSummaries(vm).find(d => d.dim === 'noise')!;
  assert.equal(noise.id, 'quiet');
  assert.equal(noise.n, 2);
}

// A check-in in the last 90 minutes wins over the pattern.
{
  const now = +T(THU_8AM);
  const vm = buildSensoryVM([], [
    report('a', { noise: 'quiet', observedAt: LAST_THU_8AM }), report('b', { noise: 'quiet', observedAt: LAST_THU_8AM }),
    report('live', { noise: 'loud', crowd: 'busy', observedAt: new Date(now - 20 * 60e3) }),
  ], now);
  const q = quietNow(vm, now);
  assert.equal(q?.kind, 'live');
  assert.equal(q?.kind === 'live' && q.reading, 'busy');
  assert.equal(isQuietNow(vm, now), false);
  // 90+ minutes later the check-in is stale: back to the pattern (still before 10am).
  assert.equal(quietNow(vm, now + 75 * 60e3)?.kind, 'usually-quiet');
}

// A tie is "mixed", never the calmer answer.
{
  const vm = buildSensoryVM([review('x', { sensoryLight: 'soft' }), review('y', { sensoryLight: 'harsh' })], []);
  const light = dimSummaries(vm).find(d => d.dim === 'light')!;
  assert.equal(light.id, null);
}

console.log('sensory summary — ok');
