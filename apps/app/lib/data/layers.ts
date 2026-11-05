import 'server-only';
// F3 · Access layers: facilities (toilets, beach items), partner badges and
// temporary barrier reports. Separate from lib/data.ts on purpose.
//
// Nothing here touches a verdict: badges are the partner's claim, facilities
// are listings from their source, and reports are today's news that expire.

import { and, asc, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import {
  BADGE_IDS, REPORT_NOTE_MAX, REPORT_OPPOSITE, reportType,
  type BadgeId, type FacilityLayer, type ReportTypeId,
} from '../layers/defs';

const { facilities, venueBadges, tempBarriers, venues } = schema;

export type FacilityVM = {
  id: string; layer: FacilityLayer; kind: string; name: string;
  suburb: string | null; address: string | null; lat: number; lng: number;
  details: Record<string, unknown>; description: string | null;
  bookingUrl: string | null; bookingPhone: string | null;
  source: string; sourceUrl: string | null; sourceLicence: string | null;
};
export type BadgeVM = { badge: BadgeId; sourceUrl: string; note: string | null };
export type ReportVM = {
  id: string; targetType: 'venue' | 'facility'; targetId: string; type: ReportTypeId;
  note: string | null; createdAt: string; lastConfirmedAt: string; expiresAt: string;
  confirmations: number; mine: boolean; confirmedByMe: boolean;
};

const active = () => and(eq(tempBarriers.hidden, false), isNull(tempBarriers.resolvedAt), gt(tempBarriers.expiresAt, sql`now()`));

function toReportVM(r: typeof tempBarriers.$inferSelect, viewerId: string): ReportVM {
  return {
    id: r.id, targetType: r.targetType as ReportVM['targetType'], targetId: r.targetId,
    type: r.type as ReportTypeId, note: r.note,
    createdAt: r.createdAt.toISOString(), lastConfirmedAt: r.lastConfirmedAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(), confirmations: r.confirmations,
    // Who reported or confirmed is never sent — only whether it was you.
    mine: r.createdBy === viewerId, confirmedByMe: r.confirmedBy.includes(viewerId),
  };
}

export async function getActiveReports(viewerId: string): Promise<ReportVM[]> {
  const rows = await getDb().select().from(tempBarriers).where(active()).orderBy(desc(tempBarriers.lastConfirmedAt));
  return rows.map(r => toReportVM(r, viewerId));
}

export async function getLayers(viewerId: string) {
  const db = getDb();
  const [fs, bs, reports] = await Promise.all([
    db.select().from(facilities).where(eq(facilities.active, true)).orderBy(asc(facilities.sort), asc(facilities.name)),
    db.select().from(venueBadges),
    getActiveReports(viewerId),
  ]);
  const badges: Record<string, BadgeVM[]> = {};
  for (const b of bs) {
    if (!(BADGE_IDS as string[]).includes(b.badge)) continue;
    (badges[b.venueId] ||= []).push({ badge: b.badge as BadgeId, sourceUrl: b.sourceUrl, note: b.note });
  }
  const list: FacilityVM[] = fs.map(f => ({
    id: f.id, layer: f.layer as FacilityLayer, kind: f.kind, name: f.name,
    suburb: f.suburb, address: f.address, lat: f.lat, lng: f.lng,
    details: f.details, description: f.description,
    bookingUrl: f.bookingUrl, bookingPhone: f.bookingPhone,
    source: f.source, sourceUrl: f.sourceUrl, sourceLicence: f.sourceLicence,
  }));
  return { facilities: list, badges, reports };
}

// ── Temporary reports ────────────────────────────────────────────────────
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000);

async function targetExists(targetType: string, targetId: string) {
  const db = getDb();
  if (targetType === 'venue') {
    const [v] = await db.select({ id: venues.id }).from(venues).where(and(eq(venues.id, targetId), eq(venues.active, true)));
    return v ? 'venue' as const : null;
  }
  const [f] = await db.select({ layer: facilities.layer }).from(facilities).where(and(eq(facilities.id, targetId), eq(facilities.active, true)));
  return f ? f.layer as FacilityLayer : null;
}

export async function createReport(userId: string, input: { targetType?: unknown; targetId?: unknown; type?: unknown; note?: unknown }) {
  const db = getDb();
  if (input.targetType !== 'venue' && input.targetType !== 'facility') return { error: 'targetType must be venue or facility' } as const;
  if (typeof input.targetId !== 'string') return { error: 'targetId required' } as const;
  const t = typeof input.type === 'string' ? reportType(input.type) : undefined;
  if (!t) return { error: 'Unknown report type' } as const;
  const where = await targetExists(input.targetType, input.targetId);
  if (!where) return { error: 'Unknown place' } as const;
  if (!t.on.includes(where)) return { error: 'That kind of report doesn’t apply here' } as const;
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, REPORT_NOTE_MAX) || null : null;

  // The matting answer replaces the opposite answer for the same beach.
  const opposite = REPORT_OPPOSITE[t.id];
  if (opposite) {
    await db.update(tempBarriers).set({ resolvedAt: new Date() }).where(and(
      eq(tempBarriers.targetType, input.targetType), eq(tempBarriers.targetId, input.targetId),
      eq(tempBarriers.type, opposite), active(),
    ));
  }
  // Same problem already reported and live → that's a "still there".
  const [existing] = await db.select().from(tempBarriers).where(and(
    eq(tempBarriers.targetType, input.targetType), eq(tempBarriers.targetId, input.targetId),
    eq(tempBarriers.type, t.id), active(),
  )).limit(1);
  if (existing) {
    await confirmReport(userId, existing.id, note);
    return { ok: true, merged: true } as const;
  }
  await db.insert(tempBarriers).values({
    targetType: input.targetType, targetId: input.targetId, type: t.id, note,
    createdBy: userId, expiresAt: hoursFromNow(t.hours),
  });
  return { ok: true, merged: false } as const;
}

// "Still there?" → yes: one confirmation per person; the expiry moves to at
// least now + the type's default life.
export async function confirmReport(userId: string, id: string, note: string | null = null) {
  const db = getDb();
  const [r] = await db.select().from(tempBarriers).where(and(eq(tempBarriers.id, id), active()));
  if (!r) return { error: 'This report has expired or been cleared' } as const;
  const t = reportType(r.type);
  const hours = t?.hours ?? 24;
  const counted = r.confirmedBy.includes(userId);
  await db.update(tempBarriers).set({
    lastConfirmedAt: new Date(),
    expiresAt: new Date(Math.max(+r.expiresAt, +hoursFromNow(hours))),
    ...(counted ? {} : {
      confirmations: sql`${tempBarriers.confirmations} + 1` as unknown as number,
      confirmedBy: sql`array_append(${tempBarriers.confirmedBy}, ${userId})` as unknown as string[],
    }),
    ...(note && !r.note ? { note } : {}),
  }).where(eq(tempBarriers.id, id));
  return { ok: true } as const;
}

// "It's gone" → the report stops showing for everyone.
export async function resolveReport(id: string) {
  const db = getDb();
  const [r] = await db.select({ id: tempBarriers.id }).from(tempBarriers).where(and(eq(tempBarriers.id, id), active()));
  if (!r) return { error: 'This report has already expired or been cleared' } as const;
  await db.update(tempBarriers).set({ resolvedAt: new Date() }).where(eq(tempBarriers.id, id));
  return { ok: true } as const;
}

// Account deletion: reports cascade with the profile; also drop the user's id
// from other people's reports they confirmed.
export async function forgetUserInReports(userId: string) {
  await getDb().update(tempBarriers)
    .set({ confirmedBy: sql`array_remove(${tempBarriers.confirmedBy}, ${userId})` as unknown as string[] })
    .where(sql`${userId} = any(${tempBarriers.confirmedBy})`);
}

// ── Admin ────────────────────────────────────────────────────────────────
export async function getLayersAdmin() {
  const db = getDb();
  const [badgeRows, beach, toiletCount, reports, venueList] = await Promise.all([
    db.select({
      venueId: venueBadges.venueId, badge: venueBadges.badge, sourceUrl: venueBadges.sourceUrl,
      note: venueBadges.note, updatedAt: venueBadges.updatedAt, venueName: venues.name,
    }).from(venueBadges).innerJoin(venues, eq(venues.id, venueBadges.venueId)).orderBy(asc(venues.name)),
    db.select().from(facilities).where(eq(facilities.layer, 'beach')).orderBy(asc(facilities.sort), asc(facilities.name)),
    db.select({ n: sql<number>`count(*)::int`, live: sql<number>`count(*) filter (where ${facilities.active})::int` })
      .from(facilities).where(eq(facilities.layer, 'toilets')),
    db.select({
      id: tempBarriers.id, targetType: tempBarriers.targetType, targetId: tempBarriers.targetId,
      type: tempBarriers.type, note: tempBarriers.note, createdAt: tempBarriers.createdAt,
      expiresAt: tempBarriers.expiresAt, resolvedAt: tempBarriers.resolvedAt, hidden: tempBarriers.hidden,
      confirmations: tempBarriers.confirmations,
      expired: sql<boolean>`${tempBarriers.expiresAt} <= now()`,
    }).from(tempBarriers).where(gt(tempBarriers.createdAt, sql`now() - interval '14 days'`)).orderBy(desc(tempBarriers.createdAt)).limit(200),
    db.select({ id: venues.id, name: venues.name, kind: venues.kind, suburb: venues.suburb })
      .from(venues).where(eq(venues.active, true)).orderBy(asc(venues.name)),
  ]);
  const ids = [...new Set(reports.map(r => r.targetId))];
  const names = new Map<string, string>();
  if (ids.length) {
    const [vs, fs] = await Promise.all([
      db.select({ id: venues.id, name: venues.name }).from(venues).where(inArray(venues.id, ids)),
      db.select({ id: facilities.id, name: facilities.name }).from(facilities).where(inArray(facilities.id, ids)),
    ]);
    for (const x of [...vs, ...fs]) names.set(x.id, x.name);
  }
  return {
    badges: badgeRows, beach, toilets: toiletCount[0] ?? { n: 0, live: 0 },
    reports: reports.map(r => ({ ...r, targetName: names.get(r.targetId) ?? r.targetId })),
    venues: venueList,
  };
}

const isHttpUrl = (s: string) => { try { return ['https:', 'http:'].includes(new URL(s).protocol); } catch { return false; } };

export async function upsertBadge(input: { venueId: string; badge: string; sourceUrl: string; note: string; addedBy: string }) {
  if (!(BADGE_IDS as string[]).includes(input.badge)) return { error: 'Unknown badge' } as const;
  if (!isHttpUrl(input.sourceUrl)) return { error: 'A source URL (https://…) is required' } as const;
  const db = getDb();
  const [v] = await db.select({ id: venues.id }).from(venues).where(eq(venues.id, input.venueId));
  if (!v) return { error: 'Unknown venue' } as const;
  const note = input.note.trim().slice(0, 300) || null;
  await db.insert(venueBadges).values({ venueId: v.id, badge: input.badge, sourceUrl: input.sourceUrl.trim(), note, addedBy: input.addedBy })
    .onConflictDoUpdate({ target: [venueBadges.venueId, venueBadges.badge], set: { sourceUrl: input.sourceUrl.trim(), note, addedBy: input.addedBy, updatedAt: new Date() } });
  return { ok: true } as const;
}

export async function removeBadge(venueId: string, badge: string) {
  await getDb().delete(venueBadges).where(and(eq(venueBadges.venueId, venueId), eq(venueBadges.badge, badge)));
}

export type BeachEdit = {
  id?: string; kind: string; name: string; suburb: string; address: string; lat: number; lng: number;
  description: string; bookingUrl: string; bookingPhone: string; source: string; sourceUrl: string;
  features: string[]; mattingQuestion: boolean; active: boolean; sort: number;
};

export async function saveBeachItem(e: BeachEdit) {
  if (!e.name.trim()) return { error: 'Name required' } as const;
  if (!Number.isFinite(e.lat) || !Number.isFinite(e.lng) || Math.abs(e.lat) > 90 || Math.abs(e.lng) > 180) return { error: 'Valid latitude and longitude required' } as const;
  if (e.sourceUrl && !isHttpUrl(e.sourceUrl)) return { error: 'Source URL must start with https://' } as const;
  if (e.bookingUrl && !isHttpUrl(e.bookingUrl)) return { error: 'Booking URL must start with https://' } as const;
  if (!['beach', 'liberty_swing', 'ferry', 'walk'].includes(e.kind)) return { error: 'Unknown kind' } as const;
  const db = getDb();
  const s = (x: string) => x.trim() || null;
  const values = {
    kind: e.kind, name: e.name.trim(), suburb: s(e.suburb), address: s(e.address), lat: e.lat, lng: e.lng,
    description: s(e.description), bookingUrl: s(e.bookingUrl), bookingPhone: s(e.bookingPhone),
    source: e.source.trim() || 'Roam Access pilot team', sourceUrl: s(e.sourceUrl), active: e.active, sort: e.sort,
  };
  if (e.id) {
    const [cur] = await db.select().from(facilities).where(and(eq(facilities.id, e.id), eq(facilities.layer, 'beach')));
    if (!cur) return { error: 'Unknown item' } as const;
    const details = { ...(cur.details || {}), features: e.features, mattingQuestion: e.mattingQuestion };
    await db.update(facilities).set({ ...values, details, updatedAt: new Date() }).where(eq(facilities.id, e.id));
    return { ok: true } as const;
  }
  const slug = e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';
  const id = `beach-${slug}-${Date.now().toString(36)}`;
  await db.insert(facilities).values({
    id, layer: 'beach', ...values,
    details: { features: e.features, mattingQuestion: e.mattingQuestion, sources: e.sourceUrl ? [{ label: values.source, url: e.sourceUrl }] : [] },
  });
  return { ok: true } as const;
}

export async function setReportHidden(id: string, hidden: boolean) {
  await getDb().update(tempBarriers).set({ hidden }).where(eq(tempBarriers.id, id));
}
