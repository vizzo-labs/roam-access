// Picks the most valuable missing fact per place for one tester: "3 places
// near you need one quick answer". Pure: the data module feeds it rows.
//
// Value, highest first: a question about the tester's own needs; nobody has
// answered it yet (or OpenStreetMap claims something nobody has confirmed);
// answers disagree; only one person has answered. Closer places win ties.
// Questions with two or more agreeing answers are already settled — skipped.

import { FEATURE_IDS, RA2_NEEDS, type FeatureId, type NeedId } from '../pilot-data';
import type { FeatureCount } from '../venues';
import { QUICK_QUESTIONS, helpsWho } from './questions';

export type GapStatus = 'none' | 'unconfirmed' | 'mixed' | 'one';

export type GapTask = {
  venueId: string; name: string; kind: string; area: string; mins: number;
  feature: FeatureId; question: string; helps: string; status: GapStatus; hint: string;
};

type GapVenue = {
  id: string; name: string; kind: string; suburb: string | null;
  lat: number; lng: number; osmTags: Record<string, string>;
};

// OpenStreetMap tags the honesty rule surfaces as "not yet confirmed".
const OSM_TAG: Partial<Record<FeatureId, string>> = {
  stepfree: 'wheelchair', bathroom: 'toilets:wheelchair', hearing: 'hearing_loop',
};
const OSM_WORD: Record<string, string> = { yes: 'yes', limited: 'partly', no: 'no' };
// With no needs set, ask what helps the most people first.
const DEFAULT_ORDER: FeatureId[] = ['stepfree', 'bathroom', 'seats', 'quiet', 'simple', 'calm', 'hearing', 'vision'];
const MAX_WALK_MINS = 25;

export function walkMins(o: { lat: number; lng: number }, v: { lat: number; lng: number }) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (v.lat - o.lat) * rad, dLng = (v.lng - o.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(o.lat * rad) * Math.cos(v.lat * rad) * Math.sin(dLng / 2) ** 2;
  const m = 2 * R * Math.asin(Math.sqrt(h));
  return Math.max(1, Math.round((m * 1.25) / 80)); // same as the app: +25% for streets, 80 m/min
}

export function pickGaps(input: {
  venues: GapVenue[];
  counts: Map<string, Map<FeatureId, FeatureCount>>;
  answered: Set<string>;            // `${venueId}:${feature}` this tester already answered
  skip?: Set<string>;               // same keys, skipped in this session
  needs: string[];
  origin: { lat: number; lng: number };
  limit?: number;
}): GapTask[] {
  const { venues, counts, answered, skip = new Set(), needs, origin, limit = 3 } = input;
  const mine = new Set(RA2_NEEDS.filter(n => needs.includes(n.id as NeedId)).flatMap(n => n.tags));
  const order = mine.size
    ? [...DEFAULT_ORDER.filter(f => mine.has(f)), ...DEFAULT_ORDER.filter(f => !mine.has(f))]
    : DEFAULT_ORDER;

  const best: (GapTask & { score: number })[] = [];
  for (const v of venues) {
    const mins = walkMins(origin, v);
    if (mins > MAX_WALK_MINS) continue;
    const vc = counts.get(v.id);
    let top: (GapTask & { score: number }) | null = null;
    for (const [i, f] of order.entries()) {
      if (!FEATURE_IDS.includes(f)) continue;
      const key = `${v.id}:${f}`;
      if (answered.has(key) || skip.has(key)) continue;
      const c = vc?.get(f);
      const total = c ? c.yes + c.no : 0;
      const osm = OSM_TAG[f] ? v.osmTags?.[OSM_TAG[f]!] : undefined;
      let status: GapStatus, hint: string, value: number;
      if (!total && osm && OSM_WORD[osm]) {
        status = 'unconfirmed'; value = 32;
        hint = `OpenStreetMap says “${OSM_WORD[osm]}”, but nobody has confirmed it yet.`;
      } else if (!total) {
        status = 'none'; value = 30; hint = 'Nobody has answered this yet.';
      } else if (c!.yes === c!.no) {
        status = 'mixed'; value = 25; hint = `People disagree so far: ${c!.yes} yes, ${c!.no} no.`;
      } else if (total === 1) {
        status = 'one'; value = 10; hint = 'Only one person has answered so far.';
      } else continue; // settled
      const score = (mine.has(f) ? 100 : 40) + value + (vc ? 0 : 5) - i - mins / 2;
      if (!top || score > top.score) {
        top = {
          venueId: v.id, name: v.name, kind: v.kind, area: v.suburb || 'Manly', mins,
          feature: f, question: QUICK_QUESTIONS[f], helps: helpsWho(f), status, hint, score,
        };
      }
    }
    if (top) best.push(top);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return best.sort((a, b) => b.score - a.score).slice(0, limit).map(({ score, ...t }) => t);
}
