// The 2–3 access facts a preview card shows for one person: one line per
// access feature that touches their needs, each with a state in words —
// "Step-free · Yes", "Accessible loo · No", "Hearing loop · Unconfirmed".
// Pure: it reads the venue view model (lib/venues.ts) and never changes a
// verdict. OpenStreetMap hints are always 'unconfirmed' (honesty rule).

import { RA2_NEEDS, type FeatureId } from '../pilot-data';

export type KeyFactState = 'yes' | 'no' | 'mixed' | 'alt' | 'unconfirmed';
export type KeyFact = { feature: FeatureId; state: KeyFactState };

type FactLike = { tags: string[]; src: string; kind?: string };
type VenueLike = { works: FactLike[]; check: FactLike[]; barriers: FactLike[] };

// Same order as "Help fill the gaps": what helps the most people first.
export const KEY_FACT_ORDER: FeatureId[] = ['stepfree', 'bathroom', 'seats', 'quiet', 'simple', 'calm', 'hearing', 'vision'];

/** The features that matter to someone with these needs (all of them if none set). */
export function featuresFor(needIds: string[]): FeatureId[] {
  const mine = new Set(RA2_NEEDS.filter(n => needIds.includes(n.id)).flatMap(n => n.tags));
  return mine.size ? KEY_FACT_ORDER.filter(f => mine.has(f)) : KEY_FACT_ORDER;
}

function stateOf(v: VenueLike, f: FeatureId): KeyFactState | null {
  const about = (list: FactLike[], kinds: string[], src?: string) =>
    list.some(x => x.tags.includes(f) && kinds.includes(x.kind || '') && (!src || x.src === src));
  const no = about(v.barriers, ['absence'], 'community') || about(v.check, ['absence'], 'community');
  const yes = about(v.works, ['feature'], 'community');
  const altWayIn = about(v.works, ['entrance'], 'community');
  if (about(v.check, ['mixed'], 'community')) return 'mixed';
  if (yes) return 'yes';
  if (no && altWayIn) return 'alt';   // a step at the main door, a step-free way in elsewhere
  if (altWayIn) return 'yes';
  if (no) return 'no';
  if (about(v.check, ['hint'], 'osm')) return 'unconfirmed';
  return null;
}

/** Up to `max` key facts for this person, barriers first so they're never cut. */
export function keyFacts(venue: VenueLike, needIds: string[], max = 3): KeyFact[] {
  const rank: Record<KeyFactState, number> = { no: 0, alt: 1, mixed: 2, yes: 3, unconfirmed: 4 };
  const out: KeyFact[] = [];
  for (const feature of featuresFor(needIds)) {
    const state = stateOf(venue, feature);
    if (state) out.push({ feature, state });
  }
  return out.map((x, i) => ({ x, i }))
    .sort((a, b) => rank[a.x.state] - rank[b.x.state] || a.i - b.i)
    .slice(0, max).map(({ x }) => x);
}

/** The one question to ask about a place with no info for this person yet. */
export function firstQuestion(venue: VenueLike, needIds: string[]): FeatureId {
  return featuresFor(needIds).find(f => !stateOf(venue, f)) || featuresFor(needIds)[0];
}
