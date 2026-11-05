import 'server-only';
import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { A11YJSON_LICENSE, toPlaceInfo } from '../standards/a11yjson';

const { venues, reviews } = schema;

/** Every active venue as A11yJSON PlaceInfo (public data only — see lib/standards/a11yjson.ts). */
export async function getOpenDataPlaces(baseUrl: string, id?: string) {
  const db = getDb();
  const vWhere = id ? and(eq(venues.active, true), eq(venues.id, id)) : eq(venues.active, true);
  const rWhere = id ? and(eq(reviews.hidden, false), eq(reviews.venueId, id)) : eq(reviews.hidden, false);
  const [vs, rs] = await Promise.all([
    db.select().from(venues).where(vWhere).orderBy(venues.name),
    db.select({ venueId: reviews.venueId, features: reviews.features }).from(reviews).where(rWhere),
  ]);
  const byVenue = new Map<string, { features: Record<string, 'yes' | 'no'> }[]>();
  for (const r of rs) byVenue.set(r.venueId, [...(byVenue.get(r.venueId) || []), r]);
  return vs.map(v => toPlaceInfo(v, byVenue.get(v.id) || [], baseUrl));
}

export const openDataMeta = (count: number) => ({
  ...A11YJSON_LICENSE,
  format: 'A11yJSON PlaceInfo (https://sozialhelden.github.io/a11yjson/)',
  source: 'Roam Access pilot — Manly & surrounds, NSW',
  note: 'Accessibility facts are included only when most community answers agree. OpenStreetMap accessibility tags are not repeated here — see OpenStreetMap.',
  count,
});
