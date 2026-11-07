import 'server-only';
import { sql, type SQL } from 'drizzle-orm';

// The needs a reader may see next to anything a person contributed (review
// photos, the entrance they marked, arrival steps): the stored snapshot,
// unless the person has chosen how they appear (relationship set) and NOT
// opted in to showing their needs. See lib/contributors/author.ts.

/**
 * SQL: the needs a reader may see — `needs` unless the author (`userId`) has
 * chosen how they appear and not opted in to showing them. Pass fully
 * qualified column names, e.g. publicNeedsSql('"reviews"."needs"', '"reviews"."user_id"').
 */
export function publicNeedsSql(needs: string, userId: string): SQL<string[]> {
  return sql<string[]>`(case when exists (
    select 1 from profiles ap where ap.user_id = ${sql.raw(userId)} and ap.relationship is not null and not ap.show_needs
  ) then '{}'::text[] else ${sql.raw(needs)} end)`;
}

