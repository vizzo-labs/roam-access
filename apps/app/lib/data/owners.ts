import 'server-only';
// Business portal v2: what a verified venue manages about its place —
// updates (notices), photos from the venue, corrections to its contact
// details, reports about reviews — plus the in-app "Updates from your saved
// places" for the people who saved it.
//
// Honesty rule: nothing in this module is read by the verdict engine
// (lib/venues.ts, lib/pilot/match.js). Everything here is shown as
// "Venue says" / "From the venue", apart from community facts, and never
// changes a verdict, the ranking or which reviews are shown. Venues can only
// REPORT a review; only the pilot team can hide one.

import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, gte, inArray, isNull, or, sql } from 'drizzle-orm';
import { del, put } from '@vercel/blob';
import { getDb, schema } from '../db';
import { managesVenue } from '../roles';
import { sanitiseJpeg } from '../photos/jpeg';
import { ALT_MAX, ALT_MIN, PHOTO_MAX_BYTES, THUMB_MAX_BYTES } from '../photos/kinds';
import type { ReportReason, VenuePhotoKind } from '../db/schema-owners';
import { setReviewHidden } from '../data';
import { notifyNoticePosted } from '../notify';

const { venues, reviews, saved, profiles, venueClaims, venueNotices, noticeSeen, venuePhotos, reviewReports, venueCorrections } = schema;

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/[ \t]+\n/g, '\n').slice(0, max) : '');
const oneLine = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const notYours = { error: 'not-yours' } as const;

// "Today" is the Sydney date: an update ending Friday shows all of Friday.
const today = sql`(now() at time zone 'Australia/Sydney')::date`;

/** YYYY-MM-DD in Sydney, `days` from now. */
export function sydneyDate(days = 0) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(Date.now() + days * 86_400_000));
}

// ── Updates (notices) ────────────────────────────────────────────────────
export const NOTICE_MAX = 280;
export const MAX_LIVE_NOTICES = 5;
const NOTICE_MAX_DAYS = 365;

/** Visible to the public: not hidden by the pilot team, and not past its last day. */
const live = and(eq(venueNotices.hidden, false), or(isNull(venueNotices.endsOn), gte(venueNotices.endsOn, today)));

export type NoticeVM = { id: string; body: string; at: string; endsOn: string | null };
const toNoticeVM = (n: { id: string; body: string; createdAt: Date; endsOn: string | null }): NoticeVM =>
  ({ id: n.id, body: n.body, at: new Date(n.createdAt).toISOString(), endsOn: n.endsOn });

export async function postNotice(userId: string, venueId: string, bodyIn: unknown, endsOnIn: unknown) {
  if (!(await managesVenue(userId, venueId))) return notYours;
  const body = clean(bodyIn, NOTICE_MAX);
  if (body.length < 3) return { error: 'notice-empty' } as const;
  let endsOn: string | null = null;
  if (typeof endsOnIn === 'string' && endsOnIn) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endsOnIn) || Number.isNaN(Date.parse(endsOnIn))) return { error: 'notice-date' } as const;
    const first = sydneyDate(), last = sydneyDate(NOTICE_MAX_DAYS);
    if (endsOnIn < first || endsOnIn > last) return { error: 'notice-date' } as const;
    endsOn = endsOnIn;
  }
  const db = getDb();
  const [{ n }] = await db.select({ n: count() }).from(venueNotices).where(and(eq(venueNotices.venueId, venueId), live));
  if (n >= MAX_LIVE_NOTICES) return { error: 'notice-limit' } as const;
  const [row] = await db.insert(venueNotices).values({ venueId, userId, body, endsOn }).returning();
  await notifyNoticePosted({ id: row.id, venueId, body: row.body, endsOn: row.endsOn, createdAt: row.createdAt });
  return { ok: true, id: row.id } as const;
}

/** The venue takes an update down (or ends it early). */
export async function removeNotice(userId: string, venueId: string, id: string) {
  if (!(await managesVenue(userId, venueId))) return notYours;
  await getDb().delete(venueNotices).where(and(eq(venueNotices.id, id), eq(venueNotices.venueId, venueId)));
  return { ok: true } as const;
}

export type OwnNotice = {
  id: string; body: string; createdAt: Date; endsOn: string | null;
  status: 'live' | 'expired' | 'hidden'; hiddenAt: Date | null; hiddenNote: string | null;
};

/** The venue's own updates for its dashboard, including expired and hidden ones. */
export async function listOwnNotices(venueId: string): Promise<OwnNotice[]> {
  const rows = await getDb().select({
    n: venueNotices,
    expired: sql<boolean>`(${venueNotices.endsOn} is not null and ${venueNotices.endsOn} < ${today})`,
  }).from(venueNotices).where(eq(venueNotices.venueId, venueId)).orderBy(desc(venueNotices.createdAt)).limit(40);
  return rows.map(({ n, expired }) => ({
    id: n.id, body: n.body, createdAt: n.createdAt, endsOn: n.endsOn,
    status: n.hidden ? 'hidden' : expired ? 'expired' : 'live', hiddenAt: n.hiddenAt, hiddenNote: n.hiddenNote,
  }));
}

/** Live updates per venue (newest first) for the app, the preview card and /v/[id]. */
export async function getLiveNotices(venueId?: string): Promise<Map<string, NoticeVM[]>> {
  const rows = await getDb().select({ id: venueNotices.id, venueId: venueNotices.venueId, body: venueNotices.body, createdAt: venueNotices.createdAt, endsOn: venueNotices.endsOn })
    .from(venueNotices).where(venueId ? and(live, eq(venueNotices.venueId, venueId)) : live)
    .orderBy(desc(venueNotices.createdAt));
  const out = new Map<string, NoticeVM[]>();
  for (const r of rows) out.set(r.venueId, [...(out.get(r.venueId) || []), toNoticeVM(r)]);
  return out;
}

/** Which updates this person has marked as seen. The app builds "Updates
 *  from your saved places" from its saved places' live notices (on each
 *  place in /api/bootstrap) and this list. */
export async function getSeenNoticeIds(userId: string) {
  const rows = await getDb().select({ id: noticeSeen.noticeId }).from(noticeSeen)
    .innerJoin(venueNotices, eq(venueNotices.id, noticeSeen.noticeId))
    .where(and(eq(noticeSeen.userId, userId), live));
  return rows.map(r => r.id);
}

export async function markNoticesSeen(userId: string, ids: unknown) {
  if (!Array.isArray(ids)) return { error: 'ids must be a list' } as const;
  const uuids = [...new Set(ids.filter((x): x is string => typeof x === 'string' && /^[0-9a-f-]{36}$/i.test(x)))].slice(0, 100);
  if (!uuids.length) return { ok: true, marked: 0 } as const;
  const db = getDb();
  const exists = await db.select({ id: venueNotices.id }).from(venueNotices).where(inArray(venueNotices.id, uuids));
  if (!exists.length) return { ok: true, marked: 0 } as const;
  await db.insert(noticeSeen).values(exists.map(e => ({ userId, noticeId: e.id }))).onConflictDoNothing();
  return { ok: true, marked: exists.length } as const;
}

// ── Photos from the venue ────────────────────────────────────────────────
export const VENUE_PHOTO_KINDS: VenuePhotoKind[] = ['entrance', 'inside', 'toilet', 'parking', 'other'];
export const MAX_VENUE_PHOTOS = 10;
const isVenueKind = (k: unknown): k is VenuePhotoKind => typeof k === 'string' && (VENUE_PHOTO_KINDS as string[]).includes(k);

export type VenuePhotoVM = {
  id: string; kind: VenuePhotoKind; alt: string; src: string; thumb: string;
  width: number; height: number; at: string; fromVenue: true;
};
const toPhotoVM = (p: typeof venuePhotos.$inferSelect): VenuePhotoVM => ({
  id: p.id, kind: p.kind, alt: p.alt, src: `/api/venue-photos/${p.id}`, thumb: `/api/venue-photos/${p.id}?size=thumb`,
  width: p.width, height: p.height, at: new Date(p.createdAt).toISOString(), fromVenue: true,
});

async function deleteBlobs(pathnames: string[]) {
  if (!pathnames.length) return;
  try { await del(pathnames); } catch { /* best effort: the row is gone, the file is unreachable */ }
}

/** Upload one photo. Same checks as review photos: the browser re-encodes it
 *  (dropping EXIF/GPS) and the server checks it's a JPEG and strips any
 *  metadata again. A description (the alt text) is required. */
export async function uploadVenuePhoto(userId: string, venueId: string, input: { kind: unknown; alt: unknown; main: Uint8Array; thumb: Uint8Array }) {
  if (!(await managesVenue(userId, venueId))) return notYours;
  const alt = oneLine(input.alt, ALT_MAX);
  if (alt.length < ALT_MIN) return { error: 'photo-alt' } as const;
  const kind: VenuePhotoKind = isVenueKind(input.kind) ? input.kind : 'other';
  if (input.main.length > PHOTO_MAX_BYTES || input.thumb.length > THUMB_MAX_BYTES) return { error: 'photo-size' } as const;
  const main = sanitiseJpeg(input.main);
  const thumb = sanitiseJpeg(input.thumb);
  if (!main || !thumb) return { error: 'photo-type' } as const;
  const db = getDb();
  const [{ n }] = await db.select({ n: count() }).from(venuePhotos).where(eq(venuePhotos.venueId, venueId));
  if (n >= MAX_VENUE_PHOTOS) return { error: 'photo-limit' } as const;

  const key = randomUUID();
  const pathname = `venue-photos/${venueId}/${key}.jpg`;
  const thumbPathname = `venue-photos/${venueId}/${key}-thumb.jpg`;
  const opts = { access: 'private' as const, contentType: 'image/jpeg', addRandomSuffix: false };
  await Promise.all([put(pathname, Buffer.from(main.bytes), opts), put(thumbPathname, Buffer.from(thumb.bytes), opts)]);
  const [row] = await db.insert(venuePhotos).values({
    venueId, userId, kind, alt, pathname, thumbPathname,
    width: main.info.width, height: main.info.height, bytes: main.bytes.length,
  }).returning();
  return { ok: true, photo: toPhotoVM(row) } as const;
}

export async function deleteVenuePhoto(userId: string, venueId: string, id: string) {
  if (!(await managesVenue(userId, venueId))) return notYours;
  const gone = await getDb().delete(venuePhotos).where(and(eq(venuePhotos.id, id), eq(venuePhotos.venueId, venueId)))
    .returning({ a: venuePhotos.pathname, b: venuePhotos.thumbPathname });
  await deleteBlobs(gone.flatMap(g => [g.a, g.b]));
  return { ok: true } as const;
}

/** Public: the venue's visible photos (shown after community photos, never as the cover). */
export async function getPublicVenuePhotos(venueId: string): Promise<VenuePhotoVM[]> {
  const rows = await getDb().select().from(venuePhotos)
    .where(and(eq(venuePhotos.venueId, venueId), eq(venuePhotos.hidden, false)))
    .orderBy(asc(venuePhotos.createdAt)).limit(MAX_VENUE_PHOTOS);
  return rows.map(toPhotoVM);
}

export async function listOwnPhotos(venueId: string) {
  return getDb().select().from(venuePhotos).where(eq(venuePhotos.venueId, venueId)).orderBy(asc(venuePhotos.createdAt));
}

export async function getVenuePhotoRow(id: string) {
  const [p] = await getDb().select().from(venuePhotos).where(eq(venuePhotos.id, id));
  return p ?? null;
}

// ── Corrections to contact details ───────────────────────────────────────
export const HOURS_MAX = 300;

function normaliseWebsite(v: string) {
  if (!v) return { value: null } as const;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!['http:', 'https:'].includes(u.protocol) || !u.hostname.includes('.')) return { error: 'website' } as const;
    return { value: u.toString() } as const;
  } catch { return { error: 'website' } as const; }
}
function normalisePhone(v: string) {
  if (!v) return { value: null } as const;
  const digits = v.replace(/\D/g, '');
  if (!/^[+\d][\d\s()-]*$/.test(v) || digits.length < 6 || digits.length > 15) return { error: 'phone' } as const;
  return { value: v } as const;
}

export async function saveCorrections(userId: string, venueId: string, input: { phone: unknown; website: unknown; hours: unknown }) {
  if (!(await managesVenue(userId, venueId))) return notYours;
  const phone = normalisePhone(oneLine(input.phone, 40));
  if ('error' in phone) return { error: 'phone' } as const;
  const website = normaliseWebsite(oneLine(input.website, 200));
  if ('error' in website) return { error: 'website' } as const;
  const openingHours = clean(input.hours, HOURS_MAX) || null;
  const db = getDb();
  if (!phone.value && !website.value && !openingHours) {
    await db.delete(venueCorrections).where(eq(venueCorrections.venueId, venueId));
    return { ok: true, removed: true } as const;
  }
  const set = { userId, phone: phone.value, website: website.value, openingHours, updatedAt: new Date() };
  await db.insert(venueCorrections).values({ venueId, ...set }).onConflictDoUpdate({ target: venueCorrections.venueId, set });
  return { ok: true, removed: false } as const;
}

export type CorrectionsVM = {
  phone: string | null; website: string | null; hours: string | null; at: string;
  // What OpenStreetMap says, shown underneath (it stays; nothing is overwritten).
  osm: { phone: string | null; website: string | null; hours: string | null };
};

export async function getCorrections(venueId: string): Promise<CorrectionsVM | null> {
  const [row] = await getDb().select({ c: venueCorrections, phone: venues.phone, website: venues.website, tags: venues.osmTags })
    .from(venueCorrections).innerJoin(venues, eq(venues.id, venueCorrections.venueId))
    .where(eq(venueCorrections.venueId, venueId));
  if (!row) return null;
  const { c } = row;
  return {
    phone: c.phone, website: c.website, hours: c.openingHours, at: new Date(c.updatedAt).toISOString(),
    osm: { phone: row.phone, website: row.website, hours: row.tags?.opening_hours ?? null },
  };
}

// ── Reports about reviews ────────────────────────────────────────────────
export const REPORT_REASONS: ReportReason[] = ['personal', 'offensive', 'wrong-place', 'fake', 'other'];
export const REPORT_NOTE_MAX = 500;

/** A venue asks the pilot team to look at a review. It changes nothing by itself. */
export async function reportReview(userId: string, venueId: string, reviewId: string, reasonIn: unknown, noteIn: unknown) {
  if (!(await managesVenue(userId, venueId))) return notYours;
  const reason = REPORT_REASONS.find(r => r === reasonIn);
  if (!reason) return { error: 'report-reason' } as const;
  const note = clean(noteIn, REPORT_NOTE_MAX);
  if (reason === 'other' && note.length < 3) return { error: 'report-note' } as const;
  const db = getDb();
  const [r] = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.venueId, venueId)));
  if (!r) return { error: 'report-review' } as const;
  await db.insert(reviewReports).values({ reviewId, venueId, reporterId: userId, reason, note }).onConflictDoNothing();
  return { ok: true } as const;
}

/** Review ids this venue has an open report on (to show "Reported"). */
export async function openReportsForVenue(venueId: string) {
  const rows = await getDb().select({ reviewId: reviewReports.reviewId, reason: reviewReports.reason, createdAt: reviewReports.createdAt })
    .from(reviewReports).where(and(eq(reviewReports.venueId, venueId), eq(reviewReports.status, 'open')));
  return new Map(rows.map(r => [r.reviewId, r]));
}

// ── Dashboard overview extras ────────────────────────────────────────────
const DAYS = 30;

/** Saves in the last 30 days by the savers' needs — anonymous counts only. */
export async function getSavesByNeed(venueId: string) {
  const db = getDb();
  const since = sql`now() - make_interval(days => ${DAYS})`;
  const [byNeed, [tot]] = await Promise.all([
    db.select({ need: sql<string>`unnest(${profiles.needs})`, n: sql<number>`count(*)::int` })
      .from(saved).innerJoin(profiles, eq(profiles.userId, saved.userId))
      .where(and(eq(saved.venueId, venueId), gte(saved.createdAt, since)))
      .groupBy(sql`1`),
    db.select({ recent: sql<number>`count(*) filter (where ${saved.createdAt} >= ${since})::int`, all: sql<number>`count(*)::int` })
      .from(saved).where(eq(saved.venueId, venueId)),
  ]);
  return { byNeed: new Map(byNeed.map(r => [r.need, r.n])), recent: tot?.recent ?? 0, all: tot?.all ?? 0 };
}

const VISIT_GAP_MS = 30 * 60 * 1000;

/** Record that the owner opened the dashboard; returns when their previous
 *  visit was (null on the first one), for "new reviews since your last visit". */
export async function touchOwnerVisit(userId: string, venueId: string): Promise<Date | null> {
  const db = getDb();
  const [c] = await db.select({ id: venueClaims.id, last: venueClaims.lastSeenAt, prev: venueClaims.prevSeenAt }).from(venueClaims)
    .where(and(eq(venueClaims.userId, userId), eq(venueClaims.venueId, venueId), eq(venueClaims.status, 'approved')));
  if (!c) return null;
  const now = new Date();
  const newVisit = !c.last || now.getTime() - c.last.getTime() > VISIT_GAP_MS;
  const prev = newVisit ? c.last : c.prev;
  await db.update(venueClaims).set(newVisit ? { lastSeenAt: now, prevSeenAt: c.last } : { lastSeenAt: now }).where(eq(venueClaims.id, c.id));
  return prev;
}

// ── Admin ────────────────────────────────────────────────────────────────
export async function listNoticesForAdmin() {
  return getDb().select({
    id: venueNotices.id, body: venueNotices.body, endsOn: venueNotices.endsOn, hidden: venueNotices.hidden,
    hiddenNote: venueNotices.hiddenNote, createdAt: venueNotices.createdAt, venueId: venueNotices.venueId, venueName: venues.name,
    expired: sql<boolean>`(${venueNotices.endsOn} is not null and ${venueNotices.endsOn} < ${today})`,
  }).from(venueNotices).innerJoin(venues, eq(venues.id, venueNotices.venueId))
    .orderBy(desc(venueNotices.createdAt)).limit(100);
}

export async function setNoticeHidden(id: string, hidden: boolean, note?: string | null) {
  await getDb().update(venueNotices).set(hidden
    ? { hidden, hiddenAt: new Date(), hiddenNote: clean(note, 300) || null }
    : { hidden, hiddenAt: null, hiddenNote: null }).where(eq(venueNotices.id, id));
}

export async function listVenuePhotosForAdmin() {
  return getDb().select({
    id: venuePhotos.id, kind: venuePhotos.kind, alt: venuePhotos.alt, hidden: venuePhotos.hidden, hiddenNote: venuePhotos.hiddenNote,
    createdAt: venuePhotos.createdAt, venueName: venues.name,
  }).from(venuePhotos).innerJoin(venues, eq(venues.id, venuePhotos.venueId))
    .orderBy(desc(venuePhotos.createdAt)).limit(100);
}

export async function setVenuePhotoHidden(id: string, hidden: boolean, note?: string | null) {
  await getDb().update(venuePhotos).set(hidden
    ? { hidden, hiddenAt: new Date(), hiddenNote: clean(note, 300) || null }
    : { hidden, hiddenAt: null, hiddenNote: null }).where(eq(venuePhotos.id, id));
}

export async function listReviewReportsForAdmin() {
  return getDb().select({
    id: reviewReports.id, reviewId: reviewReports.reviewId, reason: reviewReports.reason, note: reviewReports.note,
    status: reviewReports.status, createdAt: reviewReports.createdAt, decidedAt: reviewReports.decidedAt,
    venueName: venues.name, reviewNote: reviews.note, reviewVerdict: reviews.verdict, reviewHidden: reviews.hidden,
    reviewCreatedAt: reviews.createdAt,
  }).from(reviewReports)
    .innerJoin(reviews, eq(reviews.id, reviewReports.reviewId))
    .innerJoin(venues, eq(venues.id, reviewReports.venueId))
    .orderBy(sql`case ${reviewReports.status} when 'open' then 0 else 1 end`, desc(reviewReports.createdAt)).limit(200);
}

/** The pilot team decides: keep the review, or hide it (the existing review
 *  moderation). Every open report on that review is closed the same way. */
export async function decideReviewReport(id: string, decision: 'kept' | 'hidden', adminUserId: string) {
  const db = getDb();
  const [r] = await db.select({ reviewId: reviewReports.reviewId }).from(reviewReports).where(eq(reviewReports.id, id));
  if (!r) return;
  if (decision === 'hidden') await setReviewHidden(r.reviewId, true);
  await db.update(reviewReports).set({ status: decision, decidedBy: adminUserId, decidedAt: new Date() })
    .where(and(eq(reviewReports.reviewId, r.reviewId), eq(reviewReports.status, 'open')));
}
