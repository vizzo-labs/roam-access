'use server';
// Server actions for the business pages. Every action re-checks who is
// signed in and that they manage the venue (lib/roles.ts).

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getUserId } from '@/lib/auth';
import { createClaim, respondToCard, saveReply } from '@/lib/data/business';

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

export async function statementAction(form: FormData) {
  const userId = await getUserId();
  if (!userId) redirect('/sign-in');
  const venueId = s(form, 'venueId');
  const r = await saveReply(userId, venueId, null, form.get('body'));
  redirect(`/business/${encodeURIComponent(venueId)}?${'error' in r ? 'err=1' : r.removed ? 'ok=statement-removed' : r.hidden ? 'ok=still-hidden' : 'ok=statement'}`);
}

export async function replyAction(form: FormData) {
  const userId = await getUserId();
  if (!userId) redirect('/sign-in');
  const venueId = s(form, 'venueId');
  const r = await saveReply(userId, venueId, s(form, 'reviewId'), form.get('remove') ? '' : form.get('body'));
  redirect(`/business/${encodeURIComponent(venueId)}?${'error' in r ? 'err=1' : r.removed ? 'ok=reply-removed' : r.hidden ? 'ok=still-hidden' : 'ok=reply'}`);
}

export async function cardAction(form: FormData) {
  const userId = await getUserId();
  if (!userId) redirect('/sign-in');
  const venueId = s(form, 'venueId');
  const r = await respondToCard(userId, venueId, s(form, 'cardId'), form.get('markRead') ? '' : form.get('response'));
  redirect(`/business/${encodeURIComponent(venueId)}?${'error' in r ? 'err=1' : 'ok=card'}`);
}
