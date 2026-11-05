import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { createReview } from '@/lib/data';
import { attachPhotos, checkDraftsOwned, validatePhotoInput } from '@/lib/data/photos';

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('JSON body required');
  // Photos (optional): checked before the review is written, so a bad photo
  // list never leaves a review behind without them.
  const photos = validatePhotoInput(body.photos);
  if ('error' in photos) return badRequest(photos.error!);
  if (photos.photos.length && (typeof body.venueId !== 'string' || !(await checkDraftsOwned(userId, body.venueId, photos.photos.map(p => p.id))))) {
    return badRequest('Unknown photo — try adding it again');
  }
  const result = await createReview(userId, body);
  if ('error' in result) return badRequest(result.error!);
  if (photos.photos.length) await attachPhotos(userId, result.reviewId, body.venueId, photos.photos);
  return Response.json(result, { status: 201 });
}
