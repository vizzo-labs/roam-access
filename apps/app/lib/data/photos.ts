import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import { del, get, put } from '@vercel/blob';
import { getDb, schema } from '../db';
import { RA2_NEEDS } from '../pilot-data';
import { ago } from '../venues';
import { publicNeedsSql } from './public-needs';
import {
  ALT_MAX, ALT_MIN, MAX_PHOTOS_PER_REVIEW, PHOTO_KINDS, PHOTO_KIND_IDS,
  PHOTO_MAX_BYTES, THUMB_MAX_BYTES, type PhotoKind,
} from '../photos/kinds';
import { sanitiseJpeg } from '../photos/jpeg';

// Photos on reviews (#3). Images live in a PRIVATE Vercel Blob store: they are
// never reachable by URL, only through /api/photos/[id] after a sign-in check,
// so hiding a photo (or its review) really hides it. Pathnames are random and
// carry no user id.

const { reviewPhotos, reviews, venues } = schema;

export type CoverPhoto = { url: string; alt: string };

export type PhotoVM = {
  id: string; kind: PhotoKind; kindLabel: string; alt: string;
  src: string; thumb: string; width: number; height: number;
  reviewId: string | null; who: string; when: string; mine: boolean;
  // For translation (#21): the reviewer's first need + how many more, and the
  // date; the app builds "who" and "when" in the reader's language.
  whoNeed: string | null; whoMore: number; at: string;
};

const kindLabel = (k: string) => PHOTO_KINDS.find(x => x.id === k)?.label ?? 'Photo';
const isKind = (k: unknown): k is PhotoKind => typeof k === 'string' && (PHOTO_KIND_IDS as string[]).includes(k);

export function whoFor(needs: string[]) {
  const ns = RA2_NEEDS.filter(x => needs.includes(x.id));
  return ns[0] ? ns[0].who + (ns.length > 1 ? ` (+${ns.length - 1})` : '') : 'Community member';
}

function whoParts(needs: string[]) {
  const ns = RA2_NEEDS.filter(x => needs.includes(x.id));
  return { whoNeed: ns[0]?.id ?? null, whoMore: Math.max(0, ns.length - 1) };
}

function toVM(p: typeof reviewPhotos.$inferSelect, needs: string[], viewerId: string, now = Date.now()): PhotoVM {
  return {
    id: p.id, kind: p.kind as PhotoKind, kindLabel: kindLabel(p.kind), alt: p.alt,
    src: `/api/photos/${p.id}`, thumb: `/api/photos/${p.id}?size=thumb`,
    width: p.width, height: p.height, reviewId: p.reviewId,
    who: whoFor(needs), when: ago(+p.createdAt, now), mine: p.userId === viewerId,
    ...whoParts(needs), at: new Date(p.createdAt).toISOString(),
  };
}

// ── Upload (draft) ─────────────────────────────────────────────────────────
const DRAFT_TTL_MS = 24 * 3600 * 1000;
// A photo can also be attached to arrival steps (I2) instead of a review: it
// is then no longer a draft (kept, and visible while those steps are).
const notArrival = sql`not exists (select 1 from arrival_steps a where a.photo_id = ${reviewPhotos.id})`;
const onVisibleArrival = sql<boolean>`exists (select 1 from arrival_steps a where a.photo_id = ${reviewPhotos.id} and a.hidden = false)`;

export async function createDraftPhoto(userId: string, input: {
  venueId: unknown; kind: unknown; main: Uint8Array; thumb: Uint8Array;
}) {
  const db = getDb();
  if (typeof input.venueId !== 'string') return { error: 'venueId required' } as const;
  const kind: PhotoKind = isKind(input.kind) ? input.kind : 'other';
  if (input.main.length > PHOTO_MAX_BYTES || input.thumb.length > THUMB_MAX_BYTES) return { error: 'Photo is too large' } as const;
  const main = sanitiseJpeg(input.main);
  const thumb = sanitiseJpeg(input.thumb);
  if (!main || !thumb) return { error: 'Photos must be JPEG images' } as const;

  const [v] = await db.select({ id: venues.id }).from(venues).where(and(eq(venues.id, input.venueId), eq(venues.active, true)));
  if (!v) return { error: 'Unknown venue' } as const;

  await removeStaleDrafts(userId);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(reviewPhotos)
    .where(and(eq(reviewPhotos.userId, userId), eq(reviewPhotos.venueId, v.id), isNull(reviewPhotos.reviewId), notArrival));
  if (n >= MAX_PHOTOS_PER_REVIEW) return { error: `Up to ${MAX_PHOTOS_PER_REVIEW} photos per review` } as const;

  const key = randomUUID();
  const pathname = `photos/${v.id}/${key}.jpg`;
  const thumbPathname = `photos/${v.id}/${key}-thumb.jpg`;
  const opts = { access: 'private' as const, contentType: 'image/jpeg', addRandomSuffix: false };
  await Promise.all([
    put(pathname, Buffer.from(main.bytes), opts),
    put(thumbPathname, Buffer.from(thumb.bytes), opts),
  ]);
  const [row] = await db.insert(reviewPhotos).values({
    userId, venueId: v.id, kind, pathname, thumbPathname,
    width: main.info.width, height: main.info.height, bytes: main.bytes.length,
  }).returning();
  return { photo: toVM(row, [], userId) } as const;
}

// Forms abandoned with photos in them: drop the drafts after a day.
async function removeStaleDrafts(userId: string) {
  const db = getDb();
  const stale = await db.delete(reviewPhotos).where(and(
    eq(reviewPhotos.userId, userId), isNull(reviewPhotos.reviewId), notArrival,
    lt(reviewPhotos.createdAt, new Date(Date.now() - DRAFT_TTL_MS)),
  )).returning({ a: reviewPhotos.pathname, b: reviewPhotos.thumbPathname });
  await deleteBlobs(stale.flatMap(s => [s.a, s.b]));
}

async function deleteBlobs(pathnames: string[]) {
  if (!pathnames.length) return;
  try { await del(pathnames); } catch { /* best effort: rows are gone, blobs unreachable */ }
}

export async function deleteDraftPhoto(userId: string, id: string) {
  const db = getDb();
  const gone = await db.delete(reviewPhotos)
    .where(and(eq(reviewPhotos.id, id), eq(reviewPhotos.userId, userId), isNull(reviewPhotos.reviewId)))
    .returning({ a: reviewPhotos.pathname, b: reviewPhotos.thumbPathname });
  await deleteBlobs(gone.flatMap(s => [s.a, s.b]));
  return gone.length > 0;
}

/** A draft owned by this user (for the vision suggestion). */
export async function getOwnDraft(userId: string, id: string) {
  const [p] = await getDb().select().from(reviewPhotos)
    .where(and(eq(reviewPhotos.id, id), eq(reviewPhotos.userId, userId), isNull(reviewPhotos.reviewId)));
  return p ?? null;
}

// ── Attach to a review when it is sent ─────────────────────────────────────
export function validatePhotoInput(input: unknown) {
  if (input == null) return { photos: [] as { id: string; kind: PhotoKind; alt: string }[] } as const;
  if (!Array.isArray(input)) return { error: 'photos must be a list' } as const;
  if (input.length > MAX_PHOTOS_PER_REVIEW) return { error: `Up to ${MAX_PHOTOS_PER_REVIEW} photos per review` } as const;
  const photos: { id: string; kind: PhotoKind; alt: string }[] = [];
  for (const p of input) {
    if (!p || typeof p !== 'object' || typeof p.id !== 'string') return { error: 'photo id required' } as const;
    const alt = typeof p.alt === 'string' ? p.alt.replace(/\s+/g, ' ').trim() : '';
    if (alt.length < ALT_MIN) return { error: 'Every photo needs a description' } as const;
    photos.push({ id: p.id, kind: isKind(p.kind) ? p.kind : 'other', alt: alt.slice(0, ALT_MAX) });
  }
  return { photos } as const;
}

export async function checkDraftsOwned(userId: string, venueId: string, ids: string[]) {
  if (!ids.length) return true;
  const rows = await getDb().select({ id: reviewPhotos.id }).from(reviewPhotos).where(and(
    inArray(reviewPhotos.id, ids), eq(reviewPhotos.userId, userId),
    eq(reviewPhotos.venueId, venueId), isNull(reviewPhotos.reviewId), notArrival,
  ));
  return rows.length === new Set(ids).size;
}

export async function attachPhotos(userId: string, reviewId: string, venueId: string,
  photos: { id: string; kind: PhotoKind; alt: string }[]) {
  const db = getDb();
  for (const p of photos) {
    await db.update(reviewPhotos).set({ reviewId, kind: p.kind, alt: p.alt }).where(and(
      eq(reviewPhotos.id, p.id), eq(reviewPhotos.userId, userId),
      eq(reviewPhotos.venueId, venueId), isNull(reviewPhotos.reviewId),
    ));
  }
}

// ── Reading ────────────────────────────────────────────────────────────────
const visible = and(eq(reviewPhotos.hidden, false), eq(reviews.hidden, false));

export async function getVenuePhotos(venueId: string, viewerId: string): Promise<PhotoVM[]> {
  const rows = await getDb().select({ p: reviewPhotos, needs: publicNeedsSql('"reviews"."needs"', '"reviews"."user_id"') })
    .from(reviewPhotos).innerJoin(reviews, eq(reviews.id, reviewPhotos.reviewId))
    .where(and(eq(reviewPhotos.venueId, venueId), visible))
    .orderBy(desc(reviewPhotos.createdAt)).limit(60);
  const now = Date.now();
  return rows.map(r => toVM(r.p, r.needs, viewerId, now));
}

export async function getPhotosByReview(reviewIds: string[], viewerId: string) {
  const out = new Map<string, PhotoVM[]>();
  if (!reviewIds.length) return out;
  const rows = await getDb().select({ p: reviewPhotos, needs: publicNeedsSql('"reviews"."needs"', '"reviews"."user_id"') })
    .from(reviewPhotos).innerJoin(reviews, eq(reviews.id, reviewPhotos.reviewId))
    .where(and(inArray(reviewPhotos.reviewId, reviewIds), visible))
    .orderBy(reviewPhotos.createdAt);
  const now = Date.now();
  for (const r of rows) {
    const id = r.p.reviewId!;
    out.set(id, [...(out.get(id) || []), toVM(r.p, r.needs, viewerId, now)]);
  }
  return out;
}

/** One cover photo per venue for the map preview card: the newest visible
 *  entrance photo, else the newest visible photo. Id + alt text only (the
 *  image itself is served by /api/photos/[id] after the sign-in check). */
export async function getCoverPhotos(venueId?: string): Promise<Map<string, CoverPhoto>> {
  const where = venueId ? and(visible, eq(reviewPhotos.venueId, venueId)) : visible;
  const rows = await getDb().selectDistinctOn([reviewPhotos.venueId], {
    venueId: reviewPhotos.venueId, id: reviewPhotos.id, alt: reviewPhotos.alt,
  })
    .from(reviewPhotos).innerJoin(reviews, eq(reviews.id, reviewPhotos.reviewId))
    .where(where)
    .orderBy(reviewPhotos.venueId, sql`(${reviewPhotos.kind} = 'entrance') desc`, desc(reviewPhotos.createdAt));
  return new Map(rows.map(r => [r.venueId, { url: `/api/photos/${r.id}?size=thumb`, alt: r.alt }]));
}

/** Who may see this photo: everyone signed in if it and its review are visible;
 *  the uploader always; admins always (to moderate). */
export async function getPhotoAccess(id: string) {
  const [row] = await getDb().select({ p: reviewPhotos, reviewHidden: reviews.hidden, arrival: onVisibleArrival })
    .from(reviewPhotos).leftJoin(reviews, eq(reviews.id, reviewPhotos.reviewId))
    .where(eq(reviewPhotos.id, id));
  if (!row) return null;
  const publicOk = !row.p.hidden && ((!!row.p.reviewId && row.reviewHidden === false) || (!row.p.reviewId && !!row.arrival));
  return { photo: row.p, publicOk };
}

export async function readPhoto(pathname: string) {
  const r = await get(pathname, { access: 'private' });
  if (!r || r.statusCode !== 200) return null;
  return r;
}

export async function readPhotoBytes(pathname: string) {
  const r = await readPhoto(pathname);
  if (!r) return null;
  return new Uint8Array(await new Response(r.stream).arrayBuffer());
}

// ── Account deletion ───────────────────────────────────────────────────────
// Rows cascade from the profile; the images must be deleted explicitly.
export async function deleteUserPhotoBlobs(userId: string) {
  const rows = await getDb().select({ a: reviewPhotos.pathname, b: reviewPhotos.thumbPathname })
    .from(reviewPhotos).where(eq(reviewPhotos.userId, userId));
  await deleteBlobs(rows.flatMap(r => [r.a, r.b]));
}

// ── Admin ──────────────────────────────────────────────────────────────────
export async function getAdminPhotos() {
  return getDb().select({
    id: reviewPhotos.id, kind: reviewPhotos.kind, alt: reviewPhotos.alt, hidden: reviewPhotos.hidden,
    createdAt: reviewPhotos.createdAt, reviewId: reviewPhotos.reviewId, reviewHidden: reviews.hidden,
    venueName: venues.name,
  }).from(reviewPhotos)
    .innerJoin(reviews, eq(reviews.id, reviewPhotos.reviewId))
    .innerJoin(venues, eq(venues.id, reviewPhotos.venueId))
    .orderBy(desc(reviewPhotos.createdAt)).limit(200);
}

export async function setPhotoHidden(id: string, hidden: boolean) {
  await getDb().update(reviewPhotos).set({ hidden }).where(eq(reviewPhotos.id, id));
}

export { kindLabel };
