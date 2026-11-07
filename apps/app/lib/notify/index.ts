import 'server-only';
// Notifications when a saved place posts an update.
//
// Today the only channel is IN THE APP: the update shows under "Updates from
// your saved places" on Saved, with an unread count, until the person marks
// it as seen (each place's live notices in /api/bootstrap + getSeenNoticeIds /
// markNoticesSeen in lib/data/owners.ts). That
// needs nothing sent — it's read when the app loads.
//
// THE HOOK FOR EMAIL / PUSH (not built: there is no provider yet). Add a
// channel to CHANNELS below, e.g.
//   { id: 'email', send: async (n, recipients) => { …provider call… } }
// `recipients` is the people who saved the place (user ids only). Before
// adding one: let people opt in per channel (a new column or table), never
// put access needs in a message, and send from a queue (Vercel Queues), not
// inside the venue's request.
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db';

export type PostedNotice = { id: string; venueId: string; body: string; endsOn: string | null; createdAt: Date };
export type Channel = { id: string; send: (notice: PostedNotice, recipients: string[]) => Promise<void> };

const CHANNELS: Channel[] = []; // in-app needs no channel; email/push go here

export async function notifyNoticePosted(notice: PostedNotice) {
  if (!CHANNELS.length) return;
  const rows = await getDb().select({ userId: schema.saved.userId }).from(schema.saved).where(eq(schema.saved.venueId, notice.venueId));
  const recipients = rows.map(r => r.userId);
  if (!recipients.length) return;
  await Promise.allSettled(CHANNELS.map(c => c.send(notice, recipients)));
}
