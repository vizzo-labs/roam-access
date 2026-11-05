// Explore filters shared by the list (Results), the phone map (Map) and the
// desktop map (PilotApp). Filters only NARROW or re-order by the tester's own
// choice (nearest); they never change a verdict, and nothing paid touches them.

import { RA2_TILES } from '@/lib/pilot-data';
import { RA2_TAG_LABEL } from '@/lib/pilot/match';

export const DEFAULT_FILTERS = { works: false, hideBarriers: false, sort: 'match' };

export function applyFilters(list, f = DEFAULT_FILTERS) {
  let out = list;
  if (f.works) out = out.filter(v => v.verdict.kind === 'works');
  else if (f.hideBarriers) out = out.filter(v => v.verdict.kind !== 'barrier');
  if (f.sort === 'near') out = [...out].sort((a, b) => a.mins - b.mins);
  return out;
}

export function verdictCounts(list) {
  const c = { works: 0, check: 0, barrier: 0, unknown: 0 };
  for (const v of list) c[v.verdict.kind] = (c[v.verdict.kind] || 0) + 1;
  return c;
}

// "12 work for you · 40 check first · 3 have barriers · 100 no info yet"
export function countsLine(c) {
  return [
    c.works && `${c.works} ${c.works === 1 ? 'works' : 'work'} for you`,
    c.check && `${c.check} check first`,
    c.barrier && `${c.barrier} ${c.barrier === 1 ? 'has' : 'have'} barriers`,
    c.unknown && `${c.unknown} no info yet`,
  ].filter(Boolean).join(' · ');
}

// Category chips map onto the browse tiles (Arts & culture = arts + music).
export const CATEGORY_CHIPS = RA2_TILES;
export const tileOn = (query, tile) => tile.cats.every(c => (query?.cats || []).includes(c));

export function toggleTile(query, tile, on) {
  const q = query || { cats: [], tags: [], label: 'All places', raw: '' };
  const cats = on ? [...new Set([...q.cats, ...tile.cats])] : q.cats.filter(c => !tile.cats.includes(c));
  return { ...q, cats, label: labelFor(cats, q.tags || []) };
}

function labelFor(cats, tags) {
  const tiles = RA2_TILES.filter(t => t.cats.every(c => cats.includes(c)));
  const quiet = tags.includes('quiet');
  const extras = tags.filter(x => x !== 'quiet' && x !== 'calm').map(x => RA2_TAG_LABEL[x]).filter(Boolean);
  let base = tiles.length ? tiles.map(t => t.label).join(' & ') : 'All places';
  if (quiet) base = `Quiet ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
  return extras.length ? `${base}, ${extras.join(', ')}` : base;
}
