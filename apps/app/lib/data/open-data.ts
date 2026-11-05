import 'server-only';
import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { A11YJSON_LICENSE, toPlaceInfo } from '../standards/a11yjson';
import { featureCounts } from '../venues';

const { venues, reviews, microAnswers } = schema;

/** Every active venue as A11yJSON PlaceInfo (public data only — see lib/standards/a11yjson.ts). */
export async function getOpenDataPlaces(baseUrl: string, id?: string) {
  const db = getDb();
  const vWhere = id ? and(eq(venues.active, true), eq(venues.id, id)) : eq(venues.active, true);
  const rWhere = id ? and(eq(reviews.hidden, false), eq(reviews.venueId, id)) : eq(reviews.hidden, false);
  const qWhere = id ? and(eq(microAnswers.hidden, false), eq(microAnswers.venueId, id)) : eq(microAnswers.hidden, false);
  const [vs, rs, qs] = await Promise.all([
    db.select().from(venues).where(vWhere).orderBy(venues.name),
    db.select().from(reviews).where(rWhere),
    db.select().from(microAnswers).where(qWhere),
  ]);
  const group = <T extends { venueId: string }>(xs: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of xs) m.set(x.venueId, [...(m.get(x.venueId) || []), x]);
    return m;
  };
  const rBy = group(rs), qBy = group(qs);
  return vs.map(v => {
    const vr = rBy.get(v.id) || [];
    return toPlaceInfo(v, featureCounts(vr, qBy.get(v.id) || []), vr.length, baseUrl);
  });
}

export const openDataMeta = (count: number) => ({
  ...A11YJSON_LICENSE,
  format: 'A11yJSON PlaceInfo (https://sozialhelden.github.io/a11yjson/)',
  source: 'Roam Access pilot — Manly & surrounds, NSW',
  note: 'Accessibility facts are included only when most community answers agree. OpenStreetMap accessibility tags are not repeated here — see OpenStreetMap.',
  count,
});
