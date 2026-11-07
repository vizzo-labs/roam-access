import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { createReview, getVenueVM } from '@/lib/data';
import { attachPhotos, checkDraftsOwned, validatePhotoInput } from '@/lib/data/photos';
import { createEntranceForReview, parseEntranceInput } from '@/lib/data/entrances';
import { getMyContrib } from '@/lib/data/contributors';

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
  // The step-free entrance (optional, Getting there I1): checked up front too.
  const entrance = await parseEntranceInput(body.entrance, body.venueId, photos.photos.map(p => p.id));
  if ('error' in entrance) return badRequest(entrance.error);
  const result = await createReview(userId, body, { extras: photos.photos.length > 0 || !!entrance.entrance });
  if ('error' in result) return badRequest(result.error!);
  if (photos.photos.length) await attachPhotos(userId, result.reviewId, body.venueId, photos.photos);
  // Earned contributor badges after everything is attached (for "New badge").
  const badges = async () => (await getMyContrib(userId)).earned;
  if (entrance.entrance) {
    await createEntranceForReview(userId, body.venueId, result.reviewId, entrance.entrance);
    return Response.json({ ...result, venue: await getVenueVM(body.venueId), badges: await badges() }, { status: 201 });
  }
  return Response.json({ ...result, badges: await badges() }, { status: 201 });
}
