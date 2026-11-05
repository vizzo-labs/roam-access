import type { NextRequest } from 'next/server';
import { getUserId, isAdmin, unauthorized } from '@/lib/auth';
import { deleteDraftPhoto, getPhotoAccess, readPhoto } from '@/lib/data/photos';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => new Response('Not found', { status: 404 });

// Photos are in a private Blob store: this is the only way to see one.
// Signed-in testers see visible photos; the uploader sees their own drafts;
// admins see hidden ones so they can moderate.
export async function GET(req: NextRequest, ctx: RouteContext<'/api/photos/[id]'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return notFound();
  const access = await getPhotoAccess(id);
  if (!access) return notFound();
  const ok = access.publicOk || access.photo.userId === userId || (await isAdmin());
  if (!ok) return notFound();
  const thumb = req.nextUrl.searchParams.get('size') === 'thumb';
  const blob = await readPhoto(thumb ? access.photo.thumbPathname : access.photo.pathname);
  if (!blob) return notFound();
  return new Response(blob.stream, {
    headers: {
      'Content-Type': 'image/jpeg',
      // Private: never in a shared cache; short so hiding takes effect soon.
      'Cache-Control': 'private, max-age=600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}

// Remove a photo from a review that hasn't been sent yet.
export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/photos/[id]'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return notFound();
  const ok = await deleteDraftPhoto(userId, id);
  return ok ? Response.json({ ok: true }) : notFound();
}
