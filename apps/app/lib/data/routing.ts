import 'server-only';
// Getting there 6 · what /api/route needs from the database: where the route
// should end (the community-marked step-free entrance, else the place's map
// point) and today's temporary reports (to avoid or flag). Read-only.

import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { getBestEntrances } from './entrances';
import { routable } from '../arrival/entrances';

const { venues, tempBarriers, facilities } = schema;

export type RouteTarget = {
  venue: { id: string; name: string; lat: number; lng: number };
  entrance: { lat: number; lng: number; kind: string } | null;
  venueReports: { type: string; date: string }[];
  facilityReports: { type: string; name: string; lat: number; lng: number; date: string }[];
};

export async function getRouteTarget(venueId: string): Promise<RouteTarget | null> {
  const db = getDb();
  const [v] = await db.select({ id: venues.id, name: venues.name, lat: venues.lat, lng: venues.lng })
    .from(venues).where(and(eq(venues.id, venueId), eq(venues.active, true)));
  if (!v || v.lat == null || v.lng == null) return null;
  const live = and(eq(tempBarriers.hidden, false), isNull(tempBarriers.resolvedAt), gt(tempBarriers.expiresAt, sql`now()`));
  const [best, vr, fr] = await Promise.all([
    getBestEntrances(venueId),
    db.select({ type: tempBarriers.type, at: tempBarriers.lastConfirmedAt }).from(tempBarriers)
      .where(and(live, eq(tempBarriers.targetType, 'venue'), eq(tempBarriers.targetId, venueId))),
    db.select({ type: tempBarriers.type, at: tempBarriers.lastConfirmedAt, name: facilities.name, lat: facilities.lat, lng: facilities.lng })
      .from(tempBarriers).innerJoin(facilities, eq(facilities.id, tempBarriers.targetId))
      .where(and(live, eq(tempBarriers.targetType, 'facility'), eq(facilities.active, true))),
  ]);
  const e = best.get(venueId);
  return {
    venue: { id: v.id, name: v.name, lat: Number(v.lat), lng: Number(v.lng) },
    // Only a community-marked entrance nobody has reported "Changed" (as Directions).
    entrance: routable(e) ? { lat: e.lat, lng: e.lng, kind: e.kind } : null,
    venueReports: vr.map(r => ({ type: r.type, date: r.at.toISOString() })),
    facilityReports: fr.map(r => ({ type: r.type, name: r.name, lat: r.lat, lng: r.lng, date: r.at.toISOString() })),
  };
}
