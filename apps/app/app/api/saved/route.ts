import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { setSaved } from '@/lib/data';
import { getDb, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null) as { venueId?: unknown; saved?: unknown } | null;
  if (!body || typeof body.venueId !== 'string' || typeof body.saved !== 'boolean') return badRequest('venueId and saved required');
  const [v] = await getDb().select({ id: schema.venues.id }).from(schema.venues).where(eq(schema.venues.id, body.venueId));
  if (!v) return badRequest('Unknown venue');
  await setSaved(userId, v.id, body.saved);
  return Response.json({ ok: true });
}
