// Getting there (I1) — the step-free entrance. Shared by server and client:
// plain data and pure functions only.
//
// Honesty: an entrance tells people which door to use. It never changes a
// verdict, and an OpenStreetMap entrance is always "unconfirmed" — directions
// only ever go to an entrance the community marked and nobody has since
// said "Changed".
import type { EntranceKind, EntranceLocatedBy, EntranceSource } from '../db/schema-arrival';
import type { EntranceAlt } from '../db/schema';

export const ENTRANCE_KINDS: EntranceKind[] = ['main', 'side', 'back', 'lift', 'other'];

/** "Yes, at the back" in the review form → the entrance kind. */
export const kindFromAlt = (alt: EntranceAlt | null | undefined): EntranceKind | null =>
  alt && alt !== 'none' ? alt : null;

/** A pin further than this from the place is almost certainly a mistake. */
export const MAX_ENTRANCE_DISTANCE_M = 300;
export { ENTRANCE_NOTE_MAX } from '../trust/entrance';

/** What the app needs about an entrance (bootstrap, venue page, public page). */
export type EntranceVM = {
  id: string;
  source: EntranceSource;
  kind: EntranceKind;
  lat: number | null; lng: number | null;
  locatedBy: EntranceLocatedBy | null;
  note: string | null;
  at: string;                 // when it was marked
  yes: number;                // "Still the way in? Yes" (not counting the marker)
  lastYes: string | null;
  changed: number;
  lastChanged: string | null;
  status: 'current' | 'changed';
  // Venue page only (GET /api/venues/[id]/entrances):
  whoNeed?: string | null; whoMore?: number;
  mine?: boolean; myAnswer?: 'yes' | 'changed' | null;
  photo?: EntrancePhoto | null;
};

export type EntrancePhoto = {
  id: string; kind: 'entrance'; alt: string; src: string; thumb: string;
  width: number; height: number; whoNeed: string | null; whoMore: number; at: string;
};

/** "Changed" after the newest of (marked, last "Yes") → don't route there. */
export function entranceStatus(at: string | Date, lastYes: string | Date | null, lastChanged: string | Date | null): 'current' | 'changed' {
  if (!lastChanged) return 'current';
  const fresh = Math.max(+new Date(at), lastYes ? +new Date(lastYes) : 0);
  return +new Date(lastChanged) > fresh ? 'changed' : 'current';
}

/** The newest sign of life: marked, or the last "Yes". */
export const entranceLast = (e: Pick<EntranceVM, 'at' | 'lastYes'>) =>
  e.lastYes && +new Date(e.lastYes) > +new Date(e.at) ? e.lastYes : e.at;

/** Directions may go here: community-marked, on the map, not reported changed. */
export const routable = (e: EntranceVM | null | undefined): e is EntranceVM & { lat: number; lng: number } =>
  !!e && e.source === 'community' && e.status === 'current' && e.lat != null && e.lng != null;

/** Best first: community, still current, has a point, most confirmations, newest. */
export function rankEntrances<T extends EntranceVM>(list: T[]): T[] {
  const score = (e: T) => [
    e.source === 'community' ? 1 : 0, e.status === 'current' ? 1 : 0,
    e.lat != null ? 1 : 0, e.yes, +new Date(entranceLast(e)),
  ];
  return [...list].sort((a, b) => {
    const x = score(a), y = score(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] - x[i];
    return 0;
  });
}

// ── Geometry ────────────────────────────────────────────────────────────────
const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Metres between two points (haversine). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type Compass = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
const COMPASS: Compass[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

/** Which way b is from a, as one of 8 compass points. */
export function compass(a: { lat: number; lng: number }, b: { lat: number; lng: number }): Compass {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return COMPASS[Math.round(deg / 45) % 8];
}

/** Move a point by metres north / east. */
export function offset(p: { lat: number; lng: number }, north: number, east: number) {
  return {
    lat: p.lat + (north / R) * (180 / Math.PI),
    lng: p.lng + (east / (R * Math.cos(rad(p.lat)))) * (180 / Math.PI),
  };
}

/** Rounded for speech: "about 40 m" (5 m steps under 100, then 10s). */
export const roundM = (m: number) => (m < 100 ? Math.max(5, Math.round(m / 5) * 5) : Math.round(m / 10) * 10);

// ── Directions (deep links) ─────────────────────────────────────────────────
export type MapsApp = 'apple' | 'google';

/** Apple Maps on iPhone / iPad, Google Maps everywhere else. */
export function defaultMapsApp(ua: string, touchMac = false): MapsApp {
  return /iPhone|iPad|iPod/.test(ua) || touchMac ? 'apple' : 'google';
}

/** Turn-by-turn directions to a point, in the chosen app. */
export function directionsUrl(app: MapsApp, p: { lat: number; lng: number }) {
  const ll = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  return app === 'apple'
    ? `https://maps.apple.com/?daddr=${ll}`
    : `https://www.google.com/maps/dir/?api=1&destination=${ll}`;
}

/** People whose needs make the step-free door the default destination. */
export const STEP_FREE_NEEDS = ['mobility'];
