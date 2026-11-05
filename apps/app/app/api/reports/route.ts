import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { ensureProfile } from '@/lib/data';
import { createReport, getActiveReports } from '@/lib/data/layers';

// Report a temporary problem (lift out, ramp blocked …) or answer "Is there
// matting today?". Returns every live report so the client stays in sync.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('JSON body required');
  await ensureProfile(userId);
  const r = await createReport(userId, body);
  if ('error' in r && r.error) return badRequest(r.error);
  return Response.json({ merged: r.merged, reports: await getActiveReports(userId) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
