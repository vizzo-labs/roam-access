import 'server-only';
// F4 Community growth — data access for quick answers ("Help fill the gaps"),
// mapping days and their leaderboards. Kept out of the shared lib/data.ts.

import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { ensureProfile, getVenueVM } from '../data';
import { featureCounts, type FeatureCount } from '../venues';
import { FEATURE_IDS, PILOT_AREA, type FeatureId } from '../pilot-data';
import { pickGaps, type GapTask } from '../community/gaps';

const { venues, reviews, profiles, microAnswers, mappingEvents, mappingEventMembers } = schema;

// ── Quick answers ─────────────────────────────────────────────────────────

const PILOT_RADIUS_DEG = 0.15; // ~15 km: outside that, measure from Manly Wharf

export function pilotOrigin(lat: unknown, lng: unknown) {
  const la = Number(lat), ln = Number(lng);
  const o = PILOT_AREA.origin;
  if (Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la - o.lat) < PILOT_RADIUS_DEG && Math.abs(ln - o.lng) < PILOT_RADIUS_DEG) {
    return { lat: la, lng: ln };
  }
  return { lat: o.lat, lng: o.lng };
}

export async function getGapTasks(userId: string, origin: { lat: number; lng: number }, skip: string[] = []): Promise<GapTask[]> {
  const db = getDb();
  const profile = await ensureProfile(userId);
  const [vs, rs, qs] = await Promise.all([
    db.select({
      id: venues.id, name: venues.name, kind: venues.kind, suburb: venues.suburb,
      lat: venues.lat, lng: venues.lng, osmTags: venues.osmTags,
    }).from(venues).where(eq(venues.active, true)),
    // Hidden reviews still mark a question as "answered by you" (below).
    db.select().from(reviews),
    db.select().from(microAnswers),
  ]);

  const answered = new Set<string>();
  for (const r of rs) {
    if (r.userId !== userId) continue;
    for (const [k, val] of Object.entries(r.features || {})) if (val === 'yes' || val === 'no') answered.add(`${r.venueId}:${k}`);
  }
  for (const q of qs) if (q.userId === userId) answered.add(`${q.venueId}:${q.feature}`);

  const group = <T extends { venueId: string; hidden: boolean }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) if (!r.hidden) m.set(r.venueId, [...(m.get(r.venueId) || []), r]);
    return m;
  };
  const rByVenue = group(rs), qByVenue = group(qs);
  const counts = new Map<string, Map<FeatureId, FeatureCount>>();
  for (const v of vs) {
    const r = rByVenue.get(v.id) || [], q = qByVenue.get(v.id) || [];
    if (r.length || q.length) counts.set(v.id, featureCounts(r, q));
  }
  return pickGaps({ venues: vs, counts, answered, skip: new Set(skip), needs: profile.needs, origin });
}

export async function saveMicroAnswer(userId: string, input: { venueId?: unknown; feature?: unknown; answer?: unknown }) {
  const db = getDb();
  if (typeof input.venueId !== 'string') return { error: 'venueId required' } as const;
  if (!FEATURE_IDS.includes(input.feature as FeatureId)) return { error: 'Unknown question' } as const;
  if (input.answer !== 'yes' && input.answer !== 'no') return { error: 'answer must be yes or no' } as const;
  const [v] = await db.select({ id: venues.id }).from(venues).where(and(eq(venues.id, input.venueId), eq(venues.active, true)));
  if (!v) return { error: 'Unknown venue' } as const;
  await ensureProfile(userId);
  // Answering again replaces your answer: one person, one vote per question.
  await db.insert(microAnswers)
    .values({ venueId: v.id, userId, feature: input.feature as FeatureId, answer: input.answer })
    .onConflictDoUpdate({
      target: [microAnswers.userId, microAnswers.venueId, microAnswers.feature],
      set: { answer: input.answer, updatedAt: new Date() },
    });
  const [venue, [mine]] = await Promise.all([
    getVenueVM(v.id),
    db.select({ n: sql<number>`count(*)::int` }).from(microAnswers).where(eq(microAnswers.userId, userId)),
  ]);
  return { venue, myAnswers: mine?.n ?? 0 } as const;
}

// ── Mapping days ──────────────────────────────────────────────────────────

export type EventInfo = {
  id: string; code: string; name: string; area: string;
  startsAt: Date; endsAt: Date; status: 'upcoming' | 'live' | 'ended';
};

const statusOf = (e: { startsAt: Date; endsAt: Date }, now = Date.now()): EventInfo['status'] =>
  now < +e.startsAt ? 'upcoming' : now > +e.endsAt ? 'ended' : 'live';

const toInfo = (e: typeof mappingEvents.$inferSelect): EventInfo => ({
  id: e.id, code: e.code, name: e.name, area: e.area, startsAt: e.startsAt, endsAt: e.endsAt, status: statusOf(e),
});

export function normaliseCode(raw: unknown) {
  return typeof raw === 'string' ? raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24) : '';
}

// Unambiguous characters only (no 0/O, 1/I/L): codes get read out loud.
function newCode(name: string) {
  const word = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'MAP';
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let tail = '';
  for (let i = 0; i < 4; i++) tail += chars[Math.floor(Math.random() * chars.length)];
  return `${word}-${tail}`;
}

export async function getEventByCode(code: string): Promise<EventInfo | null> {
  const c = normaliseCode(code);
  if (!c) return null;
  const [e] = await getDb().select().from(mappingEvents).where(eq(mappingEvents.code, c));
  return e ? toInfo(e) : null;
}

/** Admin: date + times are Sydney local time ("2026-11-21", "09:30"). */
export async function createEvent(adminId: string, input: { name?: unknown; area?: unknown; date?: unknown; start?: unknown; end?: unknown; code?: unknown }) {
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 80) : '';
  const area = typeof input.area === 'string' ? input.area.trim().slice(0, 120) : '';
  const date = typeof input.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : '';
  const time = (t: unknown) => (typeof t === 'string' && /^\d{2}:\d{2}$/.test(t) ? t : '');
  const start = time(input.start), end = time(input.end);
  if (!name) return { error: 'Give the mapping day a name.' } as const;
  if (!date || !start || !end) return { error: 'Choose a date, a start time and an end time.' } as const;
  if (end <= start) return { error: 'The end time must be after the start time.' } as const;
  const code = normaliseCode(input.code) || newCode(name);
  const local = (t: string) => sql`(${`${date} ${t}`}::timestamp at time zone 'Australia/Sydney')`;
  const db = getDb();
  const [clash] = await db.select({ id: mappingEvents.id }).from(mappingEvents).where(eq(mappingEvents.code, code));
  if (clash) return { error: `The join code ${code} is taken — choose another.` } as const;
  const [e] = await db.insert(mappingEvents).values({
    name, area, code, createdBy: adminId,
    startsAt: local(start), endsAt: local(end),
  }).returning();
  return { event: toInfo(e) } as const;
}

export async function listEvents() {
  const db = getDb();
  const es = await db.select().from(mappingEvents).orderBy(desc(mappingEvents.startsAt));
  const members = es.length
    ? await db.select({ eventId: mappingEventMembers.eventId, n: sql<number>`count(*)::int` })
      .from(mappingEventMembers).where(inArray(mappingEventMembers.eventId, es.map(e => e.id))).groupBy(mappingEventMembers.eventId)
    : [];
  const byId = new Map(members.map(m => [m.eventId, m.n]));
  return es.map(e => ({ ...toInfo(e), members: byId.get(e.id) ?? 0 }));
}

export async function getMembership(eventId: string, userId: string) {
  const [m] = await getDb().select().from(mappingEventMembers)
    .where(and(eq(mappingEventMembers.eventId, eventId), eq(mappingEventMembers.userId, userId)));
  return m ?? null;
}

const cleanName = (raw: unknown) => (typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, 30) : '');

/** Join (or update how you appear). Anonymous unless showName is chosen. */
export async function joinEvent(userId: string, eventId: string, input: { showName?: unknown; displayName?: unknown }) {
  await ensureProfile(userId);
  const displayName = cleanName(input.displayName);
  const showName = input.showName === true && !!displayName;
  await getDb().insert(mappingEventMembers)
    .values({ eventId, userId, showName, displayName: showName ? displayName : null })
    .onConflictDoUpdate({
      target: [mappingEventMembers.eventId, mappingEventMembers.userId],
      set: { showName, displayName: showName ? displayName : null },
    });
}

export async function leaveEvent(userId: string, eventId: string) {
  await getDb().delete(mappingEventMembers)
    .where(and(eq(mappingEventMembers.eventId, eventId), eq(mappingEventMembers.userId, userId)));
}

/** The mapping day a tester's contributions count toward right now, if any. */
export async function getLiveEventFor(userId: string) {
  const now = new Date();
  const [e] = await getDb().select({ code: mappingEvents.code, name: mappingEvents.name, endsAt: mappingEvents.endsAt })
    .from(mappingEventMembers)
    .innerJoin(mappingEvents, eq(mappingEvents.id, mappingEventMembers.eventId))
    .where(and(eq(mappingEventMembers.userId, userId), lte(mappingEvents.startsAt, now), gte(mappingEvents.endsAt, now)))
    .orderBy(mappingEvents.endsAt)
    .limit(1);
  return e ?? null;
}

export type LeaderRow = { rank: number; label: string; named: boolean; you: boolean; reviews: number; answers: number; places: number; total: number };

/**
 * Contributions by members between the event's start and end: visible reviews
 * and quick answers. Members are "Anonymous mapper" unless they opted in.
 * Nothing here touches needs — and none of it changes any verdict.
 */
export async function getLeaderboard(event: EventInfo, viewerId: string | null) {
  const db = getDb();
  const members = await db.select().from(mappingEventMembers).where(eq(mappingEventMembers.eventId, event.id));
  const ids = members.map(m => m.userId);
  const window = (col: typeof reviews.createdAt | typeof microAnswers.createdAt) => and(gte(col, event.startsAt), lte(col, event.endsAt));
  const [rs, qs] = ids.length ? await Promise.all([
    db.select({ userId: reviews.userId, venueId: reviews.venueId }).from(reviews)
      .where(and(inArray(reviews.userId, ids), eq(reviews.hidden, false), window(reviews.createdAt))),
    db.select({ userId: microAnswers.userId, venueId: microAnswers.venueId }).from(microAnswers)
      .where(and(inArray(microAnswers.userId, ids), eq(microAnswers.hidden, false), window(microAnswers.createdAt))),
  ]) : [[], []];

  const tally = new Map(ids.map(id => [id, { reviews: 0, answers: 0, places: new Set<string>() }]));
  for (const r of rs) { const t = tally.get(r.userId)!; t.reviews++; t.places.add(r.venueId); }
  for (const q of qs) { const t = tally.get(q.userId)!; t.answers++; t.places.add(q.venueId); }

  const rows = members.map(m => {
    const t = tally.get(m.userId)!;
    return {
      userId: m.userId, joinedAt: +m.joinedAt,
      label: m.showName && m.displayName ? m.displayName : 'Anonymous mapper',
      named: !!(m.showName && m.displayName), you: m.userId === viewerId,
      reviews: t.reviews, answers: t.answers, places: t.places.size, total: t.reviews + t.answers,
    };
  }).sort((a, b) => b.total - a.total || b.places - a.places || a.joinedAt - b.joinedAt);

  // Equal totals share a rank.
  const ranked: LeaderRow[] = [];
  rows.forEach((r, i) => {
    const prev = ranked[i - 1];
    const rank = prev && rows[i - 1].total === r.total ? prev.rank : i + 1;
    ranked.push({ rank, label: r.label, named: r.named, you: r.you, reviews: r.reviews, answers: r.answers, places: r.places, total: r.total });
  });
  const places = new Set([...rs, ...qs].map(x => x.venueId)).size;
  return {
    rows: ranked,
    totals: { members: members.length, reviews: rs.length, answers: qs.length, places },
  };
}

// ── Admin moderation ──────────────────────────────────────────────────────

export async function getRecentMicroAnswers(limit = 100) {
  return getDb().select({
    id: microAnswers.id, feature: microAnswers.feature, answer: microAnswers.answer,
    hidden: microAnswers.hidden, updatedAt: microAnswers.updatedAt, venueName: venues.name,
  }).from(microAnswers).innerJoin(venues, eq(venues.id, microAnswers.venueId))
    .orderBy(desc(microAnswers.updatedAt)).limit(limit);
}

export async function setMicroAnswerHidden(id: string, hidden: boolean) {
  await getDb().update(microAnswers).set({ hidden }).where(eq(microAnswers.id, id));
}

export async function getProfileName(userId: string) {
  const [p] = await getDb().select({ name: profiles.name }).from(profiles).where(eq(profiles.userId, userId));
  return p?.name ?? '';
}
