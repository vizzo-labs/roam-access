// Turns stored venues + community reviews into the shape the screens render:
// facts split into works / check / barriers, each tagged with the access
// features it touches. ra2Verdict (client) then personalises per tester.
//
// The rule that keeps the product honest: only the community can make a place
// "work". OpenStreetMap hints are shown as "check first — not yet confirmed".

import type { Review, Venue } from './db/schema';
import { RA2_FEATURES, RA2_NEEDS, FEATURE_IDS, type FeatureId, type VerdictKind } from './pilot-data';

export type Fact = { t: string; s: string; tags: FeatureId[]; src: 'community' | 'osm' };

export type VenueVM = {
  id: string; name: string; kind: string; cat: string; area: string;
  address: string | null; lat: number; lng: number;
  phone: string | null; website: string | null; osmUrl: string;
  works: Fact[]; check: Fact[]; barriers: Fact[];
  verified: number; note: string | null;
};

export type ReviewVM = {
  id: string; who: string; filters: string[]; v: VerdictKind; when: string;
  text: string; details: string; mine: boolean;
};

const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
const WORST: VerdictKind[] = ['barrier', 'check', 'works'];

export function buildVenueVM(venue: Venue, reviews: Review[]): VenueVM {
  const works: Fact[] = [], check: Fact[] = [], barriers: Fact[] = [];
  const bucket = { works, check, barrier: barriers };

  // 1 · Feature answers ("Step-free way in? yes/no") from every review.
  const counts = new Map<FeatureId, { yes: number; no: number }>();
  for (const r of reviews) {
    for (const [k, val] of Object.entries(r.features || {})) {
      if (!FEATURE_IDS.includes(k as FeatureId) || (val !== 'yes' && val !== 'no')) continue;
      const c = counts.get(k as FeatureId) || { yes: 0, no: 0 };
      c[val]++;
      counts.set(k as FeatureId, c);
    }
  }
  for (const f of RA2_FEATURES) {
    const c = counts.get(f.id);
    if (!c) continue;
    const tags = [f.id];
    if (c.yes > c.no) works.push({ t: `${f.yes} — confirmed by ${n(c.yes, 'person', 'people')}`, s: f.yesShort, tags, src: 'community' });
    else if (c.no > c.yes) bucket[f.noSeverity].push({ t: `${f.no} — reported by ${n(c.no, 'person', 'people')}`, s: f.noShort, tags, src: 'community' });
    else check.push({ t: `Mixed reports on ${f.label}: ${c.yes} yes, ${c.no} no`, s: `Mixed: ${f.label}`, tags, src: 'community' });
  }

  // 2 · Overall experience, grouped by the reviewer's lived experience.
  for (const need of RA2_NEEDS) {
    const rs = reviews.filter(r => r.needs.includes(need.id));
    if (!rs.length) continue;
    const tally: Record<VerdictKind, number> = { works: 0, check: 0, barrier: 0 };
    for (const r of rs) tally[r.verdict as VerdictKind]++;
    const top = Math.max(...Object.values(tally));
    // Ties resolve to the more cautious verdict.
    const kind = WORST.find(k => tally[k] === top)!;
    const who = tally[kind] === 1 ? need.who.toLowerCase() : need.whoPlural;
    const k = tally[kind];
    const line = {
      works:   { t: `${k} ${who} said it worked for them`,            s: `Worked for ${need.short}` },
      check:   { t: `${k} ${who} managed, but with workarounds`,      s: `Workarounds needed` },
      barrier: { t: `${k} ${who} said it didn't work for them`,       s: `Didn't work for ${need.short}` },
    }[kind];
    bucket[kind].push({ ...line, tags: need.tags, src: 'community' });
  }

  // 3 · OpenStreetMap hints — only where the community hasn't spoken yet.
  const osm = venue.osmTags || {};
  const hint = (tag: FeatureId, value: string | undefined, what: string, short: string) => {
    if (!value || counts.has(tag)) return;
    const label = value === 'yes' ? what : value === 'limited' ? `partly ${what}` : value === 'no' ? `not ${what}` : null;
    if (!label) return;
    check.push({
      t: `Listed as ${label} on OpenStreetMap — not yet confirmed by the community`,
      s: cap(`${value === 'no' ? 'not ' : value === 'limited' ? 'partly ' : ''}${short} (unconfirmed)`),
      tags: [tag], src: 'osm',
    });
  };
  hint('stepfree', osm.wheelchair, 'wheelchair accessible', 'step-free');
  hint('bathroom', osm['toilets:wheelchair'], 'having an accessible toilet', 'accessible loo');
  hint('hearing', osm.hearing_loop, 'having a hearing loop', 'hearing loop');

  const latest = [...reviews].sort((a, b) => +b.createdAt - +a.createdAt)[0];
  const note = latest?.note ? clip(latest.note, 60) : works[0]?.s ?? null;

  return {
    id: venue.id, name: venue.name, kind: venue.kind, cat: venue.cat,
    area: venue.suburb || 'Manly', address: venue.address, lat: venue.lat, lng: venue.lng,
    phone: venue.phone, website: venue.website,
    osmUrl: `https://www.openstreetmap.org/${venue.osmType}/${venue.osmId}`,
    works, check, barriers, verified: reviews.length, note,
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function clip(s: string, max: number) {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

const DEFAULT_TEXT: Record<VerdictKind, string> = {
  works: 'It worked for me — I could get in, get around, and enjoy it.',
  check: 'I managed, but with workarounds worth knowing about.',
  barrier: 'I couldn’t use the venue as I needed.',
};

export function buildReviewVM(r: Review, viewerId: string, now = Date.now()): ReviewVM {
  const needs = RA2_NEEDS.filter(x => r.needs.includes(x.id));
  const feats = RA2_FEATURES
    .filter(f => r.features?.[f.id] === 'yes' || r.features?.[f.id] === 'no')
    .map(f => `${r.features[f.id] === 'yes' ? '✓' : '✗'} ${r.features[f.id] === 'yes' ? f.yesShort : f.noShort}`);
  return {
    id: r.id,
    who: needs[0] ? needs[0].who + (needs.length > 1 ? ` (+${needs.length - 1})` : '') : 'Community member',
    filters: needs.map(x => x.filter),
    v: r.verdict as VerdictKind,
    when: ago(+r.createdAt, now),
    text: r.note?.trim() || DEFAULT_TEXT[r.verdict as VerdictKind],
    details: feats.join(' · '),
    mine: r.userId === viewerId,
  };
}

export function ago(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return n(h, 'hour ago', 'hours ago');
  const d = Math.round(h / 24); if (d < 14) return n(d, 'day ago', 'days ago');
  const w = Math.round(d / 7); if (w < 9) return `${w} weeks ago`;
  return new Date(t).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
