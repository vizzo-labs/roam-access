import 'server-only';
// Getting there (I1): step-free entrances marked in reviews, and "Still the
// way in? Yes / Changed". Entrances never change a verdict. Only user ids are
// stored; "who" comes from the linked review's needs (lived experience, never
// a name). Rows cascade from the profile and the review.

import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { RA2_NEEDS } from '../pilot-data';
import {
  ENTRANCE_KINDS, ENTRANCE_NOTE_MAX, MAX_ENTRANCE_DISTANCE_M, distanceM, entranceStatus, rankEntrances,
  type EntranceVM,
} from '../arrival/entrances';
import type { EntranceKind, EntranceLocatedBy } from '../db/schema-arrival';

const { venues, reviews, reviewPhotos, profiles, venueEntrances, entranceConfirmations } = schema;

export type EntranceInput = {
  kind: EntranceKind; lat: number | null; lng: number | null;
  locatedBy: EntranceLocatedBy | null; note: string | null; photoId: string | null;
};

const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

/** Checks the review form's entrance before anything is written. `null` = no
 *  entrance to save (nothing beyond the door's kind was given). */
export async function parseEntranceInput(input: unknown, venueId: unknown, photoIds: string[]):
  Promise<{ entrance: EntranceInput | null } | { error: string }> {
  if (input == null) return { entrance: null };
  if (typeof input !== 'object' || typeof venueId !== 'string') return { error: 'entrance must be an object' };
  const e = input as Record<string, unknown>;
  if (!ENTRANCE_KINDS.includes(e.kind as EntranceKind)) return { error: 'Unknown entrance kind' };
  let lat = num(e.lat), lng = num(e.lng);
  if ((lat == null) !== (lng == null)) return { error: 'An entrance needs both lat and lng' };
  if (lat != null && lng != null) {
    const [v] = await getDb().select({ lat: venues.lat, lng: venues.lng }).from(venues).where(eq(venues.id, venueId));
    if (!v) return { error: 'Unknown venue' };
    if (distanceM(v, { lat, lng }) > MAX_ENTRANCE_DISTANCE_M) return { error: `The entrance pin must be within ${MAX_ENTRANCE_DISTANCE_M} m of the place` };
    lat = Math.round(lat * 1e6) / 1e6; lng = Math.round(lng * 1e6) / 1e6;
  }
  const locatedBy = lat != null ? (e.locatedBy === 'gps' ? 'gps' : 'pin') : null;
  const note = typeof e.note === 'string' ? e.note.replace(/\s+/g, ' ').trim().slice(0, ENTRANCE_NOTE_MAX) || null : null;
  const photoId = typeof e.photoId === 'string' && photoIds.includes(e.photoId) ? e.photoId : null;
  if (typeof e.photoId === 'string' && !photoId) return { error: 'The entrance photo must be one of the review’s photos' };
  if (lat == null && !note && !photoId) return { entrance: null };
  return { entrance: { kind: e.kind as EntranceKind, lat, lng, locatedBy, note, photoId } };
}

/** Saved after the review (and its photos) are written. */
export async function createEntranceForReview(userId: string, venueId: string, reviewId: string, e: EntranceInput) {
  const db = getDb();
  if (e.photoId) {
    await db.update(reviewPhotos).set({ kind: 'entrance' })
      .where(and(eq(reviewPhotos.id, e.photoId), eq(reviewPhotos.reviewId, reviewId), eq(reviewPhotos.userId, userId)));
  }
  await db.insert(venueEntrances).values({
    venueId, userId, reviewId, source: 'community', kind: e.kind,
    lat: e.lat, lng: e.lng, locatedBy: e.locatedBy, note: e.note, photoId: e.photoId,
  }).onConflictDoNothing();
}

// ── Reading ────────────────────────────────────────────────────────────────
const toIso = (x: Date | string | number | null) => (x == null ? null : new Date(x).toISOString());

async function loadEntrances(venueId?: string) {
  const db = getDb();
  const where = and(
    eq(venueEntrances.hidden, false),
    // A hidden review hides the entrance it marked.
    or(isNull(venueEntrances.reviewId), eq(reviews.hidden, false)),
    venueId ? eq(venueEntrances.venueId, venueId) : undefined,
  );
  const rows = await db.select({ e: venueEntrances, needs: reviews.needs })
    .from(venueEntrances).leftJoin(reviews, eq(reviews.id, venueEntrances.reviewId))
    .where(where);
  if (!rows.length) return { rows, stats: new Map<string, Stat>() };
  const ids = rows.map(r => r.e.id);
  const agg = await db.select({
    id: entranceConfirmations.entranceId,
    yes: sql<number>`count(*) filter (where ${entranceConfirmations.answer} = 'yes')::int`,
    lastYes: sql<string | null>`max(${entranceConfirmations.createdAt}) filter (where ${entranceConfirmations.answer} = 'yes')`,
    changed: sql<number>`count(*) filter (where ${entranceConfirmations.answer} = 'changed')::int`,
    lastChanged: sql<string | null>`max(${entranceConfirmations.createdAt}) filter (where ${entranceConfirmations.answer} = 'changed')`,
  }).from(entranceConfirmations).where(inArray(entranceConfirmations.entranceId, ids))
    .groupBy(entranceConfirmations.entranceId);
  return { rows, stats: new Map(agg.map(a => [a.id, a])) };
}
type Stat = { yes: number; lastYes: string | null; changed: number; lastChanged: string | null };

function toVM(e: typeof venueEntrances.$inferSelect, s: Stat | undefined): EntranceVM {
  const at = new Date(e.createdAt).toISOString();
  const lastYes = toIso(s?.lastYes ?? null), lastChanged = toIso(s?.lastChanged ?? null);
  return {
    id: e.id, source: e.source, kind: e.kind, lat: e.lat, lng: e.lng, locatedBy: e.locatedBy,
    note: e.note, at, yes: s?.yes ?? 0, lastYes, changed: s?.changed ?? 0, lastChanged,
    status: entranceStatus(at, lastYes, lastChanged),
  };
}

/** The best entrance per place, for /api/bootstrap (small: no photo, no who). */
export async function getBestEntrances(venueId?: string): Promise<Map<string, EntranceVM>> {
  const { rows, stats } = await loadEntrances(venueId);
  const byVenue = new Map<string, EntranceVM[]>();
  for (const r of rows) byVenue.set(r.e.venueId, [...(byVenue.get(r.e.venueId) || []), toVM(r.e, stats.get(r.e.id))]);
  return new Map([...byVenue].map(([id, list]) => [id, rankEntrances(list)[0]]));
}

/** Every entrance of one place, best first, with who marked it, its photo and
 *  this viewer's own answer (venue page). */
export async function getVenueEntrances(venueId: string, viewerId: string | null): Promise<EntranceVM[]> {
  const db = getDb();
  const { rows, stats } = await loadEntrances(venueId);
  if (!rows.length) return [];
  const photoIds = rows.map(r => r.e.photoId).filter((x): x is string => !!x);
  const [photos, mine] = await Promise.all([
    photoIds.length
      ? db.select().from(reviewPhotos).where(and(inArray(reviewPhotos.id, photoIds), eq(reviewPhotos.hidden, false)))
      : Promise.resolve([]),
    viewerId
      ? db.select({ id: entranceConfirmations.entranceId, answer: entranceConfirmations.answer }).from(entranceConfirmations)
        .where(and(eq(entranceConfirmations.userId, viewerId), inArray(entranceConfirmations.entranceId, rows.map(r => r.e.id))))
      : Promise.resolve([]),
  ]);
  const photoById = new Map(photos.map(p => [p.id, p]));
  const myAnswers = new Map(mine.map(m => [m.id, m.answer]));
  return rankEntrances(rows.map(r => {
    const ns = RA2_NEEDS.filter(n => (r.needs || []).includes(n.id));
    const p = r.e.photoId ? photoById.get(r.e.photoId) : undefined;
    return {
      ...toVM(r.e, stats.get(r.e.id)),
      whoNeed: ns[0]?.id ?? null, whoMore: Math.max(0, ns.length - 1),
      mine: !!viewerId && r.e.userId === viewerId,
      myAnswer: myAnswers.get(r.e.id) ?? null,
      photo: p ? {
        id: p.id, kind: 'entrance' as const, alt: p.alt, src: `/api/photos/${p.id}`, thumb: `/api/photos/${p.id}?size=thumb`,
        width: p.width, height: p.height, whoNeed: ns[0]?.id ?? null, whoMore: Math.max(0, ns.length - 1),
        at: new Date(p.createdAt).toISOString(),
      } : null,
    };
  }));
}

/** "Still the way in?" — one answer per person (latest wins). Not for the
 *  person who marked it, and not for OpenStreetMap entrances. */
export async function answerEntrance(userId: string, entranceId: string, answer: unknown) {
  if (answer !== 'yes' && answer !== 'changed') return { error: 'answer must be yes or changed' } as const;
  const db = getDb();
  const [e] = await db.select({ id: venueEntrances.id, venueId: venueEntrances.venueId, userId: venueEntrances.userId, source: venueEntrances.source })
    .from(venueEntrances).where(and(eq(venueEntrances.id, entranceId), eq(venueEntrances.hidden, false)));
  if (!e) return { error: 'Unknown entrance' } as const;
  if (e.source !== 'community') return { error: 'Only community-marked entrances can be confirmed' } as const;
  if (e.userId === userId) return { error: 'You marked this entrance' } as const;
  await db.insert(profiles).values({ userId }).onConflictDoNothing();
  await db.insert(entranceConfirmations).values({ entranceId, userId, answer })
    .onConflictDoUpdate({ target: [entranceConfirmations.entranceId, entranceConfirmations.userId], set: { answer, createdAt: new Date() } });
  return { venueId: e.venueId } as const;
}
