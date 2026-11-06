import 'server-only';
// Getting there 6 · is step-free routing switched on here?
//
// Only when VALHALLA_URL is set (local: `npm run dev:routing`). Production has
// no routing server yet, so /api/route answers 404 there and the UI hides the
// feature. VALHALLA_CHECKS points at the checks.json built next to the tiles
// by scripts/routing/prepare-extract.py.
import os from 'node:os';
import path from 'node:path';

export function valhallaUrl(): string | null {
  const u = (process.env.VALHALLA_URL || '').trim().replace(/\/+$/, '');
  return u || null;
}

export function checksPath(): string {
  const p = (process.env.VALHALLA_CHECKS || '').trim();
  if (p) return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
  return path.join(os.homedir(), 'Vizzo', 'valhalla-data', process.env.VALHALLA_REGION || 'greater-sydney', 'checks.json');
}
