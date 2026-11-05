// Turns stored venues + community reviews into the shape the screens render:
// facts split into works / check / barriers, each tagged with the access
// features it touches. ra2Verdict (client) then personalises per tester.
//
// The rule that keeps the product honest: only the community can make a place
// "work". OpenStreetMap hints are shown as "check first — not yet confirmed".

import type { EntranceAlt, Review, Venue } from './db/schema';
import { RA2_FEATURES, RA2_NEEDS, FEATURE_IDS, type FeatureId, type NeedId, type VerdictKind } from './pilot-data';
import { ENTRANCE_ALTS } from './trust/entrance';

// Where a fact comes from. Only 'community' can make a place "Works for you";
// 'osm' is always shown as unconfirmed. 'venue' is reserved for "Venue says"
// (venue claims, later) — it must never be able to make a place work either.
export type FactSource = 'community' | 'osm' | 'venue';

export type Fact = {
  t: string;            // full sentence (venue page)
  s: string;            // short reason with its count (cards, map card)
  tags: FeatureId[];
  src: FactSource;
  n?: number;           // how many reports stand behind it (community)
  last?: string;        // ISO date of the most recent of those reports
  kind?: 'feature' | 'absence' | 'entrance' | 'mixed' | 'experience' | 'hint';
  quote?: string;       // the reviewer's own words ("where?" for entrances)
};

// One line per visible review: whose needs, what it answered, when. No ids,
// no names — enough to say "Based on 3 wheelchair users · 6 weeks ago".
export type Evidence = { n: NeedId[]; f: FeatureId[]; at: string };

export type VenueVM = {
  id: string; name: string; kind: string; cat: string; area: string;
  address: string | null; lat: number; lng: number;
  phone: string | null; website: string | null; osmUrl: string;
  works: Fact[]; check: Fact[]; barriers: Fact[];
  verified: number; note: string | null;
  ev: Evidence[];
  lastReview: string | null;     // newest visible review
  lastConfirmed: string | null;  // newest review or "Still accurate? Yes"
  confirmations: number;         // people who said "still accurate"
};

export type ConfirmationStat = { last: Date | string; count: number };

export type ReviewVM = {
  id: string; who: string; filters: string[]; v: VerdictKind; when: string;
  text: string; details: string; mine: boolean;
};

const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
const reports = (k: number) => n(k, 'report', 'reports');
const WORST: VerdictKind[] = ['barrier', 'check', 'works'];
const iso = (d: Date | string) => new Date(d).toISOString();
const newest = (ds: (Date | string | null | undefined)[]) => {
  const t = ds.filter(Boolean).map(d => +new Date(d!));
  return t.length ? new Date(Math.max(...t)).toISOString() : null;
};

export function buildVenueVM(venue: Venue, reviews: Review[], confirm?: ConfirmationStat): VenueVM {
  const works: Fact[] = [], check: Fact[] = [], barriers: Fact[] = [];
  const bucket = { works, check, barrier: barriers };

  // 1 · Feature answers ("Step-free way in? yes/no") from every review.
  type Tally = { yes: number; no: number; lastYes?: Date; lastNo?: Date };
  const counts = new Map<FeatureId, Tally>();
  for (const r of reviews) {
    for (const [k, val] of Object.entries(r.features || {})) {
      if (!FEATURE_IDS.includes(k as FeatureId) || (val !== 'yes' && val !== 'no')) continue;
      const c = counts.get(k as FeatureId) || { yes: 0, no: 0 };
      c[val]++;
      const key = val === 'yes' ? 'lastYes' : 'lastNo';
      if (!c[key] || r.createdAt > c[key]!) c[key] = r.createdAt;
      counts.set(k as FeatureId, c);
    }
  }

  // Another way in ("ramp round the side"), so a main-door step doesn't hide it.
  const alts = new Map<EntranceAlt, { k: number; last: Date; quote?: string }>();
  for (const r of [...reviews].sort((a, b) => +a.createdAt - +b.createdAt)) {
    if (!r.entranceAlt) continue;
    const a = alts.get(r.entranceAlt) || { k: 0, last: r.createdAt };
    a.k++; a.last = r.createdAt;
    if (r.entranceNote?.trim()) a.quote = clip(r.entranceNote, 80);
    alts.set(r.entranceAlt, a);
  }
  const altYes = ENTRANCE_ALTS.filter(x => x.id !== 'none' && alts.get(x.id)).map(x => ({ ...x, ...alts.get(x.id)! }))
    .sort((a, b) => b.k - a.k);
  const altYesTotal = altYes.reduce((t, a) => t + a.k, 0);
  const altNone = alts.get('none');

  for (const f of RA2_FEATURES) {
    const c = counts.get(f.id);
    if (!c) continue;
    const tags = [f.id];
    if (c.yes > c.no) {
      works.push({ t: f.yes, s: `${f.yesShort} — ${reports(c.yes)}`, tags, src: 'community', n: c.yes, last: iso(c.lastYes!), kind: 'feature' });
    } else if (c.no > c.yes) {
      // Confirmed absence: specific, counted, and the first reason shown.
      const fact: Fact = { t: f.no, s: `${f.noShort} — ${reports(c.no)}`, tags, src: 'community', n: c.no, last: iso(c.lastNo!), kind: 'absence' };
      let severity = f.noSeverity;
      if (f.id === 'stepfree' && altYesTotal > (altNone?.k ?? 0)) {
        // A step at the main door, but a step-free way in elsewhere: worth
        // knowing before you go, not a dead end.
        fact.t = 'Steps at the main entrance';
        fact.s = `Step at main entrance, step-free way in ${altYes[0].where} — ${reports(c.no)}`;
        severity = 'check';
      } else if (f.id === 'stepfree' && altNone) {
        fact.t = 'Steps at the entry, and no other step-free way in';
        fact.n = Math.max(c.no, altNone.k);
        fact.last = newest([c.lastNo, altNone.last])!;
        fact.s = `No step-free way in — ${reports(fact.n)}`;
      }
      bucket[severity].push(fact);
    } else {
      check.push({
        t: `Mixed reports on ${f.label}: ${c.yes} yes, ${c.no} no`, s: `Mixed: ${f.label} — ${c.yes} yes, ${c.no} no`,
        tags, src: 'community', n: c.yes + c.no, last: newest([c.lastYes, c.lastNo])!, kind: 'mixed',
      });
    }
  }
  for (const a of altYes) {
    works.push({
      t: `Step-free entrance ${a.where}`, s: `${a.short} — ${reports(a.k)}`,
      tags: ['stepfree'], src: 'community', n: a.k, last: iso(a.last), kind: 'entrance', quote: a.quote,
    });
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
      check:   { t: `${k} ${who} managed, but with workarounds`,      s: `Workarounds needed for ${need.short}` },
      barrier: { t: `${k} ${who} said it didn't work for them`,       s: `Didn't work for ${need.short}` },
    }[kind];
    const last = newest(rs.filter(r => r.verdict === kind).map(r => r.createdAt))!;
    bucket[kind].push({ ...line, s: `${line.s} — ${n(k, 'person', 'people')}`, tags: need.tags, src: 'community', n: k, last, kind: 'experience' });
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
      tags: [tag], src: 'osm', kind: 'hint',
    });
  };
  hint('stepfree', osm.wheelchair, 'wheelchair accessible', 'step-free');
  hint('bathroom', osm['toilets:wheelchair'], 'having an accessible toilet', 'accessible loo');
  hint('hearing', osm.hearing_loop, 'having a hearing loop', 'hearing loop');

  const latest = [...reviews].sort((a, b) => +b.createdAt - +a.createdAt)[0];
  const note = latest?.note ? clip(latest.note, 60) : works[0]?.s ?? null;

  const ev: Evidence[] = reviews.map(r => ({
    n: r.needs.filter((x): x is NeedId => RA2_NEEDS.some(nd => nd.id === x)),
    f: [...new Set([
      ...Object.keys(r.features || {}).filter((k): k is FeatureId => FEATURE_IDS.includes(k as FeatureId)),
      ...(r.entranceAlt ? ['stepfree' as FeatureId] : []),
    ])],
    at: iso(r.createdAt),
  }));
  const lastReview = latest ? iso(latest.createdAt) : null;

  return {
    id: venue.id, name: venue.name, kind: venue.kind, cat: venue.cat,
    area: venue.suburb || 'Manly', address: venue.address, lat: venue.lat, lng: venue.lng,
    phone: venue.phone, website: venue.website,
    osmUrl: `https://www.openstreetmap.org/${venue.osmType}/${venue.osmId}`,
    works, check, barriers, verified: reviews.length, note,
    ev, lastReview,
    lastConfirmed: newest([lastReview, confirm?.last]),
    confirmations: confirm?.count ?? 0,
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
  const alt = ENTRANCE_ALTS.find(a => a.id === r.entranceAlt);
  if (alt) feats.push(`${alt.id === 'none' ? '✗' : '✓'} ${alt.short}${r.entranceNote?.trim() ? ` (“${clip(r.entranceNote, 80)}”)` : ''}`);
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
