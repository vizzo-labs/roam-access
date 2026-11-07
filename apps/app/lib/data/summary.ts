import 'server-only';
// F4 #19 — the public, read-only access summary of one place (/v/[id], the
// embeddable widget and the printable card). No login, no personal data: no
// names, no review text, no reviewer needs — only the facts and verdicts the
// community produced, per need group, with their sources and recency.

import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { buildVenueVM, type Fact, type VenueVM } from '../venues';
import { RA2_NEEDS, type NeedId } from '../pilot-data';
import { ra2Verdict } from '../pilot/match';
import { getConfirmationStats } from './trust';

const { venues, reviews, microAnswers } = schema;

export type SummaryKind = 'works' | 'check' | 'barrier' | 'unknown';

export type NeedSummary = { id: NeedId; group: string; kind: SummaryKind; why: string };

export type VenueSummary = {
  venue: VenueVM;
  needs: NeedSummary[];
  facts: { kind: 'works' | 'check' | 'barrier'; fact: Fact }[];
  reviews: number;
  quick: number;
  updated: Date | null;
};

// Public wording: there is no "you" on a shared page.
export const SUMMARY_LABEL: Record<SummaryKind, string> = {
  works: 'Works', check: 'Check first', barrier: 'Has barriers', unknown: 'No info yet',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function getVenueSummary(id: string): Promise<VenueSummary | null> {
  const db = getDb();
  const [v] = await db.select().from(venues).where(and(eq(venues.id, id), eq(venues.active, true)));
  if (!v) return null;
  const [rs, qs, confirm] = await Promise.all([
    db.select().from(reviews).where(and(eq(reviews.venueId, id), eq(reviews.hidden, false))),
    db.select().from(microAnswers).where(and(eq(microAnswers.venueId, id), eq(microAnswers.hidden, false))),
    getConfirmationStats(id),
  ]);
  const venue = buildVenueVM(v, rs, confirm.get(id), qs);
  const needs = RA2_NEEDS.map(n => {
    const verdict = ra2Verdict(venue, [n.id]) as { kind: SummaryKind; why: string };
    return {
      id: n.id, group: cap(n.whoPlural), kind: verdict.kind,
      why: verdict.kind === 'unknown' ? 'Nobody has told us yet' : verdict.why,
    };
  });
  const facts = [
    ...venue.barriers.map(fact => ({ kind: 'barrier' as const, fact })),
    ...venue.works.map(fact => ({ kind: 'works' as const, fact })),
    ...venue.check.map(fact => ({ kind: 'check' as const, fact })),
  ];
  return {
    venue, needs, facts, reviews: venue.verified, quick: qs.length,
    // Newest review, quick answer or "Still accurate? Yes".
    updated: venue.lastConfirmed ? new Date(venue.lastConfirmed) : null,
  };
}

/** "6 November 2026" (Sydney). */
export function auDate(d: Date) {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' });
}

/** "Based on 2 reviews and 3 quick answers" — or that nobody has yet. */
export function basisLine(s: Pick<VenueSummary, 'reviews' | 'quick'>) {
  if (!s.reviews && !s.quick) return 'No one in the Roam Access pilot has reviewed this place yet.';
  const parts = [
    s.reviews ? `${s.reviews} community ${s.reviews === 1 ? 'review' : 'reviews'}` : null,
    s.quick ? `${s.quick} quick ${s.quick === 1 ? 'answer' : 'answers'}` : null,
  ].filter(Boolean);
  return `Based on ${parts.join(' and ')} from people with disability.`;
}
