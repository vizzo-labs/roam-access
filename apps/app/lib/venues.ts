// Turns stored venues + community reviews into the shape the screens render:
// facts split into works / check / barriers, each tagged with the access
// features it touches. ra2Verdict (client) then personalises per tester.
//
// The rule that keeps the product honest: only the community can make a place
// "work". OpenStreetMap hints are shown as "check first — not yet confirmed".

import type { EntranceAlt, MicroAnswer, Review, Venue } from './db/schema';
import { RA2_FEATURES, RA2_NEEDS, FEATURE_IDS, type FeatureId, type NeedId, type VerdictKind } from './pilot-data';
import { ENTRANCE_ALTS } from './trust/entrance';
import type { SensoryVM } from './sensory/summary';
import type { I18nText } from './trust/text';
import { optionOf, slotLabel } from './sensory/defs';

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
  quick?: number;       // how many of `n` are quick answers ("Help fill the gaps")
  // The same `t` and `s` as translatable descriptors (#21): screens show
  // textOf(t, f.i18n.t); the English above stays for server pages.
  i18n?: { t: I18nText; s: I18nText };
};

// One line per visible review: whose needs, what it answered, when. No ids,
// no names — enough to say "Based on 3 wheelchair users · 6 weeks ago".
// Quick answers add a line with q: true and no needs (none are stored with them).
export type Evidence = { n: NeedId[]; f: FeatureId[]; at: string; q?: true };

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
  // Quick answers ("Help fill the gaps"): one yes/no about one feature. They
  // count toward that feature's facts and are always labelled as such.
  quick: number;
  // Noise, light, crowds and quiet times (#17) — built in lib/data.ts from
  // reviews + check-ins. Describes the place; never changes the verdict.
  sensory?: SensoryVM | null;
};

export type ConfirmationStat = { last: Date | string; count: number };

export type ReviewVM = {
  id: string; who: string; filters: string[]; v: VerdictKind; when: string;
  text: string; details: string; mine: boolean;
  // Structured for translation (#21): the reviewer's first need + how many
  // more, the date to format client-side, whether `text` is the reviewer's
  // own words (else `textKey`), and the answers as descriptors.
  needs: NeedId[]; whoNeed: NeedId | null; whoMore: number; at: string;
  own: boolean; textKey: string | null;
  items: { ok: boolean; text: I18nText; quote?: string; slots?: string[] }[];
};

const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
const reports = (k: number) => n(k, 'report', 'reports');
const WORST: VerdictKind[] = ['barrier', 'check', 'works'];
const iso = (d: Date | string) => new Date(d).toISOString();
const newest = (ds: (Date | string | null | undefined)[]) => {
  const t = ds.filter(Boolean).map(d => +new Date(d!));
  return t.length ? new Date(Math.max(...t)).toISOString() : null;
};

export type FeatureCount = {
  yes: number; no: number; lastYes?: Date; lastNo?: Date; quickYes: number; quickNo: number;
};

// Yes/no tallies per access feature from reviews and quick answers. One person
// counts once per feature — their latest answer — so answering again (or a
// quick answer after a review) never adds a second vote.
export function featureCounts(reviews: Review[], quick: MicroAnswer[] = []): Map<FeatureId, FeatureCount> {
  const latest = new Map<string, { k: FeatureId; val: 'yes' | 'no'; at: Date; quick: boolean }>();
  const consider = (userId: string, k: string, val: unknown, at: Date, isQuick: boolean) => {
    if (!FEATURE_IDS.includes(k as FeatureId) || (val !== 'yes' && val !== 'no')) return;
    const key = `${userId}\u0000${k}`;
    const prev = latest.get(key);
    if (!prev || +at >= +prev.at) latest.set(key, { k: k as FeatureId, val, at, quick: isQuick });
  };
  for (const r of reviews) for (const [k, val] of Object.entries(r.features || {})) consider(r.userId, k, val, r.createdAt, false);
  for (const a of quick) consider(a.userId, a.feature, a.answer, a.updatedAt, true);
  const counts = new Map<FeatureId, FeatureCount>();
  for (const { k, val, at, quick: isQuick } of latest.values()) {
    const c = counts.get(k) || { yes: 0, no: 0, quickYes: 0, quickNo: 0 };
    c[val]++;
    if (isQuick) c[val === 'yes' ? 'quickYes' : 'quickNo']++;
    const key = val === 'yes' ? 'lastYes' : 'lastNo';
    if (!c[key] || at > c[key]!) c[key] = at;
    counts.set(k, c);
  }
  return counts;
}

// "(quick answer)" when that's all there is, else "(1 by quick answer)".
const viaQuick = (q: number, all: number) =>
  !q ? '' : q === all ? ` (${q === 1 ? 'quick answer' : 'quick answers'})` : ` (${q} by quick answer)`;
const viaQuickI18n = (q: number, all: number): I18nText | undefined =>
  !q ? undefined : q === all ? { key: 'facts.quick.all', params: { count: q } } : { key: 'facts.quick.some', params: { count: q } };
/** "{what} — {count} reports" (+ quick-answer note) as a descriptor. */
const countedI18n = (what: string, count: number, q = 0): I18nText =>
  ({ key: 'facts.s.reports', params: { count }, refs: { what }, suffix: viaQuickI18n(q, count) });

export function buildVenueVM(venue: Venue, reviews: Review[], confirm?: ConfirmationStat, quick: MicroAnswer[] = []): VenueVM {
  const works: Fact[] = [], check: Fact[] = [], barriers: Fact[] = [];
  const bucket = { works, check, barrier: barriers };

  // 1 · Feature answers ("Step-free way in? yes/no") from every review and
  // quick answer (one person counts once per feature: see featureCounts).
  const counts = featureCounts(reviews, quick);

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
      const q = viaQuick(c.quickYes, c.yes);
      works.push({
        t: f.yes, s: `${f.yesShort} — ${reports(c.yes)}${q}`, tags, src: 'community', n: c.yes, last: iso(c.lastYes!), kind: 'feature', quick: c.quickYes || undefined,
        i18n: { t: { key: `data.feature.${f.id}.yes` }, s: countedI18n(`data.feature.${f.id}.yesShort`, c.yes, c.quickYes) },
      });
    } else if (c.no > c.yes) {
      // Confirmed absence: specific, counted, and the first reason shown.
      const q = viaQuick(c.quickNo, c.no);
      const fact: Fact = {
        t: f.no, s: `${f.noShort} — ${reports(c.no)}${q}`, tags, src: 'community', n: c.no, last: iso(c.lastNo!), kind: 'absence', quick: c.quickNo || undefined,
        i18n: { t: { key: `data.feature.${f.id}.no` }, s: countedI18n(`data.feature.${f.id}.noShort`, c.no, c.quickNo) },
      };
      let severity = f.noSeverity;
      if (f.id === 'stepfree' && altYesTotal > (altNone?.k ?? 0)) {
        // A step at the main door, but a step-free way in elsewhere: worth
        // knowing before you go, not a dead end.
        fact.t = 'Steps at the main entrance';
        fact.s = `Step at main entrance, step-free way in ${altYes[0].where} — ${reports(c.no)}${q}`;
        fact.i18n = {
          t: { key: 'facts.t.stepsMainEntrance' },
          s: { key: 'facts.s.stepMainAltEntrance', params: { count: c.no }, refs: { where: `trust.entrance.${altYes[0].id}.where` }, suffix: viaQuickI18n(c.quickNo, c.no) },
        };
        severity = 'check';
      } else if (f.id === 'stepfree' && altNone) {
        fact.t = 'Steps at the entry, and no other step-free way in';
        fact.n = Math.max(c.no, altNone.k);
        fact.last = newest([c.lastNo, altNone.last])!;
        fact.s = `No step-free way in — ${reports(fact.n)}`;
        fact.i18n = { t: { key: 'facts.t.noStepFreeAtAll' }, s: { key: 'facts.s.noStepFree', params: { count: fact.n } } };
      }
      bucket[severity].push(fact);
    } else {
      check.push({
        t: `Mixed reports on ${f.label}: ${c.yes} yes, ${c.no} no`, s: `Mixed: ${f.label} — ${c.yes} yes, ${c.no} no`,
        tags, src: 'community', n: c.yes + c.no, last: newest([c.lastYes, c.lastNo])!, kind: 'mixed',
        quick: c.quickYes + c.quickNo || undefined,
        i18n: {
          t: { key: 'facts.t.mixed', params: { yes: c.yes, no: c.no }, refs: { label: `data.feature.${f.id}.label` } },
          s: { key: 'facts.s.mixed', params: { yes: c.yes, no: c.no }, refs: { label: `data.feature.${f.id}.label` } },
        },
      });
    }
  }
  for (const a of altYes) {
    works.push({
      t: `Step-free entrance ${a.where}`, s: `${a.short} — ${reports(a.k)}`,
      tags: ['stepfree'], src: 'community', n: a.k, last: iso(a.last), kind: 'entrance', quote: a.quote,
      i18n: {
        t: { key: 'facts.t.altEntrance', refs: { where: `trust.entrance.${a.id}.where` } },
        s: countedI18n(`trust.entrance.${a.id}.short`, a.k),
      },
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
    bucket[kind].push({
      ...line, s: `${line.s} — ${n(k, 'person', 'people')}`, tags: need.tags, src: 'community', n: k, last, kind: 'experience',
      i18n: {
        t: { key: `facts.t.exp.${kind}`, params: { count: k }, refs: { who: { key: `data.need.${need.id}.who`, lower: true }, whoPlural: `data.need.${need.id}.whoPlural` } },
        s: { key: `facts.s.exp.${kind}`, params: { count: k }, refs: { need: `data.need.${need.id}.short` } },
      },
    });
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
      // Always "not yet confirmed" in every language (honesty rule).
      i18n: { t: { key: `facts.t.osm.${tag}.${value}` }, s: { key: `facts.s.osm.${tag}.${value}` } },
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
  for (const a of quick) {
    if (FEATURE_IDS.includes(a.feature as FeatureId)) ev.push({ n: [], f: [a.feature as FeatureId], at: iso(a.updatedAt), q: true });
  }
  const lastReview = latest ? iso(latest.createdAt) : null;

  return {
    id: venue.id, name: venue.name, kind: venue.kind, cat: venue.cat,
    area: venue.suburb || 'Manly', address: venue.address, lat: venue.lat, lng: venue.lng,
    phone: venue.phone, website: venue.website,
    osmUrl: `https://www.openstreetmap.org/${venue.osmType}/${venue.osmId}`,
    works, check, barriers, verified: reviews.length, note,
    ev, lastReview,
    // A quick answer is a fresh first-hand check too.
    lastConfirmed: newest([lastReview, confirm?.last, ...quick.map(a => a.updatedAt)]),
    confirmations: confirm?.count ?? 0,
    quick: quick.length,
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
  const items: ReviewVM['items'] = [];
  for (const f of RA2_FEATURES) {
    const val = r.features?.[f.id];
    if (val === 'yes' || val === 'no') items.push({ ok: val === 'yes', text: { key: `data.feature.${f.id}.${val === 'yes' ? 'yesShort' : 'noShort'}` } });
  }
  if (r.entranceAlt && ENTRANCE_ALTS.some(a => a.id === r.entranceAlt)) {
    items.push({ ok: r.entranceAlt !== 'none', text: { key: `trust.entrance.${r.entranceAlt}.short` }, quote: r.entranceNote?.trim() ? clip(r.entranceNote, 80) : undefined });
  }
  for (const [dim, val] of [['noise', r.sensoryNoise], ['light', r.sensoryLight], ['crowd', r.sensoryCrowd]] as const) {
    if (optionOf(dim, val)) items.push({ ok: true, text: { key: `review.item.${dim}.${val}` } });
  }
  if (r.quietTimes?.length) {
    // {list} is filled on the client from `slots` (fmt.list of review.item.slot.*).
    items.push({ ok: true, text: { key: 'review.item.quietTimes' }, slots: r.quietTimes });
  }
  const feats = RA2_FEATURES
    .filter(f => r.features?.[f.id] === 'yes' || r.features?.[f.id] === 'no')
    .map(f => `${r.features[f.id] === 'yes' ? '✓' : '✗'} ${r.features[f.id] === 'yes' ? f.yesShort : f.noShort}`);
  const alt = ENTRANCE_ALTS.find(a => a.id === r.entranceAlt);
  if (alt) feats.push(`${alt.id === 'none' ? '✗' : '✓'} ${alt.short}${r.entranceNote?.trim() ? ` (“${clip(r.entranceNote, 80)}”)` : ''}`);
  // Sensory answers (#17): "Quiet · Soft or natural light · Few people".
  for (const [dim, val] of [['noise', r.sensoryNoise], ['light', r.sensoryLight], ['crowd', r.sensoryCrowd]] as const) {
    const o = optionOf(dim, val);
    if (o) feats.push(o.fact);
  }
  if (r.quietTimes?.length) feats.push(`Usually quiet: ${r.quietTimes.map(s => slotLabel(s).toLowerCase()).join(', ')}`);
  return {
    id: r.id,
    who: needs[0] ? needs[0].who + (needs.length > 1 ? ` (+${needs.length - 1})` : '') : 'Community member',
    filters: needs.map(x => x.filter),
    v: r.verdict as VerdictKind,
    when: ago(+r.createdAt, now),
    text: r.note?.trim() || DEFAULT_TEXT[r.verdict as VerdictKind],
    details: feats.join(' · '),
    mine: r.userId === viewerId,
    needs: needs.map(x => x.id), whoNeed: needs[0]?.id ?? null, whoMore: Math.max(0, needs.length - 1),
    at: iso(r.createdAt), own: !!r.note?.trim(), textKey: r.note?.trim() ? null : `review.default.${r.verdict}`,
    items,
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
