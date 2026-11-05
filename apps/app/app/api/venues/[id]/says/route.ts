import type { NextRequest } from 'next/server';
import { getUserId, unauthorized } from '@/lib/auth';
import { getVenueSays } from '@/lib/data/business';

// "Venue says" for one place: whether it's claimed, its access statement and
// its public replies to reviews. Shown apart from community facts; never
// changes a verdict.
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/venues/[id]/says'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  return Response.json(await getVenueSays(id), { headers: { 'Cache-Control': 'private, no-store' } });
}
