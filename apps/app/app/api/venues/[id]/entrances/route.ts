import type { NextRequest } from 'next/server';
import { getUserId, unauthorized } from '@/lib/auth';
import { getVenueEntrances } from '@/lib/data/entrances';

// Getting there (I1): every step-free entrance marked for this place, best
// first, with who marked it (lived experience, never a name), its photo, and
// the viewer's own "Still the way in?" answer.
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/venues/[id]/entrances'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const entrances = await getVenueEntrances(id, userId);
  return Response.json({ entrances }, { headers: { 'Cache-Control': 'private, no-store' } });
}
