// "Does the community know anything about this place for this need?" —
// the definition of a gap, shared by the council dashboard, the venue
// dashboard and the export. Only community reviews count: OpenStreetMap tags
// are unconfirmed and never close a gap.

import { RA2_NEEDS, type NeedId } from '../pilot-data';

type R = { needs: string[]; features: Record<string, string> | null };

export function coversNeed(r: R, need: NeedId) {
  const n = RA2_NEEDS.find(x => x.id === need)!;
  if (r.needs.includes(need)) return true; // someone with this need reviewed it
  return n.tags.some(t => r.features?.[t] === 'yes' || r.features?.[t] === 'no');
}

export const coveredNeeds = (reviews: R[]) =>
  new Set(RA2_NEEDS.map(n => n.id).filter(id => reviews.some(r => coversNeed(r, id))));
