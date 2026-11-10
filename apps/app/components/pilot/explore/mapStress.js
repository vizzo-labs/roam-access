// Dev-only map stress mode: `?mapStress=1` adds about 3,000 synthetic places
// (and 400 synthetic toilets) spread across Greater Sydney, generated in the
// browser. They are never sent to the server and never written to any
// database. Off in production builds; on Vercel Preview builds it works too.
//
// Used to check that the map stays clean at city, suburb and street zoom and
// that panning stays smooth (see docs/ux-review/map-declutter/).

export function mapStressOn() {
  if (typeof window === 'undefined') return false;
  const allowed = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
  if (!allowed) return false;
  try { return new URLSearchParams(window.location.search).get('mapStress') === '1'; } catch { return false; }
}

// Suburb centres with a weight (how many places cluster there).
const CENTRES = [
  ['Sydney CBD', -33.8688, 151.2093, 10], ['Surry Hills', -33.8861, 151.2111, 6], ['Newtown', -33.8970, 151.1793, 6],
  ['Bondi', -33.8915, 151.2767, 5], ['Coogee', -33.9200, 151.2556, 3], ['Parramatta', -33.8150, 151.0011, 7],
  ['Chatswood', -33.7969, 151.1803, 5], ['North Sydney', -33.8389, 151.2070, 4], ['Manly', -33.7969, 151.2840, 4],
  ['Dee Why', -33.7510, 151.2870, 3], ['Mona Vale', -33.6770, 151.3030, 2], ['Hornsby', -33.7047, 151.0990, 3],
  ['Ryde', -33.8150, 151.1050, 3], ['Burwood', -33.8770, 151.1040, 3], ['Strathfield', -33.8730, 151.0940, 2],
  ['Bankstown', -33.9180, 151.0350, 4], ['Hurstville', -33.9670, 151.1020, 3], ['Cronulla', -34.0560, 151.1520, 3],
  ['Sutherland', -34.0310, 151.0580, 2], ['Liverpool', -33.9200, 150.9230, 4], ['Campbelltown', -34.0650, 150.8140, 3],
  ['Penrith', -33.7510, 150.6940, 3], ['Blacktown', -33.7710, 150.9060, 4], ['Castle Hill', -33.7310, 151.0040, 3],
  ['Rouse Hill', -33.6820, 150.9150, 2], ['Mascot', -33.9290, 151.1930, 2], ['Marrickville', -33.9110, 151.1550, 3],
  ['Leichhardt', -33.8830, 151.1570, 3], ['Balmain', -33.8590, 151.1790, 2], ['Mosman', -33.8290, 151.2440, 2],
  ['Epping', -33.7720, 151.0820, 2], ['Fairfield', -33.8720, 150.9560, 3], ['Auburn', -33.8490, 151.0330, 2],
  ['Randwick', -33.9140, 151.2410, 3], ['Maroubra', -33.9500, 151.2430, 2], ['Kogarah', -33.9630, 151.1330, 2],
];

const KINDS = [
  ['Cafe', 'food'], ['Restaurant', 'food'], ['Takeaway', 'food'], ['Bar', 'food'], ['Pub', 'food'],
  ['Park', 'parks'], ['Beach', 'parks'], ['Swimming pool', 'parks'], ['Museum', 'arts'], ['Library', 'arts'],
  ['Gallery', 'arts'], ['Theatre', 'music'], ['Cinema', 'music'], ['Hotel', 'stay'],
];

// Small seeded PRNG, so every run (and every screenshot) is the same.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

function pickCentre(r) {
  const total = CENTRES.reduce((s, c) => s + c[3], 0);
  let x = r() * total;
  for (const c of CENTRES) { x -= c[3]; if (x <= 0) return c; }
  return CENTRES[0];
}

function fact(src, s) {
  return { t: s, s, tags: [], src, n: src === 'community' ? 1 : undefined, kind: src === 'osm' ? 'hint' : 'feature' };
}

export function stressVenues(n = 3000) {
  const r = rng(20261110);
  const out = [];
  for (let i = 0; i < n; i++) {
    const [area, lat0, lng0] = pickCentre(r);
    // ~1.5 km spread around the centre (1° lat ≈ 111 km).
    const lat = lat0 + gauss(r) * 0.013;
    const lng = lng0 + gauss(r) * 0.016;
    const [kind, cat] = KINDS[Math.floor(r() * KINDS.length)];
    const v = r();
    // Roughly what a city looks like early on: most places have no info yet,
    // many have OpenStreetMap hints (Check first), a few have reviews.
    const works = v < 0.08 ? [fact('community', 'Step-free entry (test)')] : [];
    const barriers = v >= 0.08 && v < 0.14 ? [fact('community', 'Steps at the door (test)')] : [];
    const check = v >= 0.14 && v < 0.45 ? [fact('osm', 'Wheelchair access listed (test)')] : [];
    out.push({
      id: `stress-${i}`, name: `${area} test ${kind.toLowerCase()} ${i}`, kind, cat, area,
      address: null, lat, lng, phone: null, website: null, osmUrl: '',
      works, check, barriers, verified: works.length + barriers.length, note: null, ev: [],
      lastReview: null, lastConfirmed: null, confirmations: 0, quick: 0, observed: [], observations: 0,
      sensory: null, coverPhoto: null, entrance: null, stress: true,
    });
  }
  return out;
}

export function stressFacilities(n = 400) {
  const r = rng(1110);
  const out = [];
  for (let i = 0; i < n; i++) {
    const [area, lat0, lng0] = pickCentre(r);
    out.push({
      id: `stress-toilet-${i}`, layer: 'toilets', kind: 'toilet', name: `${area} test toilet ${i}`,
      lat: lat0 + gauss(r) * 0.015, lng: lng0 + gauss(r) * 0.018,
      details: { accessible: r() < 0.6 }, source: 'Stress test',
    });
  }
  return out;
}
