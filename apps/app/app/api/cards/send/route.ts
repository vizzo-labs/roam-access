import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { getMyCard, sendCard } from '@/lib/data/cards';

// Send the needs card in-app to a claimed venue (it sees needs, note and date — no name).
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('JSON body required');
  const r = await sendCard(userId, body);
  if ('error' in r) return badRequest(r.error!);
  return Response.json({ ...r, ...(await getMyCard(userId)) }, { status: 201 });
}
