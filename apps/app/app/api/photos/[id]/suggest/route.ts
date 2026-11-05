import type { NextRequest } from 'next/server';
import { getUserId, unauthorized } from '@/lib/auth';
import { getOwnDraft, kindLabel, readPhotoBytes } from '@/lib/data/photos';
import { refundAiQuota, takeAiQuota } from '@/lib/data/ai-usage';
import { getVenueVM } from '@/lib/data';
import { PHOTO_KIND_IDS } from '@/lib/photos/kinds';

const isKind = (k: unknown): k is string => typeof k === 'string' && (PHOTO_KIND_IDS as string[]).includes(k);
import { suggestFromPhoto } from '@/lib/ai/photo-suggest';

export const maxDuration = 30;

// #16 — suggested answers + alt text from the reviewer's own photo. Shown as
// suggestions in the form; the reviewer must accept each one.
export async function POST(req: NextRequest, ctx: RouteContext<'/api/photos/[id]/suggest'>) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const photo = await getOwnDraft(userId, id).catch(() => null);
  if (!photo) return Response.json({ error: 'Not found' }, { status: 404 });

  // The reviewer may have changed "What does it show?" since uploading.
  const body = await req.json().catch(() => null);
  const kind = isKind(body?.kind) ? body.kind : photo.kind;

  const remaining = await takeAiQuota(userId, 'photo');
  if (remaining === null) return Response.json({ error: 'limit', message: 'Photo suggestions are used up for today.' }, { status: 429 });
  try {
    const [bytes, venue] = await Promise.all([readPhotoBytes(photo.pathname), getVenueVM(photo.venueId)]);
    if (!bytes) throw new Error('photo missing');
    const suggestion = await suggestFromPhoto(bytes, { venueKind: venue?.kind || 'place', photoKind: kindLabel(kind) });
    return Response.json({ suggestion, remaining }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    await refundAiQuota(userId, 'photo');
    // Log the failure type only — never the photo or anything about the user.
    console.error('[photo-suggest] failed:', (e as Error)?.name || 'Error');
    return Response.json({ error: 'unavailable', message: 'Suggestions aren’t available right now.' }, { status: 503 });
  }
}
