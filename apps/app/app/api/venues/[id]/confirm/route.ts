import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { getVenueVM } from '@/lib/data';
import { confirmVenue } from '@/lib/data/trust';

// "Still accurate? Yes" — refreshes the place's "Last confirmed" date.
export async function POST(_req: NextRequest, ctx: RouteContext<'/api/venues/[id]/confirm'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const result = await confirmVenue(userId, id);
  if ('error' in result) return badRequest(result.error!);
  return Response.json({ venue: await getVenueVM(id) }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
