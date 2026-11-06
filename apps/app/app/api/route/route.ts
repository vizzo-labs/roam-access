import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { getRouteTarget } from '@/lib/data/routing';
import { PILOT_AREA } from '@/lib/pilot-data';
import { loadChecks } from '@/lib/routing/checks-data';
import { valhallaUrl } from '@/lib/routing/config';
import { metresBetween } from '@/lib/routing/geo';
import { cacheGet, cacheSet, takeToken } from '@/lib/routing/limits';
import { planRoute } from '@/lib/routing/plan';
import type { RouteFrom, RouteVM } from '@/lib/routing/types';

// Getting there 6 · GET /api/route?venue=<id>[&from=lat,lng]
// "Route avoiding mapped steps" from the person's location (or Manly Wharf)
// to the place's step-free entrance. Only when VALHALLA_URL is set (local
// `npm run dev:routing`); otherwise 404 and the venue page hides the feature.
//
// Never changes a verdict. The route is OpenStreetMap data, not checked by
// people. The person's location is used for this request only: it isn't
// stored or logged (the cache key rounds it to ~10 m and lives in memory).

const MAX_FROM_PILOT_M = 15000;   // same pilot radius as "use my location"
const MAX_TRIP_M = 10000;

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', ...extra } });

export async function GET(req: NextRequest) {
  if (!valhallaUrl()) return json({ error: 'Routing is not available here' }, 404);
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const q = req.nextUrl.searchParams;
  const venueId = q.get('venue');
  if (!venueId || venueId.length > 100) return badRequest('venue required');
  let from: RouteFrom = { lat: PILOT_AREA.origin.lat, lng: PILOT_AREA.origin.lng, kind: 'wharf' };
  const raw = q.get('from');
  if (raw) {
    const [lat, lng] = raw.split(',').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return badRequest('from must be lat,lng');
    from = { lat, lng, kind: 'me' };
    if (metresBetween([lng, lat], [PILOT_AREA.origin.lng, PILOT_AREA.origin.lat]) > MAX_FROM_PILOT_M) {
      return json({ error: 'outside', message: 'Routes start inside the pilot area' }, 422);
    }
  }

  const index = await loadChecks();
  if (!index) return json({ error: 'Routing checks are not set up (checks.json missing)' }, 503);
  const target = await getRouteTarget(venueId);
  if (!target) return json({ error: 'Place not found' }, 404);

  const to = target.entrance ?? target.venue;
  if (metresBetween([from.lng, from.lat], [to.lng, to.lat]) > MAX_TRIP_M) return json({ error: 'tooFar' }, 422);

  // Cached by place, end point, start (rounded to ~10 m) and today's reports.
  const reports = [...target.venueReports, ...target.facilityReports].map(r => `${r.type}@${r.date}`).sort().join(';');
  const key = [venueId, to.lat, to.lng, from.kind, from.lat.toFixed(4), from.lng.toFixed(4), reports, index.osmDate].join('|');
  const hit = cacheGet<RouteVM>(key);
  if (hit) return json({ route: { ...hit, from } }, 200, { 'X-Route-Cache': 'hit' });

  const allowed = takeToken(userId);
  if (!allowed.ok) return json({ error: 'rateLimited' }, 429, { 'Retry-After': String(allowed.retryAfter) });

  try {
    const route = await planRoute(target, from, index);
    cacheSet(key, route);
    return json({ route }, 200, { 'X-Route-Cache': 'miss' });
  } catch (e) {
    // Never log the location; only that the router failed.
    console.error('[route] routing failed:', e instanceof Error ? e.message.slice(0, 200) : 'unknown');
    return json({ error: 'unavailable' }, 502);
  }
}
