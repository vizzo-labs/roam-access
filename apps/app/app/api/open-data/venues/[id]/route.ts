import type { NextRequest } from 'next/server';
import { getOpenDataPlaces, openDataMeta } from '@/lib/data/open-data';

// Public: one venue as an A11yJSON PlaceInfo, with the ODbL licence alongside.
export async function GET(req: NextRequest, ctx: RouteContext<'/api/open-data/venues/[id]'>) {
  const { id } = await ctx.params;
  const [place] = await getOpenDataPlaces(new URL(req.url).origin, id);
  if (!place) return Response.json({ error: 'Unknown venue' }, { status: 404 });
  const meta: Partial<ReturnType<typeof openDataMeta>> = openDataMeta(1);
  delete meta.count;
  return Response.json({ ...meta, place }, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600', 'Access-Control-Allow-Origin': '*' } });
}
