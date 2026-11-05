import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { ensureProfile } from '@/lib/data';
import { confirmReport, getActiveReports, resolveReport } from '@/lib/data/layers';

// "Still there?" — { action: 'confirm' } extends the report; { action: 'gone' } clears it.
export async function POST(req: NextRequest, ctx: RouteContext<'/api/reports/[id]'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return badRequest('Unknown report');
  const body = await req.json().catch(() => null) as { action?: unknown } | null;
  await ensureProfile(userId);
  const r = body?.action === 'confirm' ? await confirmReport(userId, id)
    : body?.action === 'gone' ? await resolveReport(id)
    : { error: 'action must be confirm or gone' } as const;
  if ('error' in r && r.error) return badRequest(r.error);
  return Response.json({ reports: await getActiveReports(userId) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
