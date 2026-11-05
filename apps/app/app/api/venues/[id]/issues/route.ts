import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { reportIssue } from '@/lib/data/trust';

// "Report a problem" — closed, moved, wrong location, duplicate, info wrong.
// Goes to the admin queue in /admin.
export async function POST(req: NextRequest, ctx: RouteContext<'/api/venues/[id]/issues'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('JSON body required');
  const result = await reportIssue(userId, id, body);
  if ('error' in result) return badRequest(result.error!);
  return Response.json({ ok: true }, { status: 201 });
}
