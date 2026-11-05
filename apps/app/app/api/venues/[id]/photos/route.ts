import type { NextRequest } from 'next/server';
import { getUserId, unauthorized } from '@/lib/auth';
import { getVenuePhotos } from '@/lib/data/photos';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/venues/[id]/photos'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  return Response.json({ photos: await getVenuePhotos(id, userId) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
