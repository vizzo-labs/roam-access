import 'server-only';
// Anonymous daily counts of venue page views and search impressions, by the
// access needs of the person looking. Stores counts only — never who looked.

import { sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { NEED_IDS } from '../pilot-data';

export type ViewKind = 'view' | 'search';
const MAX_IDS = 25;

export async function recordViews(venueIds: string[], kind: ViewKind, needs: string[]) {
  const ids = [...new Set(venueIds.filter(id => typeof id === 'string' && id.length < 80))].slice(0, MAX_IDS);
  if (!ids.length) return 0;
  const ns = ['any', ...needs.filter(n => (NEED_IDS as string[]).includes(n))];
  const db = getDb();
  // Only ids of real, active venues; one row per (venue, need), +1 each.
  await db.execute(sql`
    INSERT INTO ${schema.venueViews} (venue_id, day, kind, need, count)
    SELECT v.id, (now() at time zone 'Australia/Sydney')::date, ${kind}::text, n.need, 1
    FROM ${schema.venues} v
    CROSS JOIN (VALUES ${sql.join(ns.map(n => sql`(${n}::text)`), sql`, `)}) AS n(need)
    WHERE v.active AND v.id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})
    ON CONFLICT (venue_id, day, kind, need) DO UPDATE SET count = ${schema.venueViews}.count + 1`);
  return ids.length;
}
