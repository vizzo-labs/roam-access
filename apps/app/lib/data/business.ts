import 'server-only';
// Venue claims, right of reply ("Venue says") and the free venue dashboard.
//
// Honesty rule: nothing in this module touches reviews' verdicts or the facts
// built from them. Replies and statements live in venue_replies and are shown
// apart from community facts, labelled "Venue says".

import { and, asc, desc, eq, gte, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { ensureProfile } from '../data';
import { managesVenue } from '../roles';
import { buildReviewVM, buildVenueVM, ago } from '../venues';
import { RA2_FEATURES, RA2_NEEDS, type NeedId } from '../pilot-data';
import { coversNeed } from '../council/coverage';
import type { ClaimStatus } from '../db/schema-venues';

const { venues, reviews, venueClaims, venueReplies, needsCards, venueViews } = schema;

export const CLAIM_ROLES = [
  { id: 'owner', label: 'Owner' },
  { id: 'manager', label: 'Manager' },
  { id: 'staff', label: 'Staff member' },
] as const;
export const VERIFICATIONS = [
  { id: 'domain-email', label: 'Email on the venue’s website domain' },
  { id: 'phone-check', label: 'Called the venue’s listed phone number' },
  { id: 'in-person', label: 'Checked in person' },
  { id: 'other', label: 'Other (see note)' },
] as const;

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+\n/g, '\n').slice(0, max) : '');
export const REPLY_MAX = 1000;

// ── Finding a place to claim ─────────────────────────────────────────────
export async function searchVenues(q: string) {
  const term = q.trim().slice(0, 60);
  if (term.length < 2) return [];
  return getDb().select({ id: venues.id, name: venues.name, kind: venues.kind, suburb: venues.suburb, address: venues.address })
    .from(venues)
    .where(and(eq(venues.active, true), or(ilike(venues.name, `%${term}%`), ilike(venues.address, `%${term}%`))))
    .orderBy(asc(venues.name)).limit(20);
}

export async function getVenueRow(id: string) {
  const [v] = await getDb().select().from(venues).where(and(eq(venues.id, id), eq(venues.active, true)));
  return v ?? null;
}

// ── Claims ───────────────────────────────────────────────────────────────
export async function createClaim(userId: string, input: Record<string, unknown>) {
  const venueId = clean(input.venueId, 80);
  const v = venueId ? await getVenueRow(venueId) : null;
  if (!v) return { error: 'Choose a place to claim.' } as const;
  const role = CLAIM_ROLES.some(r => r.id === input.role) ? String(input.role) : null;
  if (!role) return { error: 'Say how you’re connected to the venue.' } as const;
  const contactName = clean(input.contactName, 80);
  const contactEmail = clean(input.contactEmail, 120);
  const contactPhone = clean(input.contactPhone, 40);
  const evidence = clean(input.evidence, 1000);
  if (!contactName) return { error: 'Add your name, so we know who to contact.' } as const;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { error: 'Add a work email address we can reach you on.' } as const;
  if (input.agree !== 'yes') return { error: 'Please confirm you understand claiming never changes reviews or verdicts.' } as const;

  const db = getDb();
  await ensureProfile(userId);
  const [open] = await db.select({ id: venueClaims.id, status: venueClaims.status }).from(venueClaims)
    .where(and(eq(venueClaims.venueId, v.id), eq(venueClaims.userId, userId), inArray(venueClaims.status, ['pending', 'approved'])));
  if (open) return { error: open.status === 'approved' ? 'You already manage this place.' : 'You’ve already asked to claim this place — we’ll be in touch.' } as const;
  const [row] = await db.insert(venueClaims).values({ venueId: v.id, userId, role, contactName, contactEmail, contactPhone, evidence }).returning({ id: venueClaims.id });
  return { ok: true, id: row.id, venueId: v.id } as const;
}

export async function getMyClaims(userId: string) {
  return getDb().select({
    id: venueClaims.id, venueId: venueClaims.venueId, status: venueClaims.status, createdAt: venueClaims.createdAt,
    decidedAt: venueClaims.decidedAt, venueName: venues.name, suburb: venues.suburb, kind: venues.kind,
  }).from(venueClaims).innerJoin(venues, eq(venues.id, venueClaims.venueId))
    .where(eq(venueClaims.userId, userId)).orderBy(desc(venueClaims.createdAt));
}

/** Admin review queue: pending first. Includes what an admin needs to verify. */
export async function listClaimsForAdmin() {
  return getDb().select({
    id: venueClaims.id, venueId: venueClaims.venueId, userId: venueClaims.userId, status: venueClaims.status,
    role: venueClaims.role, contactName: venueClaims.contactName, contactEmail: venueClaims.contactEmail,
    contactPhone: venueClaims.contactPhone, evidence: venueClaims.evidence, verification: venueClaims.verification,
    adminNote: venueClaims.adminNote, createdAt: venueClaims.createdAt, decidedAt: venueClaims.decidedAt,
    venueName: venues.name, venueWebsite: venues.website, venuePhone: venues.phone, suburb: venues.suburb,
  }).from(venueClaims).innerJoin(venues, eq(venues.id, venueClaims.venueId))
    .orderBy(sql`case ${venueClaims.status} when 'pending' then 0 when 'approved' then 1 else 2 end`, desc(venueClaims.createdAt))
    .limit(300);
}

/** "Does this email's domain match the venue website?" — a hint for the admin, not proof. */
export function domainMatches(email: string, website: string | null) {
  if (!website || !email.includes('@')) return false;
  try {
    const host = new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace(/^www\./, '').toLowerCase();
    const dom = email.split('@')[1].toLowerCase();
    return dom === host || dom.endsWith(`.${host}`) || host.endsWith(`.${dom}`);
  } catch { return false; }
}

export async function decideClaim(id: string, status: ClaimStatus, adminUserId: string, verification: string | null, note: string | null) {
  if (!['approved', 'rejected', 'revoked', 'pending'].includes(status)) throw new Error('bad status');
  const v = VERIFICATIONS.some(x => x.id === verification) ? verification : null;
  if (status === 'approved' && !v) return { error: 'Say how you verified the claim before approving it.' } as const;
  await getDb().update(venueClaims).set({
    status, verification: v, adminNote: clean(note, 500) || null,
    decidedBy: adminUserId, decidedAt: new Date(), updatedAt: new Date(),
  }).where(eq(venueClaims.id, id));
  return { ok: true } as const;
}

// ── "Venue says": replies + access statement ────────────────────────────
export async function saveReply(userId: string, venueId: string, reviewId: string | null, bodyIn: unknown) {
  if (!(await managesVenue(userId, venueId))) return { error: 'You don’t manage this place.' } as const;
  const body = clean(bodyIn, REPLY_MAX);
  const db = getDb();
  if (reviewId) {
    const [r] = await db.select({ id: reviews.id }).from(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.venueId, venueId), eq(reviews.hidden, false)));
    if (!r) return { error: 'That review isn’t on this place.' } as const;
  }
  const where = reviewId
    ? and(eq(venueReplies.venueId, venueId), eq(venueReplies.reviewId, reviewId))
    : and(eq(venueReplies.venueId, venueId), isNull(venueReplies.reviewId));
  if (!body) {
    await db.delete(venueReplies).where(where);
    return { ok: true, removed: true } as const;
  }
  const [existing] = await db.select({ id: venueReplies.id }).from(venueReplies).where(where);
  if (existing) await db.update(venueReplies).set({ body, userId, updatedAt: new Date() }).where(eq(venueReplies.id, existing.id));
  else await db.insert(venueReplies).values({ venueId, reviewId, userId, body });
  return { ok: true, removed: false } as const;
}

export async function isClaimed(venueId: string) {
  const [row] = await getDb().select({ id: venueClaims.id }).from(venueClaims)
    .where(and(eq(venueClaims.venueId, venueId), eq(venueClaims.status, 'approved'))).limit(1);
  return !!row;
}

/** What the app shows under "Venue says" for one place (public to signed-in testers). */
export async function getVenueSays(venueId: string) {
  const db = getDb();
  const [claimed, rows] = await Promise.all([
    isClaimed(venueId),
    db.select({ reviewId: venueReplies.reviewId, body: venueReplies.body, updatedAt: venueReplies.updatedAt })
      .from(venueReplies).where(and(eq(venueReplies.venueId, venueId), eq(venueReplies.hidden, false))),
  ]);
  const now = Date.now();
  const statementRow = rows.find(r => !r.reviewId);
  const replies: Record<string, { body: string; when: string }> = {};
  for (const r of rows) if (r.reviewId) replies[r.reviewId] = { body: r.body, when: ago(+r.updatedAt, now) };
  return {
    claimed,
    statement: statementRow ? { body: statementRow.body, when: ago(+statementRow.updatedAt, now) } : null,
    replies,
  };
}

// ── Needs cards a venue has received ─────────────────────────────────────
export async function listCardsForVenue(venueId: string) {
  return getDb().select({
    id: needsCards.id, needs: needsCards.needs, note: needsCards.note, visitOn: needsCards.visitOn,
    status: needsCards.status, venueResponse: needsCards.venueResponse, createdAt: needsCards.createdAt,
  }).from(needsCards).where(and(eq(needsCards.venueId, venueId), inArray(needsCards.status, ['sent', 'seen', 'replied'])))
    .orderBy(desc(needsCards.createdAt)).limit(100);
}

export async function respondToCard(userId: string, venueId: string, cardId: string, responseIn: unknown) {
  if (!(await managesVenue(userId, venueId))) return { error: 'You don’t manage this place.' } as const;
  const response = clean(responseIn, 500);
  const now = new Date();
  await getDb().update(needsCards).set(response
    ? { status: 'replied', venueResponse: response, respondedAt: now, seenAt: sql`coalesce(${needsCards.seenAt}, now())`, updatedAt: now }
    : { status: sql`case when ${needsCards.status} = 'replied' then 'replied' else 'seen' end`, seenAt: sql`coalesce(${needsCards.seenAt}, now())`, updatedAt: now },
  ).where(and(eq(needsCards.id, cardId), eq(needsCards.venueId, venueId)));
  return { ok: true } as const;
}

// ── The venue dashboard ──────────────────────────────────────────────────
const DAYS = 30;

export async function getVenueDashboard(venueId: string) {
  const db = getDb();
  const venue = await getVenueRow(venueId);
  if (!venue) return null;
  const since = sql`(now() at time zone 'Australia/Sydney')::date - ${DAYS}::int`;
  const [rs, views, says, cards] = await Promise.all([
    db.select().from(reviews).where(and(eq(reviews.venueId, venueId), eq(reviews.hidden, false))).orderBy(desc(reviews.createdAt)),
    db.select({ kind: venueViews.kind, need: venueViews.need, n: sql<number>`sum(${venueViews.count})::int` })
      .from(venueViews).where(and(eq(venueViews.venueId, venueId), gte(venueViews.day, since)))
      .groupBy(venueViews.kind, venueViews.need),
    getVenueSays(venueId),
    listCardsForVenue(venueId),
  ]);
  const count = (kind: string, need: string) => views.find(v => v.kind === kind && v.need === need)?.n ?? 0;
  const vm = buildVenueVM(venue, rs);
  const now = Date.now();

  const byNeed = RA2_NEEDS.map(n => {
    const covered = rs.some(r => coversNeed(r, n.id as NeedId));
    return { id: n.id, label: n.chip, who: n.whoPlural, views: count('view', n.id), searches: count('search', n.id), covered };
  });
  const unmet = byNeed.filter(n => !n.covered && (n.views + n.searches) > 0).sort((a, b) => (b.views + b.searches) - (a.views + a.searches));

  // Review questions nobody has answered yet, most-wanted first (by the
  // demand of the needs they serve).
  const answered = new Set(rs.flatMap(r => Object.keys(r.features || {})));
  const missing = RA2_FEATURES.filter(f => !answered.has(f.id)).map(f => {
    const demand = RA2_NEEDS.filter(n => n.tags.includes(f.id)).reduce((s, n) => s + count('view', n.id) + count('search', n.id), 0);
    return { id: f.id, question: f.question, demand };
  }).sort((a, b) => b.demand - a.demand);

  return {
    venue: { id: venue.id, name: venue.name, kind: venue.kind, suburb: venue.suburb, address: venue.address },
    days: DAYS,
    totals: { views: count('view', 'any'), searches: count('search', 'any'), reviews: rs.length, cards: cards.length },
    byNeed, unmet, missing,
    facts: { works: vm.works, check: vm.check, barriers: vm.barriers },
    reviews: rs.map(r => ({ ...buildReviewVM(r, '', now), reply: says.replies[r.id] ?? null })),
    statement: says.statement,
    cards,
  };
}

// ── Moderation (admin) ───────────────────────────────────────────────────
export async function listRecentReplies() {
  return getDb().select({
    id: venueReplies.id, venueId: venueReplies.venueId, reviewId: venueReplies.reviewId, body: venueReplies.body,
    hidden: venueReplies.hidden, updatedAt: venueReplies.updatedAt, venueName: venues.name,
  }).from(venueReplies).innerJoin(venues, eq(venues.id, venueReplies.venueId))
    .orderBy(desc(venueReplies.updatedAt)).limit(100);
}

export async function setReplyHidden(id: string, hidden: boolean) {
  await getDb().update(venueReplies).set({ hidden }).where(eq(venueReplies.id, id));
}
