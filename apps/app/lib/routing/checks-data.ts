import 'server-only';
// Getting there 6 · loads checks.json (OpenStreetMap kerbs, steps and incline
// tags per way id) once per server process, and again if the file changes
// (a tile rebuild). ~2 MB for Greater Sydney.
import fs from 'node:fs/promises';
import { checksPath } from './config';
import type { ChecksIndex } from './analyse';

type Raw = {
  osm_date?: string | null;
  x: Record<string, [string, number | null, number | null]>;
  s: number[];
  i: Record<string, string>;
};

let cached: { mtime: number; path: string; index: ChecksIndex } | null = null;

/** The index, or null when the file isn't there (routing then answers 503). */
export async function loadChecks(): Promise<ChecksIndex | null> {
  const p = checksPath();
  let mtime: number;
  try { mtime = (await fs.stat(p)).mtimeMs; } catch { return null; }
  if (cached && cached.path === p && cached.mtime === mtime) return cached.index;
  const raw = JSON.parse(await fs.readFile(p, 'utf8')) as Raw;
  const index: ChecksIndex = {
    osmDate: raw.osm_date ?? null,
    x: new Map(Object.entries(raw.x).map(([k, v]) => [Number(k), v])),
    s: new Set(raw.s),
    i: new Map(Object.entries(raw.i).map(([k, v]) => [Number(k), v])),
  };
  cached = { mtime, path: p, index };
  return index;
}
