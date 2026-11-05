import 'server-only';
// Pre-arrival "my needs" cards. The template (venue_id NULL) is the tester's
// own card; a sent card goes to a claimed venue, which sees needs + note +
// visit date and never a name. All rows are deleted with the account.

import { and, desc, eq, gte, isNull, isNotNull, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { ensureProfile } from '../data';
import { isClaimed } from './business';
import { NEED_IDS } from '../pilot-data';
import { NOTE_MAX } from '../needs-card';

const { needsCards, venues } = schema;
const SENDS_PER_DAY = 10;

function parse(input: Record<string, unknown>) {
  const needs = Array.isArray(input.needs)
    ? [...new Set(input.needs.filter((x): x is string => typeof x === 'string' && (NEED_IDS as string[]).includes(x)))]
    : [];
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, NOTE_MAX) : '';
  const visitOn = typeof input.visitOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.visitOn) ? input.visitOn : null;
  return { needs, note, visitOn };
}

export async function getMyCard(userId: string) {
  const db = getDb();
  const profile = await ensureProfile(userId);
  const [[tpl], sent] = await Promise.all([
    db.select().from(needsCards).where(and(eq(needsCards.userId, userId), isNull(needsCards.venueId))),
    db.select({
      id: needsCards.id, venueId: needsCards.venueId, venueName: venues.name, needs: needsCards.needs, note: needsCards.note,
      visitOn: needsCards.visitOn, status: needsCards.status, venueResponse: needsCards.venueResponse,
      createdAt: needsCards.createdAt, seenAt: needsCards.seenAt, respondedAt: needsCards.respondedAt,
    }).from(needsCards).innerJoin(venues, eq(venues.id, needsCards.venueId))
      .where(and(eq(needsCards.userId, userId), isNotNull(needsCards.venueId)))
      .orderBy(desc(needsCards.createdAt)).limit(50),
  ]);
  return {
    card: tpl
      ? { needs: tpl.needs, note: tpl.note, visitOn: tpl.visitOn, saved: true }
      : { needs: profile.needs, note: '', visitOn: null, saved: false },
    sent,
  };
}

export async function saveMyCard(userId: string, input: Record<string, unknown>) {
  const db = getDb();
  await ensureProfile(userId);
  const c = parse(input);
  const [existing] = await db.select({ id: needsCards.id }).from(needsCards).where(and(eq(needsCards.userId, userId), isNull(needsCards.venueId)));
  if (existing) await db.update(needsCards).set({ ...c, updatedAt: new Date() }).where(eq(needsCards.id, existing.id));
  else await db.insert(needsCards).values({ userId, ...c, status: 'draft' });
  return { ok: true } as const;
}

export async function sendCard(userId: string, input: Record<string, unknown>) {
  const venueId = typeof input.venueId === 'string' ? input.venueId : '';
  const db = getDb();
  const [v] = venueId ? await db.select({ id: venues.id, name: venues.name }).from(venues).where(and(eq(venues.id, venueId), eq(venues.active, true))) : [];
  if (!v) return { error: 'Unknown place.' } as const;
  if (!(await isClaimed(v.id))) return { error: 'This place hasn’t joined Roam Access yet, so it can’t receive cards in the app. Share your card another way.' } as const;
  const c = parse(input);
  if (!c.needs.length && !c.note) return { error: 'Add at least one need or a note to your card.' } as const;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(needsCards)
    .where(and(eq(needsCards.userId, userId), isNotNull(needsCards.venueId), gte(needsCards.createdAt, sql`now() - interval '1 day'`)));
  if (n >= SENDS_PER_DAY) return { error: 'You’ve sent a lot of cards today — try again tomorrow.' } as const;
  await ensureProfile(userId);
  await saveMyCard(userId, c);
  await db.insert(needsCards).values({ userId, venueId: v.id, ...c, status: 'sent' });
  return { ok: true, venueName: v.name } as const;
}
