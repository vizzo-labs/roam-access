import 'server-only';
// F1 · Trust & freshness: "Still accurate?" confirmations and problem reports
// (closed, moved, wrong location, duplicate, info wrong) + the admin queue.
// Confirmations only refresh "Last confirmed" — they never change a verdict.

import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import type { IssueKind, IssueResolution } from '../db/schema';
import type { ConfirmationStat } from '../venues';

const { venues, profiles, venueConfirmations, venueIssues } = schema;

export const ISSUE_KINDS: { id: IssueKind; label: string; hint: string }[] = [
  { id: 'closed',         label: 'It has closed',            hint: 'Closed for good, not just today' },
  { id: 'moved',          label: 'It has moved',             hint: 'Tell us the new address if you know it' },
  { id: 'wrong_location', label: 'Wrong spot on the map',    hint: 'The pin or address is in the wrong place' },
  { id: 'duplicate',      label: 'It’s listed twice',         hint: 'Tell us the other listing’s name' },
  { id: 'info_wrong',     label: 'Something here is wrong',  hint: 'Access info, name, phone or website' },
];
const KIND_IDS = ISSUE_KINDS.map(k => k.id);
const NOTE_MAX = 500;

async function ensureProfile(userId: string) {
  await getDb().insert(profiles).values({ userId }).onConflictDoNothing();
}

async function activeVenue(venueId: string) {
  const [v] = await getDb().select({ id: venues.id }).from(venues).where(and(eq(venues.id, venueId), eq(venues.active, true)));
  return v ?? null;
}

/** Latest "still accurate" per venue, for the view model. */
export async function getConfirmationStats(venueId?: string): Promise<Map<string, ConfirmationStat>> {
  const db = getDb();
  const rows = await db.select({
    venueId: venueConfirmations.venueId,
    last: sql<number>`(extract(epoch from max(${venueConfirmations.confirmedAt})) * 1000)::float8`.mapWith(Number),
    count: sql<number>`count(*)::int`,
  }).from(venueConfirmations)
    .where(venueId ? eq(venueConfirmations.venueId, venueId) : undefined)
    .groupBy(venueConfirmations.venueId);
  return new Map(rows.map(r => [r.venueId, { last: new Date(r.last), count: r.count }]));
}

/** "Still accurate? Yes" — one row per tester per place, moved forward on repeat. */
export async function confirmVenue(userId: string, venueId: string) {
  if (!(await activeVenue(venueId))) return { error: 'Unknown venue' } as const;
  await ensureProfile(userId);
  await getDb().insert(venueConfirmations).values({ venueId, userId })
    .onConflictDoUpdate({ target: [venueConfirmations.venueId, venueConfirmations.userId], set: { confirmedAt: sql`now()` } });
  return { ok: true } as const;
}

/** "Report a problem". Repeating the same report updates its note instead of piling up. */
export async function reportIssue(userId: string, venueId: string, input: { kind?: unknown; note?: unknown }) {
  if (!KIND_IDS.includes(input.kind as IssueKind)) return { error: 'kind must be one of ' + KIND_IDS.join(', ') } as const;
  if (!(await activeVenue(venueId))) return { error: 'Unknown venue' } as const;
  const kind = input.kind as IssueKind;
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, NOTE_MAX) || null : null;
  await ensureProfile(userId);
  const db = getDb();
  const [open] = await db.select({ id: venueIssues.id }).from(venueIssues).where(and(
    eq(venueIssues.venueId, venueId), eq(venueIssues.userId, userId), eq(venueIssues.kind, kind), eq(venueIssues.status, 'open'),
  ));
  if (open) await db.update(venueIssues).set({ note, createdAt: new Date() }).where(eq(venueIssues.id, open.id));
  else await db.insert(venueIssues).values({ venueId, userId, kind, note });
  return { ok: true } as const;
}

// ── Admin ────────────────────────────────────────────────────────────────
export async function getIssueQueue() {
  const db = getDb();
  const cols = {
    id: venueIssues.id, kind: venueIssues.kind, note: venueIssues.note, status: venueIssues.status,
    resolution: venueIssues.resolution, resolvedAt: venueIssues.resolvedAt, createdAt: venueIssues.createdAt,
    userId: venueIssues.userId, venueId: venueIssues.venueId, venueName: venues.name,
    venueAddress: venues.address, venueSuburb: venues.suburb, venueActive: venues.active,
    osmType: venues.osmType, osmId: venues.osmId,
  };
  const [open, resolved] = await Promise.all([
    db.select(cols).from(venueIssues).innerJoin(venues, eq(venues.id, venueIssues.venueId))
      .where(eq(venueIssues.status, 'open')).orderBy(desc(venueIssues.createdAt)).limit(200),
    db.select(cols).from(venueIssues).innerJoin(venues, eq(venues.id, venueIssues.venueId))
      .where(eq(venueIssues.status, 'resolved')).orderBy(desc(venueIssues.resolvedAt)).limit(30),
  ]);
  return { open, resolved };
}

export async function resolveIssue(id: string, resolution: Exclude<IssueResolution, 'venue_inactive'>) {
  await getDb().update(venueIssues).set({ status: 'resolved', resolution, resolvedAt: new Date() })
    .where(and(eq(venueIssues.id, id), eq(venueIssues.status, 'open')));
}

/** Hide the place from the app and close every open report about it. */
export async function markVenueInactiveForIssue(id: string) {
  const db = getDb();
  const [issue] = await db.select({ venueId: venueIssues.venueId }).from(venueIssues).where(eq(venueIssues.id, id));
  if (!issue) return;
  await db.update(venues).set({ active: false, updatedAt: new Date() }).where(eq(venues.id, issue.venueId));
  await db.update(venueIssues).set({ status: 'resolved', resolution: 'venue_inactive', resolvedAt: new Date() })
    .where(and(eq(venueIssues.venueId, issue.venueId), eq(venueIssues.status, 'open')));
}

export async function reactivateVenue(venueId: string) {
  await getDb().update(venues).set({ active: true, updatedAt: new Date() }).where(eq(venues.id, venueId));
}
