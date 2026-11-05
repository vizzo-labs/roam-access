import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { ensureProfile } from '@/lib/data';
import { recordViews } from '@/lib/data/views';

// Anonymous counts for venue and council dashboards: { ids, kind: 'view' | 'search' }.
// The viewer's needs are read here, server-side, and only counted. One count
// per person per place per kind per day; bursts get 429 (lib/data/views.ts).
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null) as { ids?: unknown; kind?: unknown } | null;
  if (!body || !Array.isArray(body.ids) || (body.kind !== 'view' && body.kind !== 'search')) return badRequest('ids and kind required');
  const profile = await ensureProfile(userId);
  const r = await recordViews(userId, body.ids.filter((x): x is string => typeof x === 'string'), body.kind, profile.needs);
  if (r.limited) return Response.json({ error: 'Too many requests — slow down.' }, { status: 429, headers: { 'Retry-After': '60' } });
  return Response.json({ ok: true, counted: r.counted });
}
