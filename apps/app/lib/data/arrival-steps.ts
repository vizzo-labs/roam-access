import 'server-only';
// Getting there 2 (I2): step-by-step arrival from the community.
// "From The Corso turn into the laneway; ramp on the left."
//
// One set per person per venue (adding again replaces yours). Others say
// "This worked for me" (one per person); the venue shows the most-confirmed
// set first. Describes how to get there — never changes a verdict. Never shown
// with a name; shown with the needs snapshot only if the person allows it
// (publicNeedsSql, Brief L); the user id is only kept for deletion and "one
// confirmation per person", and never sent.

import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { RA2_NEEDS } from '../pilot-data';
import { publicNeedsSql } from './public-needs';
import {
  ARRIVAL_FROM_MAX, ARRIVAL_STEP_MAX, ARRIVAL_STEP_MIN, ARRIVAL_STEPS_MAX,
} from '../arrival/places';
import { ALT_MAX, ALT_MIN } from '../photos/kinds';

const { arrivalSteps, reviewPhotos, venues, profiles } = schema;

export type ArrivalStepsVM = {
  id: string; fromPlace: string | null; steps: string[];
  photo: { id: string; src: string; thumb: string; alt: string; width: number; height: number } | null;
  confirmations: number; createdAt: string; lastConfirmedAt: string;
  whoNeed: string | null; whoMore: number;
  mine: boolean; confirmedByMe: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '');

function whoParts(needs: string[]) {
  const ns = RA2_NEEDS.filter(x => needs.includes(x.id));
  return { whoNeed: ns[0]?.id ?? null, whoMore: Math.max(0, ns.length - 1) };
}

export async function getArrivalSteps(venueId: string, viewerId: string): Promise<ArrivalStepsVM[]> {
  const rows = await getDb().select({ a: arrivalSteps, p: reviewPhotos, needs: publicNeedsSql('"arrival_steps"."needs"', '"arrival_steps"."user_id"') })
    .from(arrivalSteps)
    .leftJoin(reviewPhotos, and(eq(reviewPhotos.id, arrivalSteps.photoId), eq(reviewPhotos.hidden, false)))
    .where(and(eq(arrivalSteps.venueId, venueId), eq(arrivalSteps.hidden, false)))
    // Most-confirmed first; ties go to the most recently confirmed.
    .orderBy(desc(arrivalSteps.confirmations), desc(arrivalSteps.lastConfirmedAt))
    .limit(20);
  return rows.map(({ a, p, needs }) => ({
    id: a.id, fromPlace: a.fromPlace, steps: a.steps,
    photo: p ? {
      id: p.id, src: `/api/photos/${p.id}`, thumb: `/api/photos/${p.id}?size=thumb`,
      alt: p.alt, width: p.width, height: p.height,
    } : null,
    confirmations: a.confirmations,
    createdAt: a.createdAt.toISOString(), lastConfirmedAt: a.lastConfirmedAt.toISOString(),
    ...whoParts(needs ?? []),
    mine: a.userId === viewerId, confirmedByMe: a.confirmedBy.includes(viewerId),
  }));
}

export async function saveArrivalSteps(userId: string, input: {
  venueId?: unknown; fromPlace?: unknown; steps?: unknown; photo?: unknown;
}) {
  const db = getDb();
  if (typeof input.venueId !== 'string') return { error: 'venueId required' } as const;
  if (!Array.isArray(input.steps)) return { error: 'steps must be a list' } as const;
  const steps = input.steps.map(s => clean(s, ARRIVAL_STEP_MAX)).filter(s => s.length >= ARRIVAL_STEP_MIN);
  if (!steps.length) return { error: 'Add at least one step' } as const;
  if (steps.length > ARRIVAL_STEPS_MAX) return { error: `Up to ${ARRIVAL_STEPS_MAX} steps` } as const;
  const fromPlace = clean(input.fromPlace, ARRIVAL_FROM_MAX) || null;

  const [v] = await db.select({ id: venues.id }).from(venues).where(and(eq(venues.id, input.venueId), eq(venues.active, true)));
  if (!v) return { error: 'Unknown venue' } as const;

  // Optional photo: one of this person's draft uploads for this venue.
  let photoId: string | null = null;
  const ph = input.photo as { id?: unknown; alt?: unknown } | null | undefined;
  if (ph && typeof ph === 'object' && ph.id != null) {
    if (typeof ph.id !== 'string' || !UUID.test(ph.id)) return { error: 'Unknown photo' } as const;
    const alt = clean(ph.alt, ALT_MAX);
    if (alt.length < ALT_MIN) return { error: 'The photo needs a description' } as const;
    const [own] = await db.update(reviewPhotos).set({ alt, kind: 'entrance' }).where(and(
      eq(reviewPhotos.id, ph.id), eq(reviewPhotos.userId, userId),
      eq(reviewPhotos.venueId, v.id), isNull(reviewPhotos.reviewId),
    )).returning({ id: reviewPhotos.id });
    if (!own) return { error: 'Unknown photo' } as const;
    photoId = own.id;
  }

  const [profile] = await db.select({ needs: profiles.needs }).from(profiles).where(eq(profiles.userId, userId));
  const needs = profile?.needs ?? [];

  // One set per person per venue: adding again replaces yours (and its
  // confirmations, since the steps changed).
  const [existing] = await db.select({ id: arrivalSteps.id, photoId: arrivalSteps.photoId }).from(arrivalSteps)
    .where(and(eq(arrivalSteps.venueId, v.id), eq(arrivalSteps.userId, userId))).limit(1);
  if (existing) {
    await db.update(arrivalSteps).set({
      fromPlace, steps, needs, photoId: photoId ?? existing.photoId,
      confirmations: 0, confirmedBy: [], lastConfirmedAt: new Date(), updatedAt: new Date(),
    }).where(eq(arrivalSteps.id, existing.id));
    return { ok: true, replaced: true } as const;
  }
  await db.insert(arrivalSteps).values({ venueId: v.id, userId, needs, fromPlace, steps, photoId });
  return { ok: true, replaced: false } as const;
}

// "This worked for me": one per person, not on your own steps.
export async function confirmArrivalSteps(userId: string, id: string) {
  if (!UUID.test(id)) return { error: 'Unknown steps' } as const;
  const db = getDb();
  const [a] = await db.select().from(arrivalSteps).where(and(eq(arrivalSteps.id, id), eq(arrivalSteps.hidden, false)));
  if (!a) return { error: 'Unknown steps' } as const;
  if (a.userId === userId) return { error: 'You can’t confirm your own steps' } as const;
  if (!a.confirmedBy.includes(userId)) {
    await db.update(arrivalSteps).set({
      confirmations: sql`${arrivalSteps.confirmations} + 1` as unknown as number,
      confirmedBy: sql`array_append(${arrivalSteps.confirmedBy}, ${userId})` as unknown as string[],
      lastConfirmedAt: new Date(),
    }).where(eq(arrivalSteps.id, id));
  }
  return { ok: true, venueId: a.venueId } as const;
}

// Account deletion: own sets cascade with the profile; also drop the user's
// id (and their count) from sets they confirmed.
export async function forgetUserInArrivalSteps(userId: string) {
  await getDb().update(arrivalSteps).set({
    confirmedBy: sql`array_remove(${arrivalSteps.confirmedBy}, ${userId})` as unknown as string[],
    confirmations: sql`greatest(${arrivalSteps.confirmations} - 1, 0)` as unknown as number,
  }).where(sql`${userId} = any(${arrivalSteps.confirmedBy})`);
}


// ── Admin ────────────────────────────────────────────────────────────────
// Recent sets for moderation. Who wrote them is never shown, here or anywhere.
export async function getArrivalStepsAdmin() {
  return getDb().select({
    id: arrivalSteps.id, venueName: venues.name, fromPlace: arrivalSteps.fromPlace, steps: arrivalSteps.steps,
    photoId: arrivalSteps.photoId, photoAlt: reviewPhotos.alt, confirmations: arrivalSteps.confirmations,
    hidden: arrivalSteps.hidden, createdAt: arrivalSteps.createdAt,
  }).from(arrivalSteps)
    .innerJoin(venues, eq(venues.id, arrivalSteps.venueId))
    .leftJoin(reviewPhotos, eq(reviewPhotos.id, arrivalSteps.photoId))
    .orderBy(desc(arrivalSteps.createdAt)).limit(200);
}

/** Hiding a set also hides its photo (photo access needs visible steps). */
export async function setArrivalStepsHidden(id: string, hidden: boolean) {
  if (!UUID.test(id)) return;
  await getDb().update(arrivalSteps).set({ hidden, updatedAt: new Date() }).where(eq(arrivalSteps.id, id));
}
