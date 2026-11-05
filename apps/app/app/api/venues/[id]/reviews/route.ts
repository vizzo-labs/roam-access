import type { NextRequest } from 'next/server';
import { getUserId, unauthorized } from '@/lib/auth';
import { getVenueReviews } from '@/lib/data';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/venues/[id]/reviews'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  return Response.json({ reviews: await getVenueReviews(id, userId) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
