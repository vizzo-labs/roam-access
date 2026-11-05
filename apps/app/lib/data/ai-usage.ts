import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { AI_LIMITS } from '../photos/kinds';

// Per-user daily limits for the AI features, counted per Sydney calendar day.
// Only a number is stored — never the question, photo or answer.
type Kind = keyof typeof AI_LIMITS;
const { aiUsage } = schema;
const today = sql`(now() at time zone 'Australia/Sydney')::date`;

/** Takes one unit of today's quota. Returns remaining, or null when used up. */
export async function takeAiQuota(userId: string, kind: Kind): Promise<number | null> {
  const limit = AI_LIMITS[kind];
  const res = await getDb().execute(sql`
    INSERT INTO ai_usage (user_id, day, kind, count) VALUES (${userId}, ${today}, ${kind}, 1)
    ON CONFLICT (user_id, day, kind) DO UPDATE SET count = ai_usage.count + 1
    WHERE ai_usage.count < ${limit}
    RETURNING count`);
  const row = res.rows[0] as { count: number } | undefined;
  return row ? limit - Number(row.count) : null;
}

/** Gives the unit back when the AI call failed (not the user's fault). */
export async function refundAiQuota(userId: string, kind: Kind) {
  await getDb().update(aiUsage).set({ count: sql`greatest(${aiUsage.count} - 1, 0)` })
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.kind, kind), sql`${aiUsage.day} = ${today}`));
}

export async function getAiRemaining(userId: string, kind: Kind) {
  const [row] = await getDb().select({ count: aiUsage.count }).from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.kind, kind), sql`${aiUsage.day} = ${today}`));
  return Math.max(0, AI_LIMITS[kind] - (row?.count ?? 0));
}
