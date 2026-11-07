import type { NextRequest } from 'next/server';
import { getUserId, unauthorized } from '@/lib/auth';
import { setReviewThanks } from '@/lib/data/contributors';

// "This helped me": one per person per review, never on your own.
// PUT adds it, DELETE takes it back. Returns the review's new count.
async function handle(ctx: RouteContext<'/api/reviews/[id]/thanks'>, on: boolean) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const r = await setReviewThanks(userId, id, on);
  if ('error' in r) return Response.json({ error: r.error }, { status: r.status });
  return Response.json(r, { headers: { 'Cache-Control': 'private, no-store' } });
}

export const PUT = (_req: NextRequest, ctx: RouteContext<'/api/reviews/[id]/thanks'>) => handle(ctx, true);
export const DELETE = (_req: NextRequest, ctx: RouteContext<'/api/reviews/[id]/thanks'>) => handle(ctx, false);
