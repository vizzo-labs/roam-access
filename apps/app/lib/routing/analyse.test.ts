// npx tsx lib/routing/analyse.test.ts
import assert from 'node:assert/strict';
import { analyseRoute, kerbState, orderAndNumber, rankCandidates, slopeStretches, stepType, type Analysis, type ChecksIndex } from './analyse';
import type { LngLat } from './types';

// Kerbs: unknown is never "fine"; one mapped kerb is still unknown.
assert.equal(kerbState('LL'), 'lowered');
assert.equal(kerbState('LF'), 'lowered');
assert.equal(kerbState(''), 'unknown');
assert.equal(kerbState('L'), 'unknown');
assert.equal(kerbState('LU'), 'unknown');
assert.equal(kerbState('LR'), 'raised');
assert.equal(kerbState('rL'), 'rolled');

// Maneuver types.
assert.equal(stepType(1), 'start');
assert.equal(stepType(15), 'left');
assert.equal(stepType(10), 'right');
assert.equal(stepType(4), 'arrive');
assert.equal(stepType(39), 'lift');

// Slopes: flat → nothing; a 10% climb over 100 m → one steep uphill stretch;
// capped by Valhalla's edge grade (6%) → moderate.
assert.equal(slopeStretches(Array(30).fill(5)).stretches.length, 0);
const hill = [...Array(10).fill(0), ...Array.from({ length: 11 }, (_, i) => i), ...Array(10).fill(10)];
const s = slopeStretches(hill).stretches;
assert.equal(s.length, 1);
assert.equal(s[0].cls, 'steep');
assert.equal(s[0].up, true);
assert.ok(s[0].to - s[0].from >= 90);
assert.equal(slopeStretches(hill, () => 6).stretches[0].cls, 'moderate');
// Short bumps (< 30 m) are not reported.
assert.equal(slopeStretches([0, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 0]).stretches.length, 0);

// A whole route: 3 edges, one crossing with no kerbs, one with lowered kerbs, ends 40 m short.
const shape: LngLat[] = [[151.28, -33.80], [151.281, -33.80], [151.282, -33.80], [151.283, -33.80]];
const index: ChecksIndex = {
  osmDate: '2026-11-04T21:21:03Z',
  x: new Map([[2, ['', -33.80, 151.2815]], [3, ['LL', -33.80, 151.2825]]]),
  s: new Set(), i: new Map(),
};
const a = analyseRoute({
  shape, elevation: Array(29).fill(3), lengthKm: 0.28, timeS: 300,
  maneuvers: [{ type: 1, street_names: ['The Corso'], length: 0.28, begin_shape_index: 0 }, { type: 4, length: 0, begin_shape_index: 3 }],
  edges: [{ way_id: 1, length: 0.093, names: ['The Corso'] }, { way_id: 2, length: 0.093, use: 'pedestrian_crossing' }, { way_id: 3, length: 0.093 }],
  to: { lat: -33.80, lng: 151.2835, kind: 'venue' }, index,
});
assert.deepEqual(a.crossings, { total: 2, lowered: 1, unknown: 1, raised: 0 });
assert.ok(a.checks.some(c => c.kind === 'kerbUnknown' && c.count === 1 && c.points?.[0].near === 'The Corso'));
assert.ok(a.checks.some(c => c.kind === 'endGap' && (c.m ?? 0) > 25));
assert.ok(a.checks.some(c => c.kind === 'noEntrance'));
assert.equal(a.steps[0].type, 'start');
assert.equal(a.steps[0].street, 'The Corso');
assert.equal(a.summary.minutes, 5);

// Ranking: a route over unknown kerbs never beats one over mapped lowered kerbs
// (within the length budget); steps and raised kerbs rank last.
const fake = (m: number, unknown: number, raised = 0, steps = false) => ({
  id: `${m}-${unknown}`,
  a: { summary: { m }, crossings: { total: 3, lowered: 3 - unknown, unknown, raised }, checks: steps ? [{ kind: 'steps' }] : [] } as unknown as Analysis,
});
assert.equal(rankCandidates([fake(1000, 3), fake(1100, 0)])[0].id, '1100-0');
assert.equal(rankCandidates([fake(1000, 0, 1), fake(1200, 2)])[0].id, '1200-2');
assert.equal(rankCandidates([fake(1000, 0, 0, true), fake(1200, 2)])[0].id, '1200-2');
// …but not a detour more than 50% (and 300 m) longer.
assert.equal(rankCandidates([fake(1000, 3), fake(2000, 0)])[0].id, '1000-3');

// Numbering follows the list order (most important first).
const numbered = orderAndNumber([
  { kind: 'moderate', points: [{ at: [0, 0], near: null, grade: 6, m: 40, up: true }], count: 1 }, { kind: 'kerbUnknown', points: [{ at: [0, 0], near: null }, { at: [1, 1], near: null }] }, { kind: 'steep', at: [2, 2] },
]);
assert.deepEqual(numbered.map(c => c.kind), ['steep', 'kerbUnknown', 'moderate']);
assert.equal(numbered[0].n, 1);
assert.deepEqual(numbered[1].points?.map(p => p.n), [2, 3]);
assert.equal(numbered[2].points?.[0].n, undefined); // slopes 5–8%: not numbered

console.log('analyse.test.ts: all passed');
