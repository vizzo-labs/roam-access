// Getting there 2 (I2) — pure helpers for "Parking & transport nearby" and
// the arrival facility screen. No React. Pass the `t` from useT().

import { NEARBY_WALK_MINS } from '@/lib/arrival/places';
import { metres, walkMins } from '../layers/layerUtils';

/** The closest facility of these kinds (optionally passing `test`). */
export function nearestOf(facilities, from, kinds, test = () => true) {
  let best = null, bestM = Infinity;
  for (const f of facilities || []) {
    if (!kinds.includes(f.kind) || !test(f)) continue;
    const m = metres(from, f);
    if (m < bestM) { best = f; bestM = m; }
  }
  return best ? { facility: best, metres: bestM, mins: walkMins(from, best) } : null;
}

export const isNearby = n => !!n && n.mins <= NEARBY_WALK_MINS;

/** "150 m" / "1.2 km" — the straight-line distance, in the reader's language. */
export function distanceText(t, m) {
  return m < 1000 ? t('nearby.metres', { m: Math.max(10, Math.round(m / 10) * 10) }) : t('nearby.km', { km: (m / 1000).toFixed(1) });
}

/** Display name: OSM rarely names a parking bay or a taxi rank. */
export function arrivalName(t, f) {
  const d = f.details || {};
  if (f.kind === 'accessible_parking' && (!f.name || f.name === 'Accessible parking')) return t('nearby.name.parking');
  if (f.kind === 'drop_off' && (!f.name || f.name === 'Taxi rank' || f.name === 'Drop-off zone')) {
    return d.dropOff === 'taxi_rank' ? t('nearby.name.taxi') : t('nearby.name.dropOff');
  }
  return f.name;
}

/** Short listed details for a row: "3 spaces · Paid · 12 hours max". */
export function arrivalDetails(t, f) {
  const d = f.details || {};
  const out = [];
  if (f.kind === 'accessible_parking') {
    if (d.spaces) out.push(t('nearby.spaces', { count: d.spaces }));
    if (d.fee === 'yes') out.push(t('nearby.fee.yes'));
    if (d.fee === 'no') out.push(t('nearby.fee.no'));
  }
  if (f.kind === 'drop_off' && d.dropOff === 'taxi_rank') out.push(t('nearby.taxiHint'));
  if (f.kind === 'accessible_stop' || f.kind === 'wharf') {
    out.push(d.wheelchair === 'limited' ? t('nearby.wheelchair.limited') : t('nearby.wheelchair.yes'));
    if (d.ref) out.push(t('nearby.stopRef', { ref: d.ref }));
  }
  return out;
}

const gmaps = p => `${p.lat},${p.lng}`;
/** Directions: drive to the parking / drop-off; walk from a stop or wharf to the place. */
export function directionsHref(f, to) {
  if (f.kind === 'accessible_stop' || f.kind === 'wharf') {
    return `https://www.google.com/maps/dir/?api=1&origin=${gmaps(f)}&destination=${gmaps(to)}&travelmode=walking`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${gmaps(f)}`;
}
