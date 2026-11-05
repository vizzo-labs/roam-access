import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { getMyCard, saveMyCard } from '@/lib/data/cards';

// The tester's pre-arrival needs card (and the cards they've sent to venues).
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  return Response.json(await getMyCard(userId), { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('JSON body required');
  await saveMyCard(userId, body);
  return Response.json(await getMyCard(userId));
}
