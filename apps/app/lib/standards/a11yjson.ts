// Public venue data as A11yJSON PlaceInfo (https://sozialhelden.github.io/a11yjson/),
// the format of accessibility.cloud and Wheelmap. Documented in docs/standards.md.
//
// Only public data: the place (from OpenStreetMap) and facts confirmed by a
// majority of community answers. Never review text, reviewer needs, names,
// "Venue says" content, or OpenStreetMap accessibility tags (those are already
// in OSM and unconfirmed here). Licence: ODbL 1.0, like the OSM data it builds on.

import type { Review, Venue } from '../db/schema';
import { RA2_FEATURES, type FeatureId } from '../pilot-data';
import { osmNoteUrl } from './osm';

export const A11YJSON_LICENSE = {
  license: 'ODbL-1.0',
  licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
  attribution: 'Place data © OpenStreetMap contributors (openstreetmap.org/copyright). Accessibility facts © Roam Access community reviewers. Both under the Open Database License (ODbL) 1.0.',
};

// OSM-ish category ids (accessibility.cloud uses the same vocabulary).
const CATEGORY: Record<string, string> = {
  Restaurant: 'restaurant', Cafe: 'cafe', Takeaway: 'fast_food', Bar: 'bar', Pub: 'pub', 'Ice cream': 'ice_cream',
  Park: 'park', Beach: 'beach', 'Nature reserve': 'nature_reserve', 'Ocean pool': 'swimming_pool', 'Swimming pool': 'swimming_pool',
  Garden: 'garden', Library: 'library', Gallery: 'gallery', 'Arts centre': 'arts_centre', Hotel: 'hotel', Motel: 'motel', Hostel: 'hostel',
};

// A11yJSON LocalizedString: { language tag: text }.
const en = (text: string) => ({ en: text });

type Answer = 'yes' | 'no' | 'mixed';

/** Majority community answer per review question (ties = mixed). */
export function communityAnswers(reviews: Pick<Review, 'features'>[]) {
  const out: Partial<Record<FeatureId, { answer: Answer; yes: number; no: number }>> = {};
  for (const f of RA2_FEATURES) {
    let yes = 0, no = 0;
    for (const r of reviews) { const v = r.features?.[f.id]; if (v === 'yes') yes++; else if (v === 'no') no++; }
    if (!yes && !no) continue;
    out[f.id] = { answer: yes > no ? 'yes' : no > yes ? 'no' : 'mixed', yes, no };
  }
  return out;
}

export function toPlaceInfo(v: Venue, reviews: Pick<Review, 'features'>[], baseUrl: string) {
  const a = communityAnswers(reviews);
  const ans = (id: FeatureId) => a[id]?.answer;
  const bool = (id: FeatureId) => (ans(id) === 'yes' ? true : ans(id) === 'no' ? false : undefined);

  const accessibility: Record<string, unknown> = {};
  // Step-free way in: we don't know if it's level or ramped, so "yes" maps to
  // partial wheelchair access, and "no" to a stepped entrance.
  if (ans('stepfree') === 'no') {
    accessibility.entrances = [{ properties: { isLevel: false, hasFixedRamp: false } }];
    accessibility.wheelchairAccessibilityGrade = 'not';
  } else if (ans('stepfree') === 'yes') {
    accessibility.wheelchairAccessibilityGrade = ans('bathroom') === 'yes' ? 'fully' : 'partially';
  }
  if (bool('bathroom') !== undefined) accessibility.restrooms = [{ isAccessibleWithWheelchair: bool('bathroom') }];
  if (bool('quiet') !== undefined) accessibility.isQuiet = bool('quiet');

  // Roam Access questions with no exact A11yJSON field travel as namespaced tags.
  const tags: Record<string, string> = { 'roam:community_reviews': String(reviews.length) };
  for (const f of RA2_FEATURES) {
    const x = a[f.id];
    if (x) tags[`roam:${f.id}`] = `${x.answer} (${x.yes} yes, ${x.no} no)`;
  }

  const properties: Record<string, unknown> = {
    name: en(v.name),
    category: CATEGORY[v.kind] ?? 'place',
    address: { text: en([v.address, v.suburb || 'Manly'].filter(Boolean).join(', ')), city: en(v.suburb || 'Manly'), state: en('New South Wales'), stateCode: 'NSW', countryCode: 'AUS' },
    description: en(reviews.length
      ? `Accessibility from ${reviews.length} Roam Access community review${reviews.length === 1 ? '' : 's'} by people with disability. Only majority-confirmed facts are included.`
      : 'No Roam Access community reviews yet.'),
    sourceId: 'roam-access',
    originalId: v.id,
    ids: { osm: `${v.osmType}/${v.osmId}` },
    sameAs: [`https://www.openstreetmap.org/${v.osmType}/${v.osmId}`],
    infoPageUrl: `${baseUrl}/#/venue/${encodeURIComponent(v.id)}`,
    editPageUrl: osmNoteUrl(v.lat, v.lng),
    tags,
  };
  if (v.phone) properties.phoneNumber = v.phone;
  if (v.website && /^https?:\/\//.test(v.website)) properties.placeWebsiteUrl = v.website;
  if (Object.keys(accessibility).length) properties.accessibility = accessibility;

  return {
    geometry: { type: 'Point' as const, coordinates: [v.lng, v.lat] as [number, number] },
    properties,
  };
}
