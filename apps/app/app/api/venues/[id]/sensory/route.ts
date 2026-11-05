import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { getVenueVM } from '@/lib/data';
import { checkIn } from '@/lib/data/sensory';

// "How is it right now?" — a sensory check-in (noise, crowds, light). A new
// one within 2 hours replaces the person's previous check-in for the place.
export async function POST(req: NextRequest, ctx: RouteContext<'/api/venues/[id]/sensory'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('JSON body required');
  const result = await checkIn(userId, id, body);
  if ('error' in result) return badRequest(result.error!);
  return Response.json({ venue: await getVenueVM(id) }, { status: 201 });
}
