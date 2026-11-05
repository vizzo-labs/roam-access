import 'server-only';
// Anonymous daily counts of venue page views and search impressions, by the
// access needs of the person looking. Stores counts only — never who looked.
//
// De-duplication: one count per person per venue per kind per Sydney day.
// Burst limit: at most BURST_PER_MINUTE requests per person per minute.
// Both use venue_view_keys, whose keys are HMACs (server secret) of the user
// id + venue + day (or + minute): who looked can't be read back from them,
// keys change every day so they can't be linked across days, and rows older
// than two days are purged.

import { createHmac } from 'node:crypto';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { NEED_IDS } from '../pilot-data';

const { venues, venueViews, venueViewKeys } = schema;

export type ViewKind = 'view' | 'search';
const MAX_IDS = 25;
export const BURST_PER_MINUTE = 20;

const secret = () => process.env.VIEWS_HASH_SECRET || process.env.CLERK_SECRET_KEY || '';
const hmac = (...parts: string[]) => createHmac('sha256', secret()).update(parts.join('\u0000')).digest('base64url');
const sydneyDay = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }); // YYYY-MM-DD

export type RecordResult = { counted: number; limited?: boolean };

export async function recordViews(userId: string, venueIds: string[], kind: ViewKind, needs: string[]): Promise<RecordResult> {
  if (!secret()) return { counted: 0 }; // no key to hash with: count nothing rather than store anything weaker
  const ids = [...new Set(venueIds.filter(id => typeof id === 'string' && id.length < 80))].slice(0, MAX_IDS);
  if (!ids.length) return { counted: 0 };
  const db = getDb();
  const now = new Date();
  const day = sydneyDay(now);

  // Housekeeping now and then: keys only matter for today (and a little slack).
  if (Math.random() < 0.05) {
    await db.delete(venueViewKeys).where(lt(venueViewKeys.day, sydneyDay(new Date(+now - 2 * 86400000))));
  }

  // 1 · Burst limit per person per minute.
  const minute = String(Math.floor(+now / 60000));
  const [burst] = await db.insert(venueViewKeys).values({ key: `b:${hmac('burst', userId, minute)}`, day })
    .onConflictDoUpdate({ target: venueViewKeys.key, set: { hits: sql`${venueViewKeys.hits} + 1` } })
    .returning({ hits: venueViewKeys.hits });
  if ((burst?.hits ?? 0) > BURST_PER_MINUTE) return { counted: 0, limited: true };

  // 2 · Only real, active venues.
  const real = (await db.select({ id: venues.id }).from(venues).where(and(eq(venues.active, true), inArray(venues.id, ids)))).map(v => v.id);
  if (!real.length) return { counted: 0 };

  // 3 · First time today for this person + venue + kind? Insert the key; only new keys count.
  const keyOf = new Map(real.map(id => [`v:${hmac('view', userId, id, kind, day)}`, id]));
  const fresh = await db.insert(venueViewKeys).values([...keyOf.keys()].map(key => ({ key, day })))
    .onConflictDoNothing().returning({ key: venueViewKeys.key });
  const freshIds = fresh.map(f => keyOf.get(f.key)!).filter(Boolean);
  if (!freshIds.length) return { counted: 0 };

  // 4 · +1 per (venue, need), 'any' included.
  const ns = ['any', ...needs.filter(n => (NEED_IDS as string[]).includes(n))];
  await db.insert(venueViews)
    .values(freshIds.flatMap(venueId => ns.map(need => ({ venueId, day, kind, need, count: 1 }))))
    .onConflictDoUpdate({ target: [venueViews.venueId, venueViews.day, venueViews.kind, venueViews.need], set: { count: sql`${venueViews.count} + 1` } });
  return { counted: freshIds.length };
}
