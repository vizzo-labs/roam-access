// Source + confidence labels: how far to trust a verdict or a fact. Pure
// functions shared by the server and the screens; recency is worked out at
// render time so "6 weeks ago" never goes stale in a cached payload.
//
//   verdict  "Based on 3 wheelchair or mobility aid users · latest 6 weeks ago"
//   fact     "3 reports from the community · latest 2 days ago"
//   osm      "OpenStreetMap (unconfirmed)"
//   venue    "Venue says (not checked by the community)"   — reserved for later

import { RA2_NEEDS, type FeatureId } from '../pilot-data';
import type { Evidence, Fact, FactSource } from '../venues';

const DAY = 86400000;
const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

/** "today", "yesterday", "3 days ago", "2 weeks ago", "5 months ago", "over a year ago". */
export function since(isoDate: string, now = Date.now()) {
  const d = Math.floor((now - +new Date(isoDate)) / DAY);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  if (d < 365) return `${Math.round(d / 30.4)} months ago`;
  return 'over a year ago';
}

/** en-AU long date in Sydney time: "6 November 2026". */
export function dateAU(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' });
}

/** Older than this, a verdict is worth re-checking. */
export const STALE_DAYS = 365;
export const isStale = (isoDate: string | null, now = Date.now()) => !!isoDate && now - +new Date(isoDate) > STALE_DAYS * DAY;

export const SOURCE_NAME: Record<FactSource, string> = {
  community: 'Community',
  osm: 'OpenStreetMap (unconfirmed)',
  venue: 'Venue says (not checked by the community)',
};

/** One fact's source line. */
export function factSource(f: Fact, now = Date.now()) {
  if (f.src !== 'community') return SOURCE_NAME[f.src];
  if (!f.n) return SOURCE_NAME.community;
  const when = f.last ? ` · latest ${since(f.last, now)}` : '';
  // Quick answers ("Help fill the gaps") are always named as such.
  if (f.quick && f.quick === f.n) return `${n(f.n, 'quick answer', 'quick answers')} from the community${when}`;
  if (f.quick) return `${n(f.n, 'report', 'reports')} from the community, ${f.quick} by quick answer${when}`;
  return `${n(f.n, 'report', 'reports')} from the community${when}`;
}

type VerdictLike = { kind: string; works: Fact[]; checks: Fact[]; barriers: Fact[] };
type VenueLike = { ev?: Evidence[]; verified: number };

function needTags(needIds: string[]): FeatureId[] {
  return RA2_NEEDS.filter(x => needIds.includes(x.id)).flatMap(x => x.tags);
}

/**
 * Who stands behind this verdict for this person. Counts each review once:
 * reviews by people who share a need, or that answered a question touching
 * one of their needs (anyone can say "there's a step").
 */
export function verdictBasis(venue: VenueLike, verdict: VerdictLike, needIds: string[]) {
  const all = venue.ev || [];
  const tags = needTags(needIds);
  const shares = (e: Evidence) => e.n.some(x => needIds.includes(x));
  const touching = needIds.length ? all.filter(e => shares(e) || e.f.some(f => tags.includes(f))) : all;
  // Quick answers are counted separately: they carry no needs.
  const ev = all.filter(e => !e.q);
  const relevant = touching.filter(e => !e.q);
  const quick = touching.length - relevant.length;
  const same = needIds.length ? relevant.filter(shares) : [];
  const latest = touching.reduce<string | null>((m, e) => (!m || e.at > m ? e.at : m), null);
  const facts = [...verdict.works, ...verdict.checks, ...verdict.barriers];
  const hasOsm = facts.some(f => f.src === 'osm');
  return {
    people: relevant.length, quick, sameNeeds: same.length, latest, hasOsm,
    osmOnly: !touching.length && hasOsm,
    otherReviews: ev.length - relevant.length,
  };
}

function whoLabel(people: number, sameNeeds: number, needIds: string[]) {
  const person = n(people, 'person', 'people');
  if (!needIds.length) return person;
  if (sameNeeds === people) {
    if (needIds.length === 1) {
      const need = RA2_NEEDS.find(x => x.id === needIds[0]);
      if (need) return `${people} ${people === 1 ? need.who.toLowerCase() : need.whoPlural}`;
    }
    return `${person} with your access needs`;
  }
  if (sameNeeds > 0) return `${person}, ${sameNeeds} with your access needs`;
  return `${person} (none with your access needs yet)`;
}

/** Venue page: the full source line under the verdict. */
export function verdictSource(venue: VenueLike, verdict: VerdictLike, needIds: string[], now = Date.now()) {
  const b = verdictBasis(venue, verdict, needIds);
  if (b.people || b.quick) {
    const who = [
      b.people ? whoLabel(b.people, b.sameNeeds, needIds) : null,
      b.quick ? n(b.quick, 'quick answer', 'quick answers') : null,
    ].filter(Boolean).join(' and ');
    return `Based on ${who} · latest ${since(b.latest!, now)}`
      + (b.hasOsm ? ' · plus OpenStreetMap (unconfirmed)' : '');
  }
  if (b.osmOnly) return 'Only OpenStreetMap (unconfirmed) — nobody in the pilot has checked yet';
  if (b.otherReviews) return `${n(b.otherReviews, 'review', 'reviews')} here, none about your needs yet`;
  return 'No reviews yet';
}

/** Result cards and the map card: the same, shorter. */
export function verdictSourceShort(venue: VenueLike, verdict: VerdictLike, needIds: string[], now = Date.now()) {
  const b = verdictBasis(venue, verdict, needIds);
  if (b.people || b.quick) {
    const same = !needIds.length || !b.sameNeeds ? ''
      : b.sameNeeds === b.people ? ' with your needs' : `, ${b.sameNeeds} with your needs`;
    const who = [
      b.people ? `${n(b.people, 'person', 'people')}${same}` : null,
      b.quick ? n(b.quick, 'quick answer', 'quick answers') : null,
    ].filter(Boolean).join(' + ');
    return `${who} · ${since(b.latest!, now)}${b.hasOsm ? ' · + OpenStreetMap' : ''}`;
  }
  if (b.osmOnly) return 'OpenStreetMap (unconfirmed)';
  return 'No reviews for your needs yet';
}

