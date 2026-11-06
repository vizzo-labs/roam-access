// Getting there 6 · small geometry helpers for routes (pure).
import type { LngLat } from './types';

/** Valhalla's encoded polyline (precision 6) → [lng, lat][]. */
export function decodePolyline(str: string, precision = 6): LngLat[] {
  let index = 0, lat = 0, lng = 0;
  const out: LngLat[] = [];
  const f = 10 ** precision;
  while (index < str.length) {
    for (const which of [0, 1]) {
      let shift = 0, result = 0, b: number;
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d; else lng += d;
    }
    out.push([lng / f, lat / f]);
  }
  return out;
}

/** Metres between two [lng, lat] points. */
export function metresBetween([lng1, lat1]: LngLat, [lng2, lat2]: LngLat) {
  const p = Math.PI / 180;
  const x = Math.sin((lat2 - lat1) * p / 2) ** 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin((lng2 - lng1) * p / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(x));
}

/** Cumulative distance (m) at each vertex. */
export function cumulative(shape: LngLat[]) {
  const cum = [0];
  for (let i = 1; i < shape.length; i++) cum.push(cum[i - 1] + metresBetween(shape[i - 1], shape[i]));
  return cum;
}

/** Shortest distance (m) from a point to a polyline (flat-earth, fine at street scale). */
export function distanceToLine(pt: LngLat, line: LngLat[]) {
  if (!line.length) return Infinity;
  const k = Math.cos(pt[1] * Math.PI / 180) * 111320, kl = 110540;
  const P = [pt[0] * k, pt[1] * kl];
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const A = [line[i - 1][0] * k, line[i - 1][1] * kl], B = [line[i][0] * k, line[i][1] * kl];
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / len)) : 0;
    best = Math.min(best, Math.hypot(P[0] - (A[0] + t * dx), P[1] - (A[1] + t * dy)));
  }
  return best;
}

/** A square ring of ±`half` metres around a point (Valhalla exclude_polygons). */
export function boxAround([lng, lat]: LngLat, half: number): LngLat[] {
  const dLat = half / 110540, dLng = half / (111320 * Math.cos(lat * Math.PI / 180));
  return [[lng - dLng, lat - dLat], [lng + dLng, lat - dLat], [lng + dLng, lat + dLat], [lng - dLng, lat + dLat], [lng - dLng, lat - dLat]];
}

export const round = (n: number, d = 6) => Math.round(n * 10 ** d) / 10 ** d;
