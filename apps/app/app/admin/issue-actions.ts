'use server';
// Admin actions for the problem-report queue. Every action re-checks admin.

import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/auth';
import { markVenueInactiveForIssue, reactivateVenue, resolveIssue } from '@/lib/data/trust';

async function guard() {
  if (!(await isAdmin())) throw new Error('Not allowed');
}

export async function resolveIssueAction(formData: FormData) {
  await guard();
  const resolution = formData.get('resolution') === 'no_change' ? 'no_change' : 'fixed';
  await resolveIssue(String(formData.get('id')), resolution);
  revalidatePath('/admin');
}

export async function markInactiveAction(formData: FormData) {
  await guard();
  await markVenueInactiveForIssue(String(formData.get('id')));
  revalidatePath('/admin');
}

export async function reactivateVenueAction(formData: FormData) {
  await guard();
  await reactivateVenue(String(formData.get('venueId')));
  revalidatePath('/admin');
}
