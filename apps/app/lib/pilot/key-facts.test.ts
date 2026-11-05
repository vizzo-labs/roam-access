// npx tsx lib/pilot/key-facts.test.ts
import assert from 'node:assert/strict';
import { firstQuestion, keyFacts } from './key-facts';

const fact = (tags: string[], src: string, kind: string) => ({ tags, src, kind });
const venue = {
  works: [fact(['bathroom'], 'community', 'feature')],
  check: [fact(['hearing'], 'osm', 'hint'), fact(['quiet'], 'community', 'mixed')],
  barriers: [fact(['stepfree'], 'community', 'absence')],
};

// Wheelchair user: step (barrier) first, then the loo.
assert.deepEqual(keyFacts(venue, ['mobility']), [
  { feature: 'stepfree', state: 'no' }, { feature: 'bathroom', state: 'yes' },
]);
// OpenStreetMap is never more than "unconfirmed".
assert.deepEqual(keyFacts(venue, ['hearing']), [{ feature: 'hearing', state: 'unconfirmed' }]);
assert.deepEqual(keyFacts(venue, ['autism']), [{ feature: 'quiet', state: 'mixed' }]);
// No needs set: every feature with data, capped.
assert.equal(keyFacts(venue, []).length, 3);
// Another way in turns a step into "alt", not "no".
const alt = { works: [fact(['stepfree'], 'community', 'entrance')], check: [fact(['stepfree'], 'community', 'absence')], barriers: [] };
assert.deepEqual(keyFacts(alt, ['mobility']), [{ feature: 'stepfree', state: 'alt' }]);
// Experience facts ("1 wheelchair user said it worked") aren't feature facts.
assert.deepEqual(keyFacts({ works: [fact(['stepfree', 'bathroom'], 'community', 'experience')], check: [], barriers: [] }, ['mobility']), []);
// The question for a place with nothing known: the first of my features.
assert.equal(firstQuestion({ works: [], check: [], barriers: [] }, ['autism']), 'quiet');
assert.equal(firstQuestion(venue, ['mobility', 'chronic']), 'seats');
console.log('key-facts: ok');
