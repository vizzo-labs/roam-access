import 'server-only';
// Getting there 6 · in-memory cache and per-person rate limit for /api/route.
// One server process (local dev, or one small routing box) — fine for the
// pilot. A bigger deployment would move both to Redis or the database.

const TTL_MS = 15 * 60_000;
const MAX_ENTRIES = 500;
const cache = new Map<string, { at: number; value: unknown }>();

export function cacheGet<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) { cache.delete(key); return null; }
  cache.delete(key); cache.set(key, hit); // most recently used last
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown) {
  cache.set(key, { at: Date.now(), value });
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
}

/** Routes computed (cache misses) per person: 12 a minute, 300 a day. */
export const RATE = { perMinute: 12, perDay: 300 };
const hits = new Map<string, number[]>();

/** Records a request and says whether it's allowed; `retryAfter` in seconds. */
export function takeToken(userId: string, now = Date.now()): { ok: true } | { ok: false; retryAfter: number } {
  const day = 86_400_000;
  const list = (hits.get(userId) || []).filter(t => now - t < day);
  const lastMinute = list.filter(t => now - t < 60_000);
  if (lastMinute.length >= RATE.perMinute) return { ok: false, retryAfter: Math.ceil((60_000 - (now - lastMinute[0])) / 1000) };
  if (list.length >= RATE.perDay) return { ok: false, retryAfter: Math.ceil((day - (now - list[0])) / 1000) };
  list.push(now);
  hits.set(userId, list);
  return { ok: true };
}
