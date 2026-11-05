import type { NextRequest } from 'next/server';
import { getUserId, unauthorized } from '@/lib/auth';
import { getGapTasks, getLiveEventFor, pilotOrigin } from '@/lib/data/community';

// "3 places near you need one quick answer" for the signed-in tester.
// ?lat&lng = where walking times start (Manly Wharf if missing or far away);
// ?skip=venueId:feature,… = questions skipped this session.
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const p = req.nextUrl.searchParams;
  const skip = (p.get('skip') || '').split(',').filter(Boolean).slice(0, 60);
  const [tasks, event] = await Promise.all([
    getGapTasks(userId, pilotOrigin(p.get('lat'), p.get('lng')), skip),
    getLiveEventFor(userId),
  ]);
  return Response.json({ tasks, event }, { headers: { 'Cache-Control': 'private, no-store' } });
}
