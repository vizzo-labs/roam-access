import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { getVenueReviews, getVenueVM } from '@/lib/data';
import { getPhotosByReview } from '@/lib/data/photos';
import { getAiRemaining, refundAiQuota, takeAiQuota } from '@/lib/data/ai-usage';
import { askAboutPlace, QUESTION_MAX } from '@/lib/ai/ask';

export const maxDuration = 30;
const noStore = { 'Cache-Control': 'private, no-store' };

// How many questions are left today (shown under the question box).
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  return Response.json({ remaining: await getAiRemaining(userId, 'ask') }, { headers: noStore });
}

// #15 — answered only from this place's Roam reviews, with citations.
// The question is never stored or logged.
export async function POST(req: NextRequest, ctx: RouteContext<'/api/venues/[id]/ask'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const question = typeof body?.question === 'string' ? body.question.replace(/\s+/g, ' ').trim() : '';
  if (question.length < 3) return badRequest('Type a question first');
  if (question.length > QUESTION_MAX) return badRequest(`Questions can be up to ${QUESTION_MAX} characters`);

  const venue = await getVenueVM(id);
  if (!venue) return Response.json({ error: 'Not found' }, { status: 404 });
  const reviews = await getVenueReviews(id, userId);
  // Nothing to answer from: say so without spending a question.
  if (!reviews.length) {
    return Response.json({
      result: { answered: false, answer: 'Nobody has reviewed this place yet, so there’s nothing to answer from — and we won’t guess.', citations: [] },
      remaining: await getAiRemaining(userId, 'ask'),
    }, { headers: noStore });
  }

  const remaining = await takeAiQuota(userId, 'ask');
  if (remaining === null) return Response.json({ error: 'limit', message: 'You’ve used today’s questions. You can ask again tomorrow.', remaining: 0 }, { status: 429, headers: noStore });
  try {
    const photos = await getPhotosByReview(reviews.map(r => r.id), userId);
    const result = await askAboutPlace(question, venue, reviews, photos);
    return Response.json({ result, remaining }, { headers: noStore });
  } catch (e) {
    await refundAiQuota(userId, 'ask');
    console.error('[ask] failed:', (e as Error)?.name || 'Error');
    return Response.json({ error: 'unavailable', message: 'Answers aren’t available right now — try again in a minute.' }, { status: 503, headers: noStore });
  }
}
