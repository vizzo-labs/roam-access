'use client';
// Shares one "Help fill the gaps" fetch between the prompt (Home, Thanks) and
// the screen, so opening the screen from the prompt shows the same places.

let cache = null; // { key, at, data }
const FRESH_MS = 60_000;

const keyFor = (origin, skip) => `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}|${skip.join(',')}`;

export async function fetchGaps(origin, skip = [], { fresh = false } = {}) {
  const key = keyFor(origin, skip);
  if (!fresh && cache && cache.key === key && Date.now() - cache.at < FRESH_MS) return cache.data;
  const q = new URLSearchParams({ lat: String(origin.lat), lng: String(origin.lng) });
  if (skip.length) q.set('skip', skip.join(','));
  const res = await fetch(`/api/gaps?${q}`);
  if (!res.ok) throw new Error(`${res.status} /api/gaps`);
  const data = await res.json();
  cache = { key, at: Date.now(), data };
  return data;
}

export function peekGaps(origin) {
  const key = keyFor(origin, []);
  return cache && cache.key === key && Date.now() - cache.at < FRESH_MS ? cache.data : null;
}

export function invalidateGaps() { cache = null; }
