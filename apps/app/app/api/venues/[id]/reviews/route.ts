import type { NextRequest } from 'next/server';
import { getUserId, unauthorized } from '@/lib/auth';
import { getVenueReviews } from '@/lib/data';
import { getPhotosByReview } from '@/lib/data/photos';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/venues/[id]/reviews'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const reviews = await getVenueReviews(id, userId);
  const photos = await getPhotosByReview(reviews.map(r => r.id), userId);
  return Response.json(
    { reviews: reviews.map(r => ({ ...r, photos: photos.get(r.id) || [] })) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
