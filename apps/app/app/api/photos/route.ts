import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { createDraftPhoto } from '@/lib/data/photos';
import { PHOTO_MAX_BYTES, THUMB_MAX_BYTES } from '@/lib/photos/kinds';

// Upload one photo while the review form is open (a draft until the review is
// sent). The browser has already resized it and re-encoded it as JPEG, which
// drops EXIF/GPS; the server strips any metadata again before storing.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const len = Number(req.headers.get('content-length') || 0);
  if (len > PHOTO_MAX_BYTES + THUMB_MAX_BYTES + 50_000) return badRequest('Photo is too large');
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest('multipart form required');
  const file = form.get('photo');
  const thumb = form.get('thumb');
  if (!(file instanceof Blob) || !(thumb instanceof Blob)) return badRequest('photo and thumb required');
  const result = await createDraftPhoto(userId, {
    venueId: form.get('venueId'), kind: form.get('kind'),
    main: new Uint8Array(await file.arrayBuffer()), thumb: new Uint8Array(await thumb.arrayBuffer()),
  });
  if ('error' in result) return badRequest(result.error!);
  return Response.json(result, { status: 201 });
}
