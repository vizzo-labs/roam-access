// Seed real venues for the pilot area from OpenStreetMap (© OpenStreetMap
// contributors, ODbL). Idempotent: re-running updates names/tags in place and
// never changes a venue's id, so reviews stay attached.
//
//   npm run db:seed [-- --dry]
//
// Writes to the database chosen by lib/db/url.ts: the DEV database unless
// VERCEL_ENV=production. Never point this at production by hand.

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { venues } from '../lib/db/schema';
import { pickDatabaseUrl, describeDatabaseUrl } from '../lib/db/url';

// Manly, Fairlight, Queenscliff, Balgowlah and the walk to Shelly Beach.
const BBOX = { south: -33.8150, west: 151.2580, north: -33.7800, east: 151.3020 };

// Known suburb centres, used when a place has no addr:suburb.
const SUBURBS: [string, number, number][] = [
  ['Manly', -33.7980, 151.2860],
  ['Fairlight', -33.7945, 151.2735],
  ['Queenscliff', -33.7840, 151.2860],
  ['Balgowlah', -33.7935, 151.2630],
  ['Manly Vale', -33.7850, 151.2650],
  ['Clontarf', -33.8060, 151.2560],
];

type Rule = { key: string; values: Record<string, { kind: string; cat: string }> };
const RULES: Rule[] = [
  { key: 'amenity', values: {
    cafe: { kind: 'Cafe', cat: 'food' }, restaurant: { kind: 'Restaurant', cat: 'food' },
    bar: { kind: 'Bar', cat: 'food' }, pub: { kind: 'Pub', cat: 'food' },
    fast_food: { kind: 'Takeaway', cat: 'food' }, ice_cream: { kind: 'Ice cream', cat: 'food' },
    biergarten: { kind: 'Beer garden', cat: 'food' }, food_court: { kind: 'Food court', cat: 'food' },
    theatre: { kind: 'Theatre', cat: 'music' }, cinema: { kind: 'Cinema', cat: 'music' },
    nightclub: { kind: 'Nightclub', cat: 'music' }, music_venue: { kind: 'Music venue', cat: 'music' },
    arts_centre: { kind: 'Arts centre', cat: 'arts' }, library: { kind: 'Library', cat: 'arts' },
  } },
  { key: 'tourism', values: {
    museum: { kind: 'Museum', cat: 'arts' }, gallery: { kind: 'Gallery', cat: 'arts' },
    aquarium: { kind: 'Aquarium', cat: 'arts' },
    hotel: { kind: 'Hotel', cat: 'stay' }, motel: { kind: 'Motel', cat: 'stay' },
    hostel: { kind: 'Hostel', cat: 'stay' }, guest_house: { kind: 'Guest house', cat: 'stay' },
  } },
  { key: 'leisure', values: {
    park: { kind: 'Park', cat: 'parks' }, garden: { kind: 'Garden', cat: 'parks' },
    nature_reserve: { kind: 'Nature reserve', cat: 'parks' },
    swimming_pool: { kind: 'Swimming pool', cat: 'parks' },
  } },
  { key: 'natural', values: { beach: { kind: 'Beach', cat: 'parks' } } },
];

// Only the tags worth keeping: access hints and contact details.
const KEEP = /^(wheelchair|wheelchair:description|toilets:wheelchair|toilets|hearing_loop|tactile_paving|opening_hours|cuisine|outdoor_seating|addr:.*|phone|contact:phone|website|contact:website|sport|access|fee)$/;

type El = { type: 'node' | 'way' | 'relation'; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

function overpassQuery() {
  const b = `${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east}`;
  const parts = RULES.map(r => `nwr["${r.key}"~"^(${Object.keys(r.values).join('|')})$"]["name"](${b});`);
  return `[out:json][timeout:90];(${parts.join('')});out center tags;`;
}

function slugify(s: string) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

function nearestSuburb(lat: number, lng: number) {
  let best = SUBURBS[0][0], bestD = Infinity;
  for (const [name, la, ln] of SUBURBS) {
    const d = (la - lat) ** 2 + (ln - lng) ** 2;
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

function classify(tags: Record<string, string>) {
  for (const r of RULES) {
    const hit = r.values[tags[r.key]];
    if (hit) {
      // Ocean pools are the Northern Beaches' signature — name them as such.
      if (hit.kind === 'Swimming pool' && /ocean|rock|bower/i.test(tags.name || '')) return { kind: 'Ocean pool', cat: 'parks' };
      return hit;
    }
  }
  return null;
}

// The public Overpass servers are often at capacity: back off, then try a mirror.
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];

async function fetchOverpass(): Promise<{ elements: El[] }> {
  let last = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const endpoint = OVERPASS[attempt % OVERPASS.length];
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'roam-access-pilot-seed/0.1 (+https://roamaccess.com.au)' },
      body: 'data=' + encodeURIComponent(overpassQuery()),
      signal: AbortSignal.timeout(120_000),
    }).catch(e => ({ ok: false, status: 0, text: async () => String(e) }) as const);
    if (res.ok) return (await (res as Response).json()) as { elements: El[] };
    last = `Overpass ${res.status} at ${endpoint}: ${(await res.text()).slice(0, 200)}`;
    const wait = 2000 * 2 ** attempt;
    console.warn(`${last.split('\n')[0]} — retrying in ${wait / 1000}s`);
    await new Promise(r => setTimeout(r, wait));
  }
  throw new Error(last);
}

async function main() {
  const dry = process.argv.includes('--dry');
  const data = await fetchOverpass();

  const rows = [];
  const seenIds = new Set<string>();
  for (const el of data.elements) {
    const tags = el.tags || {};
    const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null || !tags.name) continue;
    if (['private', 'no', 'customers'].includes(tags.access) && tags.leisure === 'swimming_pool') continue;
    if (tags.access === 'private' || tags.disused || tags['disused:amenity']) continue;
    const c = classify(tags);
    if (!c) continue;

    const id = `${slugify(tags.name)}-${el.type[0]}${el.id}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    const osmTags = Object.fromEntries(Object.entries(tags).filter(([k]) => KEEP.test(k)));
    const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
    rows.push({
      id, osmType: el.type, osmId: el.id, name: tags.name.trim(), kind: c.kind, cat: c.cat,
      suburb: tags['addr:suburb'] || nearestSuburb(lat, lng),
      address: street || null, lat, lng,
      phone: tags.phone || tags['contact:phone'] || null,
      website: tags.website || tags['contact:website'] || null,
      osmTags,
    });
  }

  const byCat = rows.reduce<Record<string, number>>((a, r) => ((a[r.cat] = (a[r.cat] || 0) + 1), a), {});
  console.log(`OSM returned ${data.elements.length} elements → ${rows.length} venues`, byCat);
  console.log('wheelchair-tagged:', rows.filter(r => r.osmTags.wheelchair).length);
  if (dry) { console.log(rows.slice(0, 8)); return; }

  const { url, target } = pickDatabaseUrl();
  console.log(`Seeding the ${target} database (${describeDatabaseUrl(url)})`);
  const db = drizzle(neon(url));
  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(venues).values(rows.slice(i, i + 100)).onConflictDoUpdate({
      target: [venues.osmType, venues.osmId],
      set: {
        name: sql`excluded.name`, kind: sql`excluded.kind`, cat: sql`excluded.cat`,
        suburb: sql`excluded.suburb`, address: sql`excluded.address`, lat: sql`excluded.lat`,
        lng: sql`excluded.lng`, phone: sql`excluded.phone`, website: sql`excluded.website`,
        osmTags: sql`excluded.osm_tags`, updatedAt: sql`now()`,
        // `active` is left alone: new rows default to active, and a place an
        // admin marked inactive (closed, duplicate…) stays hidden on re-import.
      },
    });
  }
  const [{ count }] = await db.execute<{ count: number }>(sql`select count(*)::int as count from venues where active`).then(r => r.rows as { count: number }[]);
  console.log(`Seeded. Active venues in DB: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
