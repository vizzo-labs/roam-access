'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getUserId } from '@/lib/auth';
import { getEventByCode, joinEvent, leaveEvent } from '@/lib/data/community';

// Join a mapping day, or change how you appear on its leaderboard.
export async function joinEventAction(formData: FormData) {
  const code = String(formData.get('code') || '');
  const back = String(formData.get('back') || '') === 'board' ? `/events/${encodeURIComponent(code)}` : `/join/${encodeURIComponent(code)}`;
  const userId = await getUserId();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
  const event = await getEventByCode(code);
  if (!event || event.status === 'ended') redirect(back);
  await joinEvent(userId, event.id, {
    showName: formData.get('showName') === 'on',
    displayName: formData.get('displayName'),
  });
  revalidatePath(back);
  redirect(`${back}?saved=1`);
}

export async function leaveEventAction(formData: FormData) {
  const code = String(formData.get('code') || '');
  const userId = await getUserId();
  const event = await getEventByCode(code);
  if (userId && event) await leaveEvent(userId, event.id);
  redirect(`/join/${encodeURIComponent(code)}?left=1`);
}
