import type { NextRequest } from 'next/server';
import { getUserId, isAdmin } from '@/lib/auth';
import { getVenuePhotoRow } from '@/lib/data/owners';
import { readPhoto } from '@/lib/data/photos';
import { managesVenue } from '@/lib/roles';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => new Response('Not found', { status: 404 });

// Photos from the venue are public (no sign-in), unlike review photos — but
// the files are still in the private Blob store and only served from here,
// so a photo the pilot team hides is really gone. The venue's staff and
// admins still see a hidden one (to know what was hidden).
export async function GET(req: NextRequest, ctx: RouteContext<'/api/venue-photos/[id]'>) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return notFound();
  const photo = await getVenuePhotoRow(id);
  if (!photo) return notFound();
  if (photo.hidden) {
    const userId = await getUserId();
    if (!(await managesVenue(userId, photo.venueId)) && !(await isAdmin())) return notFound();
  }
  const thumb = req.nextUrl.searchParams.get('size') === 'thumb';
  const blob = await readPhoto(thumb ? photo.thumbPathname : photo.pathname);
  if (!blob) return notFound();
  return new Response(blob.stream, {
    headers: {
      'Content-Type': 'image/jpeg',
      // Hidden photos must stop showing soon: short, and never shared for hidden ones.
      'Cache-Control': photo.hidden ? 'private, no-store' : 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
