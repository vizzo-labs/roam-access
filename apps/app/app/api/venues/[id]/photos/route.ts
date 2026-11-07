import type { NextRequest } from 'next/server';
import { getUserId, unauthorized } from '@/lib/auth';
import { getVenuePhotos } from '@/lib/data/photos';
import { getPublicVenuePhotos } from '@/lib/data/owners';

// Community photos (from reviews) and, separately, photos from the venue.
// The app always shows the venue's after the community's, labelled "From the venue".
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/venues/[id]/photos'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const [photos, venuePhotos] = await Promise.all([getVenuePhotos(id, userId), getPublicVenuePhotos(id)]);
  return Response.json({ photos, venuePhotos }, { headers: { 'Cache-Control': 'private, no-store' } });
}
