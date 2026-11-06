import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { ensureProfile } from '@/lib/data';
import { confirmArrivalSteps, getArrivalSteps } from '@/lib/data/arrival-steps';

// "This worked for me" on someone's arrival steps (one per person).
export async function POST(req: NextRequest, ctx: RouteContext<'/api/arrival/[id]'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body?.action !== 'confirm') return badRequest('action must be confirm');
  await ensureProfile(userId);
  const r = await confirmArrivalSteps(userId, id);
  if ('error' in r && r.error) return badRequest(r.error);
  return Response.json({ steps: await getArrivalSteps(r.venueId, userId) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
