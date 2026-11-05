import 'server-only';
// Everything the council dashboard, its CSV export and the printable DIAP
// report show — computed in one place so the three always agree with each
// other and with the database.
//
// Aggregates only: no names, no user ids, no individual needs. A "gap" is a
// place with no community information for a need (lib/council/coverage.ts);
// OpenStreetMap tags never close a gap.

import { eq, gte, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { RA2_NEEDS, type NeedId } from '../pilot-data';
import { getVenueVMs } from '../data';
import { ra2Verdict } from '../pilot/match'; // the app's own verdict engine (plain JS)
import { coveredNeeds } from './coverage';
import { ATIC_CATEGORIES, FEATURE_TO_ATIC, NEED_TO_ATIC, type AticId } from '../standards/atic';

const { venues, reviews, profiles, microAnswers, venueClaims, venueReplies, needsCards, venueViews } = schema;

export const DEMAND_DAYS = 90;
export const TREND_WEEKS = 12;
// Grid cells for the gap heatmap: ~450 m × ~460 m at Manly's latitude.
const CELL_LAT = 0.004, CELL_LNG = 0.005;

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

export type NeedGap = { need: NeedId; label: string; venues: number; covered: number; gap: number; gapPct: number; demand: number; unmetDemand: number; works: number; barriers: number };

function needGap(need: NeedId, label: string, vs: { id: string }[], coveredBy: Map<string, Set<NeedId>>, demandOf: (venueId: string, need: NeedId) => number, facts: Map<string, { works: Set<NeedId>; barriers: Set<NeedId> }>): NeedGap {
  let covered = 0, demand = 0, unmetDemand = 0, works = 0, barriers = 0;
  for (const v of vs) {
    const has = coveredBy.get(v.id)?.has(need) ?? false;
    const d = demandOf(v.id, need);
    if (has) covered++; else unmetDemand += d;
    demand += d;
    if (facts.get(v.id)?.works.has(need)) works++;
    if (facts.get(v.id)?.barriers.has(need)) barriers++;
  }
  const gap = vs.length - covered;
  return { need, label, venues: vs.length, covered, gap, gapPct: pct(gap, vs.length), demand, unmetDemand, works, barriers };
}

export async function getCouncilMetrics() {
  const db = getDb();
  const demandSince = sql`(now() at time zone 'Australia/Sydney')::date - ${DEMAND_DAYS}::int`;
  const [vs, rs, qs, vms, demandRows, testersByWeek, claims, replies, cards, totals] = await Promise.all([
    db.select().from(venues).where(eq(venues.active, true)),
    db.select().from(reviews).where(eq(reviews.hidden, false)),
    db.select().from(microAnswers).where(eq(microAnswers.hidden, false)),
    getVenueVMs(), // exactly what the app shows (reviews + quick answers)
    db.select({ venueId: venueViews.venueId, kind: venueViews.kind, need: venueViews.need, n: sql<number>`sum(${venueViews.count})::int` })
      .from(venueViews).where(gte(venueViews.day, demandSince)).groupBy(venueViews.venueId, venueViews.kind, venueViews.need),
    db.select({ week: sql<string>`to_char(date_trunc('week', ${profiles.onboardedAt} at time zone 'Australia/Sydney'), 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
      .from(profiles).where(sql`${profiles.onboardedAt} is not null`).groupBy(sql`1`),
    db.select({ venueId: venueClaims.venueId, status: venueClaims.status }).from(venueClaims),
    db.select({ venueId: venueReplies.venueId, reviewId: venueReplies.reviewId, createdAt: venueReplies.createdAt })
      .from(venueReplies).where(eq(venueReplies.hidden, false)),
    db.select({ venueId: needsCards.venueId, status: needsCards.status }).from(needsCards).where(sql`${needsCards.venueId} is not null`),
    db.select({ testers: sql<number>`count(*)::int` }).from(profiles).where(sql`${profiles.onboardedAt} is not null`),
  ]);
  const venueIds = new Set(vs.map(v => v.id));

  // Reviews and quick answers per venue, coverage per venue, verdicts per venue.
  const byVenue = new Map<string, typeof rs>();
  for (const r of rs) if (venueIds.has(r.venueId)) byVenue.set(r.venueId, [...(byVenue.get(r.venueId) || []), r]);
  const quickBy = new Map<string, typeof qs>();
  for (const q of qs) if (venueIds.has(q.venueId)) quickBy.set(q.venueId, [...(quickBy.get(q.venueId) || []), q]);
  const hasInfo = (id: string) => (byVenue.get(id) || []).length > 0 || (quickBy.get(id) || []).length > 0;
  const vmById = new Map(vms.map(vm => [vm.id, vm]));
  const coveredBy = new Map<string, Set<NeedId>>();
  const facts = new Map<string, { works: Set<NeedId>; barriers: Set<NeedId> }>();
  for (const v of vs) {
    coveredBy.set(v.id, coveredNeeds(byVenue.get(v.id) || [], quickBy.get(v.id) || []));
    // The verdict a person with only this need would see — the same engine as the app.
    const vm = vmById.get(v.id);
    const kinds = vm ? RA2_NEEDS.map(n => [n.id, (ra2Verdict(vm, [n.id]) as { kind: string }).kind] as const) : [];
    facts.set(v.id, { works: new Set(kinds.filter(k => k[1] === 'works').map(k => k[0])), barriers: new Set(kinds.filter(k => k[1] === 'barrier').map(k => k[0])) });
  }

  // Demand: views + search impressions by people with each need.
  const demand = new Map<string, number>();
  let demandAny = 0;
  for (const d of demandRows) {
    if (!venueIds.has(d.venueId)) continue;
    if (d.need === 'any') { demandAny += d.n; continue; }
    demand.set(`${d.venueId}|${d.need}`, (demand.get(`${d.venueId}|${d.need}`) || 0) + d.n);
  }
  const demandOf = (venueId: string, need: NeedId) => demand.get(`${venueId}|${need}`) || 0;

  const reviewed = vs.filter(v => hasInfo(v.id)).length;
  const summary = {
    venues: vs.length,
    venuesReviewed: reviewed,
    reviewedPct: pct(reviewed, vs.length),
    reviews: rs.filter(r => venueIds.has(r.venueId)).length,
    quickAnswers: qs.filter(q => venueIds.has(q.venueId)).length,
    reviewers: new Set([...rs.map(r => r.userId), ...qs.map(q => q.userId)]).size,
    testers: totals[0]?.testers ?? 0,
    demand: demandAny,
  };

  const byNeed = RA2_NEEDS.map(n => needGap(n.id, n.chip, vs, coveredBy, demandOf, facts));

  const suburbs = [...new Set(vs.map(v => v.suburb || 'Manly'))].sort();
  const bySuburb = suburbs.map(s => {
    const sv = vs.filter(v => (v.suburb || 'Manly') === s);
    const needs = RA2_NEEDS.map(n => needGap(n.id, n.chip, sv, coveredBy, demandOf, facts));
    const sr = sv.filter(v => hasInfo(v.id)).length;
    return { suburb: s, venues: sv.length, reviewed: sr, reviewedPct: pct(sr, sv.length), needs, unmetDemand: needs.reduce((a, x) => a + x.unmetDemand, 0) };
  }).sort((a, b) => b.venues - a.venues);

  // ATIC categories: a place is covered for a category when a review answered
  // a question in it, or someone with a need that maps directly to it reviewed.
  const byAtic = ATIC_CATEGORIES.map(c => {
    const covered = vs.filter(v => (quickBy.get(v.id) || []).some(q => (FEATURE_TO_ATIC[q.feature as keyof typeof FEATURE_TO_ATIC] || []).includes(c.id)) || (byVenue.get(v.id) || []).some(r =>
      Object.entries(r.features || {}).some(([f, val]) => (val === 'yes' || val === 'no') && (FEATURE_TO_ATIC[f as keyof typeof FEATURE_TO_ATIC] || []).includes(c.id))
      || r.needs.some(n => { const m = NEED_TO_ATIC[n as NeedId]; return m && m.fit === 'direct' && m.atic.includes(c.id as AticId); }),
    )).length;
    return { id: c.id, label: c.label, venues: vs.length, covered, gap: vs.length - covered, gapPct: pct(vs.length - covered, vs.length) };
  });

  // Heatmap grid: per cell, venues and gaps per need.
  const cells = new Map<string, { row: number; col: number; venues: string[] }>();
  for (const v of vs) {
    const row = Math.floor(v.lat / CELL_LAT), col = Math.floor(v.lng / CELL_LNG);
    const key = `${row}:${col}`;
    const c = cells.get(key) || { row, col, venues: [] };
    c.venues.push(v.id);
    cells.set(key, c);
  }
  const grid = [...cells.values()].map(c => {
    const suburbCount = new Map<string, number>();
    for (const id of c.venues) { const s = vs.find(v => v.id === id)!.suburb || 'Manly'; suburbCount.set(s, (suburbCount.get(s) || 0) + 1); }
    const suburb = [...suburbCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const gaps: Record<string, number> = {};
    for (const n of RA2_NEEDS) gaps[n.id] = c.venues.filter(id => !coveredBy.get(id)?.has(n.id)).length;
    gaps.any = c.venues.filter(id => !hasInfo(id)).length;
    return {
      id: `${c.row}:${c.col}`, suburb, venues: c.venues.length, gaps,
      bounds: [c.col * CELL_LNG, c.row * CELL_LAT, (c.col + 1) * CELL_LNG, (c.row + 1) * CELL_LAT] as [number, number, number, number],
    };
  }).sort((a, b) => b.venues - a.venues);

  // Trends by ISO week (Monday), Sydney time, last TREND_WEEKS weeks.
  const weekOf = (d: Date) => {
    const local = new Date(d.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
    const day = (local.getDay() + 6) % 7;
    local.setDate(local.getDate() - day);
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
  };
  const thisWeek = weekOf(new Date());
  const weeks: string[] = [];
  for (let i = TREND_WEEKS - 1; i >= 0; i--) {
    const [y, m, d] = thisWeek.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d - i * 7));
    weeks.push(t.toISOString().slice(0, 10));
  }
  const firstReview = new Map<string, string>();
  const contributions = [...rs.map(r => ({ venueId: r.venueId, at: r.createdAt })), ...qs.map(q => ({ venueId: q.venueId, at: q.createdAt }))];
  for (const r of contributions.sort((a, b) => +a.at - +b.at)) if (venueIds.has(r.venueId) && !firstReview.has(r.venueId)) firstReview.set(r.venueId, weekOf(r.at));
  const trends = weeks.map(w => ({
    week: w,
    reviews: rs.filter(r => venueIds.has(r.venueId) && weekOf(r.createdAt) === w).length,
    quickAnswers: qs.filter(q => venueIds.has(q.venueId) && weekOf(q.createdAt) === w).length,
    newTesters: testersByWeek.find(t => t.week === w)?.n ?? 0,
    venuesCoveredToDate: [...firstReview.values()].filter(fw => fw <= w).length,
  })).map(t => ({ ...t, coveredPctToDate: pct(t.venuesCoveredToDate, vs.length) }));

  // Business inclusion (DIAP: "work with businesses … to identify barriers to
  // access in town and village centres").
  const claimed = new Set(claims.filter(c => c.status === 'approved' && venueIds.has(c.venueId)).map(c => c.venueId));
  const reviewReplies = new Set(replies.filter(r => r.reviewId).map(r => r.reviewId!));
  const statements = new Set(replies.filter(r => !r.reviewId).map(r => r.venueId));
  const barrierVenues = vs.filter(v => facts.get(v.id)!.barriers.size > 0).map(v => v.id);
  const claimedReviews = rs.filter(r => claimed.has(r.venueId));
  const barrierReviewsAtClaimed = claimedReviews.filter(r => r.verdict === 'barrier');
  const business = {
    claimRequests: claims.filter(c => venueIds.has(c.venueId)).length,
    claimsPending: claims.filter(c => c.status === 'pending').length,
    claimedVenues: claimed.size,
    claimedPct: pct(claimed.size, vs.length),
    venuesWithStatement: statements.size,
    reviewsAtClaimed: claimedReviews.length,
    reviewsReplied: claimedReviews.filter(r => reviewReplies.has(r.id)).length,
    replyRatePct: pct(claimedReviews.filter(r => reviewReplies.has(r.id)).length, claimedReviews.length),
    barrierReviewsReplied: barrierReviewsAtClaimed.filter(r => reviewReplies.has(r.id)).length,
    barrierReviewsAtClaimed: barrierReviewsAtClaimed.length,
    venuesWithBarriers: barrierVenues.length,
    venuesWithBarriersClaimed: barrierVenues.filter(id => claimed.has(id)).length,
    cardsSent: cards.length,
    cardsAnswered: cards.filter(c => c.status === 'seen' || c.status === 'replied').length,
    cardsAnsweredPct: pct(cards.filter(c => c.status === 'seen' || c.status === 'replied').length, cards.length),
  };

  return {
    generatedAt: new Date().toISOString(),
    demandDays: DEMAND_DAYS,
    summary, byNeed, bySuburb, byAtic, grid, trends, business,
  };
}

export type CouncilMetrics = Awaited<ReturnType<typeof getCouncilMetrics>>;
