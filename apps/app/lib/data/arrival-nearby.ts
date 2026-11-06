import 'server-only';
// Getting there 4 (I4) — the public page's "Parking & transport nearby":
// accessible parking, drop-off points, stops and wharves (OpenStreetMap) and
// accessible toilets (National Public Toilet Map) around one place. Public
// open data only: no reports, no community content, nothing about people.

import { and, between, eq, inArray } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { ARRIVAL_LAYER } from '../arrival/places';

const { facilities } = schema;

export type NearbyListing = {
  id: string; kind: string; name: string; lat: number; lng: number;
  details: Record<string, unknown>; source: string; sourceUrl: string | null;
};

// About 3 km each way: more than the 40-minute walk a toilet may be listed at.
const LAT_PAD = 0.03;
const LNG_PAD = 0.036;

export async function getNearbyListings(at: { lat: number; lng: number }): Promise<NearbyListing[]> {
  const rows = await getDb().select({
    id: facilities.id, kind: facilities.kind, name: facilities.name, lat: facilities.lat, lng: facilities.lng,
    details: facilities.details, source: facilities.source, sourceUrl: facilities.sourceUrl,
  }).from(facilities).where(and(
    eq(facilities.active, true),
    inArray(facilities.layer, [ARRIVAL_LAYER, 'toilets']),
    between(facilities.lat, at.lat - LAT_PAD, at.lat + LAT_PAD),
    between(facilities.lng, at.lng - LNG_PAD, at.lng + LNG_PAD),
  ));
  return rows;
}
