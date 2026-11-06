import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { getVenueVM } from '@/lib/data';
import { answerEntrance, getVenueEntrances } from '@/lib/data/entrances';

// "Still the way in? Yes / Changed" — never changes a verdict. A "Changed"
// stops directions going to this door until someone says "Yes" again.
export async function POST(req: NextRequest, ctx: RouteContext<'/api/entrances/[id]/answer'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const result = await answerEntrance(userId, id, body?.answer);
  if ('error' in result) return badRequest(result.error!);
  const [venue, entrances] = await Promise.all([getVenueVM(result.venueId), getVenueEntrances(result.venueId, userId)]);
  return Response.json({ venue, entrances }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
