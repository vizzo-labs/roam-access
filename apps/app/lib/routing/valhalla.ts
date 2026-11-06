import 'server-only';
// Getting there 6 · a thin client for our own Valhalla server (never a public
// one): pedestrian costing with type "wheelchair", or "foot" to find how close
// a route without steps can get. Server-side only; the URL is never sent to
// the browser.
import { valhallaUrl } from './config';
import type { LngLat } from './types';
import type { VEdge, VManeuver } from './analyse';

export type VLeg = {
  shape: string; elevation?: number[]; maneuvers: VManeuver[]; summary: { length: number; time: number };
};
export type VTrip = { legs: VLeg[]; summary: { length: number; time: number } };
export class NoRoute extends Error {}

const TIMEOUT_MS = 8000;

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const base = valhallaUrl();
  if (!base) throw new Error('VALHALLA_URL is not set');
  const res = await fetch(`${base}/${endpoint}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 442 no path · 171 no suitable edges near a location · 154/443 too far or unreachable
    if ([442, 171, 154, 443, 170].includes(json?.error_code)) throw new NoRoute(String(json.error || json.error_code));
    throw new Error(`Valhalla ${endpoint} ${res.status}: ${json?.error || ''}`);
  }
  return json as T;
}

const costing = (type: 'wheelchair' | 'foot') => ({ costing: 'pedestrian', costing_options: { pedestrian: { type } } });

export async function routeTrips(from: LngLat, to: LngLat, opts: {
  type?: 'wheelchair' | 'foot'; excludePolygons?: LngLat[][]; excludeLocations?: LngLat[]; alternates?: number;
} = {}): Promise<VTrip[]> {
  const body: Record<string, unknown> = {
    locations: [{ lon: from[0], lat: from[1] }, { lon: to[0], lat: to[1] }],
    ...costing(opts.type || 'wheelchair'), units: 'km', elevation_interval: 10,
    directions_options: { units: 'kilometers' },
  };
  if (opts.alternates) body.alternates = opts.alternates;
  if (opts.excludePolygons?.length) body.exclude_polygons = opts.excludePolygons;
  if (opts.excludeLocations?.length) body.exclude_locations = opts.excludeLocations.map(([lon, lat]) => ({ lon, lat }));
  const r = await post<{ trip: VTrip; alternates?: { trip: VTrip }[] }>('route', body);
  return [r.trip, ...(r.alternates || []).map(a => a.trip)];
}

export async function edgesFor(encodedShape: string, type: 'wheelchair' | 'foot' = 'wheelchair'): Promise<{ edges: VEdge[]; shape?: string }> {
  return post('trace_attributes', {
    encoded_polyline: encodedShape, ...costing(type), shape_match: 'edge_walk',
    filters: {
      attributes: ['edge.way_id', 'edge.length', 'edge.use', 'edge.surface', 'edge.names', 'edge.begin_shape_index', 'edge.end_shape_index', 'edge.max_upward_grade', 'edge.max_downward_grade', 'shape'],
      action: 'include',
    },
  });
}

export async function status(): Promise<boolean> {
  const base = valhallaUrl();
  if (!base) return false;
  try { return (await fetch(`${base}/status`, { signal: AbortSignal.timeout(2000), cache: 'no-store' })).ok; } catch { return false; }
}
