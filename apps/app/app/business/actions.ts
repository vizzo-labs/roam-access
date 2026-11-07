'use server';
// Server actions for the business pages. Every action re-checks who is
// signed in and that they manage the venue (lib/roles.ts).

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getUserId } from '@/lib/auth';
import { createClaim, respondToCard, saveReply } from '@/lib/data/business';
import { deleteVenuePhoto, postNotice, removeNotice, reportReview, saveCorrections } from '@/lib/data/owners';

export type ClaimState = { error?: string; values?: Record<string, string> };

export async function claimAction(_prev: ClaimState, form: FormData): Promise<ClaimState> {
  const userId = await getUserId();
  if (!userId) redirect('/sign-in');
  const values = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const r = await createClaim(userId, values);
  if ('error' in r) return { error: r.error, values };
  revalidatePath('/business');
  redirect('/business?ok=claimed');
}

const s = (form: FormData, k: string) => String(form.get(k) ?? '');

// Back to the dashboard tab the form was on, with a result code the page
// turns into a message (?ok=… or ?err=…).
function back(venueId: string, tab: string, r: { error: string } | { ok: true }, ok: string): never {
  const q = 'error' in r ? `err=${encodeURIComponent(r.error)}` : `ok=${ok}`;
  redirect(`/business/${encodeURIComponent(venueId)}?tab=${tab}&${q}`);
}

async function signedIn() {
  const userId = await getUserId();
  if (!userId) redirect('/sign-in');
  return userId;
}

export async function statementAction(form: FormData) {
  const userId = await signedIn();
  const venueId = s(form, 'venueId');
  const r = await saveReply(userId, venueId, null, form.get('body'));
  if ('error' in r) back(venueId, 'profile', { error: 'save' }, '');
  back(venueId, 'profile', r, r.removed ? 'statement-removed' : r.hidden ? 'still-hidden' : 'statement');
}

export async function replyAction(form: FormData) {
  const userId = await signedIn();
  const venueId = s(form, 'venueId');
  const r = await saveReply(userId, venueId, s(form, 'reviewId'), form.get('remove') ? '' : form.get('body'));
  if ('error' in r) back(venueId, 'reviews', { error: 'save' }, '');
  back(venueId, 'reviews', r, r.removed ? 'reply-removed' : r.hidden ? 'still-hidden' : 'reply');
}

export async function cardAction(form: FormData) {
  const userId = await signedIn();
  const venueId = s(form, 'venueId');
  const r = await respondToCard(userId, venueId, s(form, 'cardId'), form.get('markRead') ? '' : form.get('response'));
  back(venueId, 'cards', 'error' in r ? { error: 'save' } : r, 'card');
}

export async function reportAction(form: FormData) {
  const userId = await signedIn();
  const venueId = s(form, 'venueId');
  const r = await reportReview(userId, venueId, s(form, 'reviewId'), form.get('reason'), form.get('note'));
  back(venueId, 'reviews', r, 'report');
}

export async function noticeAction(form: FormData) {
  const userId = await signedIn();
  const venueId = s(form, 'venueId');
  const r = await postNotice(userId, venueId, form.get('body'), form.get('endsOn'));
  revalidatePath(`/v/${venueId}`);
  back(venueId, 'updates', r, 'notice');
}

export async function removeNoticeAction(form: FormData) {
  const userId = await signedIn();
  const venueId = s(form, 'venueId');
  const r = await removeNotice(userId, venueId, s(form, 'id'));
  revalidatePath(`/v/${venueId}`);
  back(venueId, 'updates', r, 'notice-removed');
}

export async function removePhotoAction(form: FormData) {
  const userId = await signedIn();
  const venueId = s(form, 'venueId');
  const r = await deleteVenuePhoto(userId, venueId, s(form, 'id'));
  back(venueId, 'photos', r, 'photo-removed');
}

export async function correctionsAction(form: FormData) {
  const userId = await signedIn();
  const venueId = s(form, 'venueId');
  const r = await saveCorrections(userId, venueId, { phone: form.get('phone'), website: form.get('website'), hours: form.get('hours') });
  back(venueId, 'profile', r, !('error' in r) && r.removed ? 'details-removed' : 'details');
}
