// npx tsx lib/contributors/contributors.test.ts
// Brief L: who wrote a review, ally observations, contributor badges.
import assert from 'node:assert/strict';
import type { Review, Venue } from '../db/schema';
import { buildReviewVM, buildVenueVM, featureCounts, hasVerdict } from '../venues';
// The app's own verdict engine (plain JS).
import { ra2Verdict } from '../pilot/match';
import { authorOf, cleanPublicName, suggestPublicName, withAuthor, type AuthorRow } from './author';
import { badgeStates, earnedBadges } from './badges';

const venue: Venue = {
  id: 'v1', osmType: 'node', osmId: 1, name: 'Test Café', kind: 'Cafe', cat: 'food', suburb: 'Manly',
  address: null, lat: -33.8, lng: 151.28, phone: null, website: null, osmTags: { wheelchair: 'yes' },
  active: true, createdAt: new Date('2026-10-01'), updatedAt: new Date('2026-10-01'),
};
let seq = 0;
const review = (o: Partial<Review>): Review => ({
  id: `00000000-0000-0000-0000-${String(++seq).padStart(12, '0')}`, venueId: 'v1', userId: 'u' + seq,
  verdict: 'works', needs: ['mobility'], features: {}, note: null, hidden: false,
  createdAt: new Date('2026-11-01T00:00:00Z'), entranceAlt: null, entranceNote: null,
  sensoryNoise: null, sensoryLight: null, sensoryCrowd: null, quietTimes: [], writtenAs: null, ...o,
});

// ── 1. Ally observations never set or change a verdict ────────────────────
const lived = review({ verdict: 'works', features: { stepfree: 'yes' } });
const allyNo = review({ verdict: null, writtenAs: 'ally', needs: [], features: { stepfree: 'no', bathroom: 'no' }, entranceAlt: 'side' });
const allyYes = review({ verdict: null, writtenAs: 'ally', needs: [], features: { bathroom: 'yes', seating: 'yes' } });

assert.equal(hasVerdict(lived), true);
assert.equal(hasVerdict(allyNo), false);

const without = buildVenueVM(venue, [lived]);
const withObs = buildVenueVM(venue, [lived, allyNo, allyYes]);
// Verdict facts, counts, evidence and freshness are identical.
for (const k of ['works', 'check', 'barriers', 'verified', 'ev', 'lastReview', 'note'] as const) {
  assert.deepEqual(withObs[k], without[k], `observations changed ${k}`);
}
for (const needs of [[], ['mobility'], ['vision'], ['mobility', 'chronic']]) {
  assert.deepEqual(ra2Verdict(withObs, needs).kind, ra2Verdict(without, needs).kind, `verdict changed for ${needs}`);
}
assert.equal(withObs.verified, 1);
assert.equal(withObs.observations, 2);
// They feed facts of their own, labelled as an ally's.
assert.ok(withObs.observed.length >= 3);
assert.ok(withObs.observed.every(f => f.src === 'ally'));
assert.ok(withObs.observed.some(f => f.tags.includes('stepfree') && f.kind === 'absence'));
assert.ok(withObs.observed.some(f => f.kind === 'entrance'));
assert.equal(featureCounts([allyNo, allyYes]).size, 0, 'featureCounts must ignore observations');

// Observations alone never make a place "Works for you" (or anything else).
const onlyObs = buildVenueVM({ ...venue, osmTags: {} }, [allyYes, review({ verdict: null, writtenAs: 'ally', features: { stepfree: 'yes' } })]);
assert.equal(onlyObs.works.length + onlyObs.check.length + onlyObs.barriers.length, 0);
assert.equal(ra2Verdict(onlyObs, ['mobility']).kind, 'unknown');
assert.equal(ra2Verdict(onlyObs, []).kind, 'unknown');
assert.equal(onlyObs.verified, 0);

// A review VM for an observation has no verdict and its own default text.
const obsVM = buildReviewVM(allyYes, 'someone');
assert.equal(obsVM.v, null);
assert.equal(obsVM.textKey, 'contrib.observed.default');
// A carer's review is about the person they were with.
assert.equal(buildReviewVM(review({ verdict: 'barrier', writtenAs: 'carer' }), 'x').textKey, 'contrib.carer.default.barrier');

// ── 2. Who wrote it — and needs only with consent ─────────────────────────
const row = (o: Partial<AuthorRow>): AuthorRow => ({
  publicName: 'Sam K.', postAnonymously: false, relationship: 'lived', showNeeds: false, publicId: 'abc123def456', ...o,
});
const vm = buildReviewVM(review({ needs: ['mobility', 'vision'] }), 'viewer');

// Never chosen (every account before this feature): exactly as before.
const legacy = withAuthor(vm, row({ relationship: null }));
assert.equal(legacy.author.legacy, true);
assert.equal(legacy.who, vm.who);
assert.deepEqual(legacy.needs, vm.needs);
assert.equal(legacy.author.name, null);
assert.equal(legacy.author.publicId, null);

// Named, lived experience, needs NOT shown: no needs anywhere in the payload.
const named = withAuthor(vm, row({}));
assert.equal(named.author.name, 'Sam K.');
assert.equal(named.author.publicId, 'abc123def456');
assert.equal(named.author.rel, 'lived');
assert.deepEqual(named.needs, []);
assert.deepEqual(named.filters, []);
assert.equal(named.whoNeed, null);
assert.equal(named.who, 'Sam K. · Lived experience');
assert.ok(!JSON.stringify(named).includes('mobility'), 'needs leaked without consent');

// With consent.
const shown = withAuthor(vm, row({ showNeeds: true }));
assert.equal(shown.who, 'Sam K. · Lived experience · Wheelchair or mobility aid user (+1)');
assert.deepEqual(shown.needs, ['mobility', 'vision']);

// Anonymous: "Roam Access member", no profile link.
const anon = withAuthor(vm, row({ postAnonymously: true, relationship: 'ally' }));
assert.equal(anon.author.name, null);
assert.equal(anon.author.publicId, null);
assert.equal(anon.who, 'Roam Access member · Ally');
// An admin cleared the name: same as anonymous.
assert.equal(withAuthor(vm, row({ publicName: null })).author.publicId, null);
// "Prefer not to say" shows no label.
assert.equal(withAuthor(vm, row({ relationship: 'unsaid' })).who, 'Sam K.');
// The relationship a review was written as wins over the current one.
const carerVM = buildReviewVM(review({ writtenAs: 'carer' }), 'v');
assert.equal(withAuthor(carerVM, row({ relationship: 'lived' })).author.rel, 'carer');
assert.equal(withAuthor(carerVM, row({ relationship: 'lived' })).who, 'Sam K. · Carer');
assert.equal(authorOf(null).legacy, true);

// Names.
assert.equal(suggestPublicName('Samantha', 'king'), 'Samantha K.');
assert.equal(suggestPublicName('', '', 'Jo Bloggs'), 'Jo B.');
assert.equal(suggestPublicName(null, null, 'Alex'), 'Alex');
assert.equal(suggestPublicName(null, null, ''), '');
assert.equal(cleanPublicName('  Sam \n\u0000 K. '), 'Sam K.');
assert.equal(cleanPublicName('x'.repeat(60))!.length, 30);
assert.equal(cleanPublicName('   '), null);
assert.equal(cleanPublicName(42), null);

// ── 3. Contributor badges ─────────────────────────────────────────────────
const none = { reviews: 0, entrances: 0, photos: 0, steps: 0, helped: 0, founding: false, mapper: false };
assert.deepEqual(earnedBadges(none), []);
assert.deepEqual(earnedBadges({ ...none, reviews: 1 }), ['first']);
assert.deepEqual(earnedBadges({ ...none, reviews: 5 }), ['first', 'regular']);
assert.deepEqual(earnedBadges({ ...none, reviews: 15 }), ['first', 'regular', 'local']);
assert.deepEqual(earnedBadges({ ...none, reviews: 50 }), ['first', 'regular', 'local', 'champion']);
assert.deepEqual(earnedBadges({ ...none, entrances: 3, photos: 10, steps: 3, founding: true, mapper: true }),
  ['entrance', 'photographer', 'pathfinder', 'founding', 'mapper']);
assert.deepEqual(earnedBadges({ ...none, entrances: 2, photos: 9, steps: 2 }), []);
const regular = badgeStates({ ...none, reviews: 3 }).find(b => b.id === 'regular')!;
assert.deepEqual([regular.have, regular.goal, regular.earned], [3, 5, false]);

console.log('contributors: ok');
