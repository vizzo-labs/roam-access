import 'server-only';
import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import {
  CHECKIN_REPLACE_MS, CROWD_IDS, DAY_KIND_IDS, LIGHT_IDS, NOISE_IDS, SLOT_IDS, dayKindOf, slotOf,
  type SensoryCrowd, type SensoryDayKind, type SensoryLight, type SensoryNoise, type SensorySlot,
} from '../sensory/defs';
import type { SensoryReport } from '../db/schema';

// Sensory content (#17): noise, light and crowds from reviews and "How is it
// right now?" check-ins. Describes the place; never changes a verdict.

const { sensoryReports, reviews, venues } = schema;

const pick = <T extends string>(ids: readonly T[], v: unknown): T | null =>
  typeof v === 'string' && (ids as readonly string[]).includes(v) ? v as T : null;

export type SensoryInput = {
  noise: SensoryNoise | null; light: SensoryLight | null; crowd: SensoryCrowd | null;
  quietTimes: SensorySlot[];
  slot: SensorySlot | null; dayKind: SensoryDayKind | null; // when the reviewer was there
};

/** The optional sensory part of a review form. Anything unknown is dropped. */
export function parseSensoryInput(input: unknown): SensoryInput {
  const o = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return {
    noise: pick(NOISE_IDS, o.noise),
    light: pick(LIGHT_IDS, o.light),
    crowd: pick(CROWD_IDS, o.crowd),
    quietTimes: Array.isArray(o.quietTimes) ? [...new Set(o.quietTimes.map(x => pick(SLOT_IDS, x)).filter((x): x is SensorySlot => !!x))] : [],
    slot: pick(SLOT_IDS, o.slot),
    dayKind: pick(DAY_KIND_IDS, o.dayKind),
  };
}

/** Columns for the reviews row. */
export const sensoryColumns = (s: SensoryInput) => ({
  sensoryNoise: s.noise, sensoryLight: s.light, sensoryCrowd: s.crowd, quietTimes: s.quietTimes,
});

/** A review that says when the visit was becomes a time-of-day observation. */
export async function saveReviewSensory(userId: string, venueId: string, reviewId: string, s: SensoryInput, at = new Date()) {
  if (!s.slot || (!s.noise && !s.light && !s.crowd)) return;
  await getDb().insert(sensoryReports).values({
    venueId, userId, reviewId, noise: s.noise, light: s.light, crowd: s.crowd,
    slot: s.slot, dayKind: s.dayKind, observedAt: at,
  });
}

/** "How is it right now?" — one per person per place every 2 hours: a new
 *  check-in inside that window replaces the previous one. */
export async function checkIn(userId: string, venueId: string, input: unknown) {
  const s = parseSensoryInput(input);
  if (!s.noise && !s.crowd && !s.light) return { error: 'Choose at least one answer' } as const;
  const db = getDb();
  const [v] = await db.select({ id: venues.id }).from(venues).where(and(eq(venues.id, venueId), eq(venues.active, true)));
  if (!v) return { error: 'Unknown venue' } as const;
  const now = new Date();
  const values = {
    noise: s.noise, light: s.light, crowd: s.crowd,
    slot: slotOf(now), dayKind: dayKindOf(now), observedAt: now,
  };
  const [prev] = await db.select({ id: sensoryReports.id }).from(sensoryReports).where(and(
    eq(sensoryReports.userId, userId), eq(sensoryReports.venueId, venueId), isNull(sensoryReports.reviewId),
    gt(sensoryReports.observedAt, new Date(+now - CHECKIN_REPLACE_MS)),
  )).orderBy(desc(sensoryReports.observedAt)).limit(1);
  if (prev) await db.update(sensoryReports).set(values).where(eq(sensoryReports.id, prev.id));
  else await db.insert(sensoryReports).values({ venueId, userId, ...values });
  return { ok: true } as const;
}

/** Visible observations: not hidden, and not from a hidden review. */
export async function getSensoryReports(venueId?: string): Promise<SensoryReport[]> {
  const rows = await getDb().select({ r: sensoryReports }).from(sensoryReports)
    .leftJoin(reviews, eq(reviews.id, sensoryReports.reviewId))
    .where(and(
      eq(sensoryReports.hidden, false),
      or(isNull(sensoryReports.reviewId), eq(reviews.hidden, false)),
      venueId ? eq(sensoryReports.venueId, venueId) : sql`true`,
    ));
  return rows.map(x => x.r);
}
