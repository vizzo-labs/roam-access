import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { markNoticesSeen } from '@/lib/data/owners';

// "Mark as seen" for updates from saved places: { ids: [noticeId, …] }.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const r = await markNoticesSeen(userId, body?.ids);
  if ('error' in r) return badRequest(r.error!);
  return Response.json(r);
}
