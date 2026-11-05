import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { saveMicroAnswer } from '@/lib/data/community';

// One quick yes/no answer. Answering the same question again replaces it.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('JSON body required');
  const result = await saveMicroAnswer(userId, body);
  if ('error' in result) return badRequest(result.error!);
  return Response.json(result, { status: 201 });
}
