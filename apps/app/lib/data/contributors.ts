import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { authorOf, FOUNDING_BEFORE, withAuthor, type AuthorRow, type AuthoredReviewVM } from '../contributors/author';
import { badgeStates, earnedBadges, type ContribCounts } from '../contributors/badges';
import { buildReviewVM } from '../venues';
import { RA2_NEEDS } from '../pilot-data';

// Community recognition (Brief L): review authors, "This helped me",
// contributor badges, public profiles and the monthly top contributors.
// What a reader may see about an author is decided in lib/contributors/author.ts.

const { profiles, reviews, reviewThanks, venues } = schema;

const authorCols = {
  publicName: profiles.publicName, postAnonymously: profiles.postAnonymously,
  relationship: profiles.relationship, showNeeds: profiles.showNeeds, publicId: profiles.publicId,
};

export async function getAuthors(userIds: string[]) {
  const ids = [...new Set(userIds)];
  const out = new Map<string, AuthorRow>();
  if (!ids.length) return out;
  const rows = await getDb().select({ userId: profiles.userId, ...authorCols }).from(profiles).where(inArray(profiles.userId, ids));
  for (const r of rows) out.set(r.userId, r);
  return out;
}

/** Visible reviews of a place, newest first, with their authors and thanks. */
export async function getAuthoredReviews(venueId: string, viewerId: string): Promise<AuthoredReviewVM[]> {
  const db = getDb();
  const rs = await db.select({
    r: reviews, ...authorCols,
    thanks: sql<number>`(select count(*)::int from review_thanks rt where rt.review_id = "reviews"."id")`,
    thankedByMe: sql<boolean>`exists (select 1 from review_thanks rt where rt.review_id = "reviews"."id" and rt.user_id = ${viewerId})`,
  }).from(reviews).innerJoin(profiles, eq(profiles.userId, reviews.userId))
    .where(and(eq(reviews.venueId, venueId), eq(reviews.hidden, false)))
    .orderBy(sql`"reviews"."created_at" desc`);
  const now = Date.now();
  return rs.map(x => withAuthor(buildReviewVM(x.r, viewerId, now), x, x.thanks, x.thankedByMe));
}

// ── "This helped me" ───────────────────────────────────────────────────────
export async function setReviewThanks(userId: string, reviewId: string, on: boolean) {
  if (!/^[0-9a-f-]{36}$/i.test(reviewId)) return { error: 'Unknown review', status: 404 } as const;
  const db = getDb();
  const [r] = await db.select({ userId: reviews.userId }).from(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.hidden, false)));
  if (!r) return { error: 'Unknown review', status: 404 } as const;
  if (r.userId === userId) return { error: 'You can’t thank your own review', status: 400 } as const;
  await db.insert(profiles).values({ userId }).onConflictDoNothing();
  if (on) await db.insert(reviewThanks).values({ reviewId, userId }).onConflictDoNothing();
  else await db.delete(reviewThanks).where(and(eq(reviewThanks.reviewId, reviewId), eq(reviewThanks.userId, userId)));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(reviewThanks).where(eq(reviewThanks.reviewId, reviewId));
  return { ok: true, thanks: n, thankedByMe: on } as const;
}

// ── Counts and badges ──────────────────────────────────────────────────────
/** Everything a badge needs, visible content only. */
export async function getContribCounts(userId: string): Promise<ContribCounts> {
  const res = await getDb().execute(sql`
    select
      (select count(*)::int from reviews r where r.user_id = ${userId} and not r.hidden) as reviews,
      (select count(*)::int from venue_entrances e left join reviews r on r.id = e.review_id
         where e.user_id = ${userId} and e.source = 'community' and not e.hidden and coalesce(not r.hidden, true)) as entrances,
      (select count(*)::int from review_photos ph left join reviews r on r.id = ph.review_id
         where ph.user_id = ${userId} and not ph.hidden and length(trim(ph.alt)) > 0
           and ((ph.review_id is not null and not r.hidden)
             or exists (select 1 from arrival_steps a where a.photo_id = ph.id and not a.hidden))) as photos,
      (select count(*)::int from arrival_steps a where a.user_id = ${userId} and not a.hidden) as steps,
      (select count(distinct t.user_id)::int from review_thanks t join reviews r on r.id = t.review_id
         where r.user_id = ${userId} and not r.hidden and t.user_id <> ${userId}) as helped,
      coalesce((select p.created_at < ${FOUNDING_BEFORE.toISOString()}::timestamptz from profiles p where p.user_id = ${userId}), false) as founding,
      exists (select 1 from mapping_event_members m where m.user_id = ${userId}) as mapper
  `);
  const row = (res.rows[0] || {}) as Record<string, unknown>;
  return {
    reviews: Number(row.reviews || 0), entrances: Number(row.entrances || 0), photos: Number(row.photos || 0),
    steps: Number(row.steps || 0), helped: Number(row.helped || 0),
    founding: row.founding === true, mapper: row.mapper === true,
  };
}

export async function getMyContrib(userId: string) {
  const counts = await getContribCounts(userId);
  return { counts, badges: badgeStates(counts), earned: earnedBadges(counts) };
}

// ── Top contributors this month ────────────────────────────────────────────
// Only people with a public name; ranked by visible reviews in the last 30
// days (the pilot area is the whole venue table). Never shows needs.
export async function getTopContributors(limit = 5) {
  const rows = await getDb().select({
    publicId: profiles.publicId, name: profiles.publicName, relationship: profiles.relationship,
    reviews: sql<number>`count(*)::int`,
  }).from(reviews)
    .innerJoin(profiles, eq(profiles.userId, reviews.userId))
    .innerJoin(venues, and(eq(venues.id, reviews.venueId), eq(venues.active, true)))
    .where(and(
      eq(reviews.hidden, false),
      sql`"reviews"."created_at" > now() - interval '30 days'`,
      sql`"profiles"."relationship" is not null`,
      eq(profiles.postAnonymously, false),
      sql`coalesce(trim("profiles"."public_name"), '') <> ''`,
    ))
    .groupBy(profiles.userId, profiles.publicId, profiles.publicName, profiles.relationship)
    .orderBy(sql`count(*) desc`, sql`max("reviews"."created_at") desc`)
    .limit(limit);
  return rows.map(r => ({ ...r, rel: authorOf({ ...r, publicName: r.name, postAnonymously: false, showNeeds: false }).rel }));
}

// ── Public profile /u/[public_id] ──────────────────────────────────────────
// Only for named people. Shows what they allowed: the name, the relationship,
// needs only with show_needs. No Clerk id, no email.
export async function getPublicProfile(publicId: string) {
  if (!/^[a-z0-9]{6,32}$/.test(publicId)) return null;
  const db = getDb();
  const [p] = await db.select().from(profiles).where(eq(profiles.publicId, publicId));
  const author = authorOf(p);
  if (!p || author.legacy || !author.name) return null;
  const [contrib, rs] = await Promise.all([
    getMyContrib(p.userId),
    db.select({
      id: reviews.id, verdict: reviews.verdict, note: reviews.note, createdAt: reviews.createdAt,
      venueId: venues.id, venueName: venues.name, suburb: venues.suburb,
      thanks: sql<number>`(select count(*)::int from review_thanks rt where rt.review_id = "reviews"."id")`,
    }).from(reviews).innerJoin(venues, eq(venues.id, reviews.venueId))
      .where(and(eq(reviews.userId, p.userId), eq(reviews.hidden, false), eq(venues.active, true)))
      .orderBy(sql`"reviews"."created_at" desc`).limit(100),
  ]);
  return {
    name: author.name, rel: author.rel,
    needs: author.showNeeds ? RA2_NEEDS.filter(n => p.needs.includes(n.id)).map(n => n.id) : [],
    memberSince: p.createdAt, ...contrib, reviews: rs,
  };
}

// ── Admin ──────────────────────────────────────────────────────────────────
/** An offensive name: cleared, so reviews show "Roam Access member" until the person picks a new one. */
export async function resetPublicName(userId: string) {
  await getDb().update(profiles).set({ publicName: null, updatedAt: new Date() }).where(eq(profiles.userId, userId));
}

export { withAuthor };
