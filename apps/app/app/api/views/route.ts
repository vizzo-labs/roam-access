import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { ensureProfile } from '@/lib/data';
import { recordViews } from '@/lib/data/views';

// Anonymous counts for venue and council dashboards: { ids, kind: 'view' | 'search' }.
// The viewer's needs are read here, server-side, and only counted — never stored with an id.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null) as { ids?: unknown; kind?: unknown } | null;
  if (!body || !Array.isArray(body.ids) || (body.kind !== 'view' && body.kind !== 'search')) return badRequest('ids and kind required');
  const profile = await ensureProfile(userId);
  const n = await recordViews(body.ids.filter((x): x is string => typeof x === 'string'), body.kind, profile.needs);
  return Response.json({ ok: true, n });
}
