// Explore filters shared by the list (Results), the phone map (Map) and the
// desktop map (PilotApp). Filters only NARROW or re-order by the tester's own
// choice (nearest); they never change a verdict, and nothing paid touches them.
// Quiet now / Has quiet times (#17) come from community sensory reports and
// also only narrow the list.

import { RA2_TILES } from '@/lib/pilot-data';
import { hasQuietTimes, isQuietNow } from '@/lib/sensory/summary';

/** Places per page in a results list ("Show 10 more"). */
export const PAGE = 10;

export const DEFAULT_FILTERS = { works: false, hideBarriers: false, quietNow: false, quietTimes: false, sort: 'match' };

/** Any filter that hides places is on (sort doesn't hide anything). */
export const filtersOn = f => !!(f.works || f.hideBarriers || f.quietNow || f.quietTimes);
export const CLEAR_FILTERS = { works: false, hideBarriers: false, quietNow: false, quietTimes: false };

export function applyFilters(list, f = DEFAULT_FILTERS, now = Date.now()) {
  let out = list;
  if (f.works) out = out.filter(v => v.verdict.kind === 'works');
  else if (f.hideBarriers) out = out.filter(v => v.verdict.kind !== 'barrier');
  if (f.quietNow) out = out.filter(v => isQuietNow(v.sensory, now));
  if (f.quietTimes) out = out.filter(v => hasQuietTimes(v.sensory));
  if (f.sort === 'near') out = [...out].sort((a, b) => a.mins - b.mins);
  return out;
}

export function verdictCounts(list, now = Date.now()) {
  const c = { works: 0, check: 0, barrier: 0, unknown: 0, quietNow: 0, quietTimes: 0, sensory: 0 };
  for (const v of list) {
    c[v.verdict.kind] = (c[v.verdict.kind] || 0) + 1;
    if (v.sensory) c.sensory++;
    if (isQuietNow(v.sensory, now)) c.quietNow++;
    if (hasQuietTimes(v.sensory)) c.quietTimes++;
  }
  return c;
}

// "12 work for you · 40 check first · 3 have barriers · 100 no info yet"
export function countsLine(c, t) {
  return [
    c.works && t('explore.counts.works', { count: c.works }),
    c.check && t('explore.counts.check', { count: c.check }),
    c.barrier && t('explore.counts.barrier', { count: c.barrier }),
    c.unknown && t('explore.counts.unknown', { count: c.unknown }),
  ].filter(Boolean).join(' · ');
}

// Category chips map onto the browse tiles (Arts & culture = arts + music).
export const CATEGORY_CHIPS = RA2_TILES;
export const tileOn = (query, tile) => tile.cats.every(c => (query?.cats || []).includes(c));

// `label` stays the English summary (for logs); screens show ra2QueryLabel(query, t).
export function toggleTile(query, tile, on) {
  const q = query || { cats: [], tags: [], label: 'All places', raw: '' };
  const cats = on ? [...new Set([...q.cats, ...tile.cats])] : q.cats.filter(c => !tile.cats.includes(c));
  return { ...q, cats, label: labelFor(cats, q.tags || []) };
}

function labelFor(cats, tags) {
  const tiles = RA2_TILES.filter(t => t.cats.every(c => cats.includes(c)));
  const base = tiles.length ? tiles.map(t => t.label).join(' & ') : 'All places';
  return tags.includes('quiet') ? `Quiet ${base.charAt(0).toLowerCase()}${base.slice(1)}` : base;
}

// "Near you": the nearest places anyone in the pilot has said something
// about, then simply the nearest. Shared by Find and the desktop map.
const hasCommunityFact = v => [...v.works, ...v.check, ...v.barriers].some(f => f.src === 'community');
export function nearPlaces(venues, needs, n, verdictOf) {
  const byDistance = venues.map(v => ({ ...v, verdict: verdictOf(v, needs) })).sort((a, b) => a.mins - b.mins);
  const known = byDistance.filter(hasCommunityFact).slice(0, n);
  return [...known, ...byDistance.filter(v => !known.includes(v))].slice(0, n);
}

// "Search this area": only places inside the map's bounds { w, s, e, n }.
// It only narrows the list; it never changes a verdict.
export const inArea = (area, v) => !area || (v.lat >= area.s && v.lat <= area.n && v.lng >= area.w && v.lng <= area.e);
