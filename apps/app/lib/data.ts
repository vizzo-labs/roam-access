import 'server-only';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { getDb, schema } from './db';
import { buildVenueVM, type VenueVM } from './venues';
import { FEATURE_IDS, NEED_IDS, type VerdictKind } from './pilot-data';
import { getConfirmationStats } from './data/trust';
import type { EntranceAlt } from './db/schema';
import { ENTRANCE_ALTS, ENTRANCE_NOTE_MAX } from './trust/entrance';
import { getSensoryReports, parseSensoryInput, saveReviewSensory, sensoryColumns } from './data/sensory';
import { buildSensoryVM } from './sensory/summary';
import { getCoverPhotos } from './data/photos';
import { getBestEntrances } from './data/entrances';
import { getLiveNotices, getSeenNoticeIds } from './data/owners';
import { getAuthoredReviews, getMyContrib } from './data/contributors';
import { cleanPublicName, RELATIONSHIPS } from './contributors/author';
import type { Relationship } from './db/schema';

const { venues, reviews, profiles, saved, microAnswers } = schema;

// `pub`: how the person appears on reviews (Brief L). relationship null =
// never chosen, so their reviews keep the old anonymous display.
export type Me = {
  name: string; needs: string[]; onboarded: boolean;
  pub: {
    publicName: string | null; postAnonymously: boolean; relationship: Relationship | null;
    showNeeds: boolean; publicId: string; prompted: boolean;
  };
};

const meOf = (p: typeof profiles.$inferSelect): Me => ({
  name: p.name, needs: p.needs, onboarded: !!p.onboardedAt,
  pub: {
    publicName: p.publicName, postAnonymously: p.postAnonymously, relationship: p.relationship,
    showNeeds: p.showNeeds, publicId: p.publicId, prompted: !!p.namePromptedAt,
  },
});

export async function ensureProfile(userId: string) {
  const db = getDb();
  await db.insert(profiles).values({ userId }).onConflictDoNothing();
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return p;
}

export async function getVenueVMs(): Promise<VenueVM[]> {
  const db = getDb();
  const [vs, rs, confirm, qs, ss, covers, entrances, notices] = await Promise.all([
    db.select().from(venues).where(eq(venues.active, true)),
    db.select().from(reviews).where(eq(reviews.hidden, false)),
    getConfirmationStats(),
    db.select().from(microAnswers).where(eq(microAnswers.hidden, false)),
    getSensoryReports(),
    getCoverPhotos(),
    getBestEntrances(),
    getLiveNotices(),
  ]);
  const byVenue = new Map<string, typeof rs>();
  for (const r of rs) byVenue.set(r.venueId, [...(byVenue.get(r.venueId) || []), r]);
  const quickByVenue = new Map<string, typeof qs>();
  for (const q of qs) quickByVenue.set(q.venueId, [...(quickByVenue.get(q.venueId) || []), q]);
  const sensoryByVenue = new Map<string, typeof ss>();
  for (const x of ss) sensoryByVenue.set(x.venueId, [...(sensoryByVenue.get(x.venueId) || []), x]);
  const now = Date.now();
  return vs.map(v => {
    const cover = covers.get(v.id);
    const entrance = entrances.get(v.id);
    const venueNotices = notices.get(v.id);
    return {
      ...buildVenueVM(v, byVenue.get(v.id) || [], confirm.get(v.id), quickByVenue.get(v.id) || []),
      sensory: buildSensoryVM(byVenue.get(v.id) || [], sensoryByVenue.get(v.id) || [], now),
      // Only places with a photo carry one (keeps /api/bootstrap small).
      ...(cover ? { coverPhoto: cover } : {}),
      ...(entrance ? { entrance } : {}),
      // "Venue says" updates (business portal v2): shown apart from facts, never a verdict.
      ...(venueNotices ? { notices: venueNotices } : {}),
    };
  });
}

export async function getVenueVM(id: string): Promise<VenueVM | null> {
  const db = getDb();
  const [v] = await db.select().from(venues).where(and(eq(venues.id, id), eq(venues.active, true)));
  if (!v) return null;
  const [rs, confirm, qs, ss, covers, entrances, notices] = await Promise.all([
    db.select().from(reviews).where(and(eq(reviews.venueId, id), eq(reviews.hidden, false))),
    getConfirmationStats(id),
    db.select().from(microAnswers).where(and(eq(microAnswers.venueId, id), eq(microAnswers.hidden, false))),
    getSensoryReports(id),
    getCoverPhotos(id),
    getBestEntrances(id),
    getLiveNotices(id),
  ]);
  const venueNotices = notices.get(id);
  return {
    ...buildVenueVM(v, rs, confirm.get(id), qs), sensory: buildSensoryVM(rs, ss),
    coverPhoto: covers.get(id) ?? null, entrance: entrances.get(id) ?? null,
    ...(venueNotices ? { notices: venueNotices } : {}),
  };
}

export async function getMyStats(userId: string) {
  const db = getDb();
  const [row] = await db.select({
    reviews: sql<number>`count(*)::int`,
    places: sql<number>`count(distinct ${reviews.venueId})::int`,
  }).from(reviews).where(eq(reviews.userId, userId));
  return { reviews: row?.reviews ?? 0, places: row?.places ?? 0 };
}

export async function getPilotStats() {
  const db = getDb();
  const [[t], [r]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(profiles).where(sql`${profiles.onboardedAt} is not null`),
    db.select({ n: sql<number>`count(*)::int`, places: sql<number>`count(distinct ${reviews.venueId})::int` }).from(reviews).where(and(eq(reviews.hidden, false), isNotNull(reviews.verdict))),
  ]);
  return { testers: t?.n ?? 0, reviews: r?.n ?? 0, placesReviewed: r?.places ?? 0 };
}

export async function getBootstrap(userId: string) {
  const db = getDb();
  const profile = await ensureProfile(userId);
  const [venueVMs, savedRows, mineRows, myStats, pilot, seenNotices, contrib] = await Promise.all([
    getVenueVMs(),
    db.select({ venueId: saved.venueId }).from(saved).where(eq(saved.userId, userId)).orderBy(desc(saved.createdAt)),
    db.selectDistinct({ venueId: reviews.venueId }).from(reviews).where(eq(reviews.userId, userId)),
    getMyStats(userId),
    getPilotStats(),
    getSeenNoticeIds(userId),
    getMyContrib(userId),
  ]);
  return {
    me: meOf(profile), venues: venueVMs,
    saved: savedRows.map(s => s.venueId),
    reviewed: mineRows.map(r => r.venueId),
    myStats, pilot,
    // "Updates from your saved places" (in the app only; see lib/notify):
    // built from saved places' notices; these are the ones already seen.
    seenNotices,
    // Earned contributor badge ids, for the in-app "New badge" moment.
    badges: contrib.earned,
  };
}

type ProfileInput = {
  name?: unknown; needs?: unknown; onboarded?: unknown;
  publicName?: unknown; postAnonymously?: unknown; relationship?: unknown; showNeeds?: unknown; prompted?: unknown;
};

export async function updateProfile(userId: string, input: ProfileInput) {
  const db = getDb();
  await ensureProfile(userId);
  const set: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() };
  if (typeof input.name === 'string') set.name = input.name.trim().slice(0, 40);
  if (Array.isArray(input.needs)) set.needs = [...new Set(input.needs.filter((x): x is string => typeof x === 'string' && (NEED_IDS as string[]).includes(x)))];
  if (input.onboarded === true) set.onboardedAt = new Date();
  // How I appear on reviews. Choosing a relationship is what opts a person in
  // (their older reviews switch to the new display too); nothing else does.
  if ('publicName' in input) set.publicName = cleanPublicName(input.publicName);
  if (typeof input.postAnonymously === 'boolean') set.postAnonymously = input.postAnonymously;
  if (typeof input.showNeeds === 'boolean') set.showNeeds = input.showNeeds;
  if (RELATIONSHIPS.includes(input.relationship as Relationship)) set.relationship = input.relationship as Relationship;
  if (input.prompted === true || set.relationship) set.namePromptedAt = new Date();
  const [p] = await db.update(profiles).set(set).where(eq(profiles.userId, userId)).returning();
  return meOf(p);
}

export async function deleteProfile(userId: string) {
  // reviews and saved rows cascade from profiles.
  await getDb().delete(profiles).where(eq(profiles.userId, userId));
}

export async function getVenueReviews(venueId: string, viewerId: string) {
  // With the author line, thanks, and needs only where the author allows it.
  return getAuthoredReviews(venueId, viewerId);
}

const VERDICTS: VerdictKind[] = ['works', 'check', 'barrier'];

// The form adapts to who is writing (profile.relationship):
// - lived experience, "prefer not to say", or never chosen: as always.
// - carer: the verdict is about the person they were with; `needs` are that
//   person's ("Whose needs?", defaults to the profile's needs).
// - ally: NO verdict — an observation (verdict NULL). It never sets or changes
//   a verdict (lib/venues.ts) and needs at least one answer.
export async function createReview(userId: string, input: { venueId?: unknown; verdict?: unknown; features?: unknown; note?: unknown; entranceAlt?: unknown; entranceNote?: unknown; sensory?: unknown; needs?: unknown }, opts: { extras?: boolean } = {}) {
  const db = getDb();
  if (typeof input.venueId !== 'string') return { error: 'venueId required' } as const;
  const profile = await ensureProfile(userId);
  const writtenAs = profile.relationship;
  const ally = writtenAs === 'ally';
  if (!ally && !VERDICTS.includes(input.verdict as VerdictKind)) return { error: 'verdict must be works, check or barrier' } as const;
  const [v] = await db.select({ id: venues.id }).from(venues).where(and(eq(venues.id, input.venueId), eq(venues.active, true)));
  if (!v) return { error: 'Unknown venue' } as const;

  const features: Record<string, 'yes' | 'no'> = {};
  if (input.features && typeof input.features === 'object') {
    for (const [k, val] of Object.entries(input.features as Record<string, unknown>)) {
      if ((FEATURE_IDS as string[]).includes(k) && (val === 'yes' || val === 'no')) features[k] = val;
    }
  }
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, 1000) || null : null;
  const entranceAlt = ENTRANCE_ALTS.some(a => a.id === input.entranceAlt) ? input.entranceAlt as EntranceAlt : null;
  const entranceNote = entranceAlt && entranceAlt !== 'none' && typeof input.entranceNote === 'string'
    ? input.entranceNote.trim().slice(0, ENTRANCE_NOTE_MAX) || null : null;
  const sensory = parseSensoryInput(input.sensory);
  if (ally && !Object.keys(features).length && !note && !entranceAlt && !opts.extras
    && !sensory.noise && !sensory.light && !sensory.crowd && !sensory.quietTimes.length) {
    return { error: 'Answer at least one question' } as const;
  }
  const needs = writtenAs === 'carer' && Array.isArray(input.needs)
    ? [...new Set(input.needs.filter((x): x is string => typeof x === 'string' && (NEED_IDS as string[]).includes(x)))]
    : profile.needs;

  const [created] = await db.insert(reviews).values({
    venueId: v.id, userId, verdict: ally ? null : input.verdict as VerdictKind, writtenAs,
    needs, features, note, entranceAlt, entranceNote, ...sensoryColumns(sensory),
  }).returning({ id: reviews.id, createdAt: reviews.createdAt });
  await saveReviewSensory(userId, v.id, created.id, sensory, created.createdAt);
  const [venue, myStats, count] = await Promise.all([
    getVenueVM(v.id),
    getMyStats(userId),
    db.select({ n: sql<number>`count(*)::int` }).from(reviews).where(and(eq(reviews.venueId, v.id), eq(reviews.hidden, false), isNotNull(reviews.verdict))),
  ]);
  return { reviewId: created.id, venue, myStats, venueReviews: count[0]?.n ?? 0, observation: ally } as const;
}

export async function setSaved(userId: string, venueId: string, on: boolean) {
  const db = getDb();
  await ensureProfile(userId);
  if (on) await db.insert(saved).values({ userId, venueId }).onConflictDoNothing();
  else await db.delete(saved).where(and(eq(saved.userId, userId), eq(saved.venueId, venueId)));
}

// ── Admin ────────────────────────────────────────────────────────────────
export async function getAdminOverview() {
  const db = getDb();
  const [pilot, testers, recent] = await Promise.all([
    getPilotStats(),
    db.select({
      userId: profiles.userId, name: profiles.name, needs: profiles.needs,
      onboardedAt: profiles.onboardedAt, createdAt: profiles.createdAt,
      publicName: profiles.publicName, postAnonymously: profiles.postAnonymously, relationship: profiles.relationship,
      // Qualified by hand: inside a raw subquery Drizzle renders both columns as
      // bare "user_id", which Postgres resolves to reviews.user_id = reviews.user_id.
      reviews: sql<number>`(select count(*)::int from ${reviews} r where r.user_id = ${profiles}.user_id)`,
    }).from(profiles).orderBy(desc(profiles.createdAt)),
    db.select({
      id: reviews.id, verdict: reviews.verdict, note: reviews.note, needs: reviews.needs,
      features: reviews.features, hidden: reviews.hidden, createdAt: reviews.createdAt,
      userId: reviews.userId, venueId: reviews.venueId, venueName: venues.name,
    }).from(reviews).innerJoin(venues, eq(venues.id, reviews.venueId)).orderBy(desc(reviews.createdAt)).limit(200),
  ]);
  return { pilot, testers, recent };
}

export async function setReviewHidden(id: string, hidden: boolean) {
  await getDb().update(reviews).set({ hidden }).where(eq(reviews.id, id));
}
