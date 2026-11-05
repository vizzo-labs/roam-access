import { getUserId, unauthorized } from '@/lib/auth';
import { getLayers } from '@/lib/data/layers';

// Access layers for the map and lists: public toilets + beach access items,
// partner badges per venue, and live temporary reports. Loaded after
// /api/bootstrap so the first paint never waits on it.
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  return Response.json(await getLayers(userId), { headers: { 'Cache-Control': 'private, no-store' } });
}
