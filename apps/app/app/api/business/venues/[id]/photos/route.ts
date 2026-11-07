import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { uploadVenuePhoto } from '@/lib/data/owners';
import { PHOTO_MAX_BYTES, THUMB_MAX_BYTES } from '@/lib/photos/kinds';

// A verified venue uploads one photo (the business dashboard, Photos tab).
// Same pipeline as review photos: the browser has resized and re-encoded it
// as JPEG (no EXIF/GPS); the server checks it and strips metadata again.
export async function POST(req: NextRequest, ctx: RouteContext<'/api/business/venues/[id]/photos'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const len = Number(req.headers.get('content-length') || 0);
  if (len > PHOTO_MAX_BYTES + THUMB_MAX_BYTES + 50_000) return badRequest('photo-size');
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest('multipart form required');
  const file = form.get('photo');
  const thumb = form.get('thumb');
  if (!(file instanceof Blob) || !(thumb instanceof Blob)) return badRequest('photo and thumb required');
  const r = await uploadVenuePhoto(userId, id, {
    kind: form.get('kind'), alt: form.get('alt'),
    main: new Uint8Array(await file.arrayBuffer()), thumb: new Uint8Array(await thumb.arrayBuffer()),
  });
  if ('error' in r) return r.error === 'not-yours' ? Response.json({ error: r.error }, { status: 403 }) : badRequest(r.error ?? 'error');
  return Response.json(r, { status: 201 });
}
