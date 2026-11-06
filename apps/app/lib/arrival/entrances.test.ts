// npx tsx lib/arrival/entrances.test.ts
import assert from 'node:assert/strict';
import {
  compass, defaultMapsApp, directionsUrl, distanceM, entranceStatus, offset, rankEntrances, roundM, routable,
  type EntranceVM,
} from './entrances';

const venue = { lat: -33.7975, lng: 151.2861 };
const D = (d: number) => new Date(Date.UTC(2026, 10, d)).toISOString();
const e = (over: Partial<EntranceVM>): EntranceVM => ({
  id: 'x', source: 'community', kind: 'back', lat: venue.lat, lng: venue.lng, locatedBy: 'pin', note: null,
  at: D(1), yes: 0, lastYes: null, changed: 0, lastChanged: null, status: 'current', ...over,
});

// Geometry: 40 m south-west is about 40 m away, to the south-west.
const sw = offset(offset(venue, -28.3, 0), 0, -28.3);
assert.ok(Math.abs(distanceM(venue, sw) - 40) < 0.5);
assert.equal(compass(venue, sw), 'sw');
assert.equal(compass(venue, offset(venue, 30, 0)), 'n');
assert.equal(roundM(37), 35);
assert.equal(roundM(2), 5);
assert.equal(roundM(143), 140);

// "Changed" after the last sign of life stops directions; a later "Yes" restores them.
assert.equal(entranceStatus(D(1), null, null), 'current');
assert.equal(entranceStatus(D(1), null, D(2)), 'changed');
assert.equal(entranceStatus(D(1), D(3), D(2)), 'current');
assert.equal(entranceStatus(D(5), null, D(2)), 'current');

// Directions only go to community-marked, current entrances with a point.
assert.equal(routable(e({})), true);
assert.equal(routable(e({ status: 'changed' })), false);
assert.equal(routable(e({ source: 'osm' })), false);
assert.equal(routable(e({ lat: null, lng: null })), false);
assert.equal(routable(null), false);

// Ranking: community before OSM, current before changed, a point before none,
// more "Yes" first, then newest.
const ranked = rankEntrances([
  e({ id: 'osm', source: 'osm', yes: 9 }),
  e({ id: 'changed', status: 'changed', yes: 5 }),
  e({ id: 'words', lat: null, lng: null, yes: 5 }),
  e({ id: 'old', yes: 1, at: D(1) }),
  e({ id: 'new', yes: 1, at: D(4) }),
  e({ id: 'confirmed', yes: 2 }),
]);
assert.deepEqual(ranked.map(x => x.id), ['confirmed', 'new', 'old', 'words', 'changed', 'osm']);

// Deep links.
assert.equal(directionsUrl('google', { lat: -33.8, lng: 151.28 }), 'https://www.google.com/maps/dir/?api=1&destination=-33.800000,151.280000');
assert.equal(directionsUrl('apple', { lat: -33.8, lng: 151.28 }), 'https://maps.apple.com/?daddr=-33.800000,151.280000');
assert.equal(defaultMapsApp('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'apple');
assert.equal(defaultMapsApp('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', true), 'apple'); // iPadOS
assert.equal(defaultMapsApp('Mozilla/5.0 (Linux; Android 15)'), 'google');
assert.equal(defaultMapsApp('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'google');

console.log('entrances.test: ok');
