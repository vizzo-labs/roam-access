// Photos for `npm run test-user` (I4). A test user's photos live in two
// places: rows in `review_photos` (review, entrance and arrival-step photos
// all use it) and the image files in the dev Blob store
// (roam-access-photos-dev). Rows cascade when the profile goes; the files
// don't, so they are deleted here first — and only files named by THIS
// user's rows (pathnames are random and carry no user id, so the rows are the
// only safe link). Nothing is deleted on a guess.
import type { Client } from 'pg';
import { BlobNotFoundError, del, head, list } from '@vercel/blob';

// What createDraftPhoto writes: photos/<venue>/<uuid>.jpg and …-thumb.jpg.
// Photos from the venue (business portal v2): venue-photos/<venue>/<uuid>.jpg.
const PHOTO_PATH = /^(venue-)?photos\/[^/]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-thumb)?\.jpg$/;

async function exists(pathname: string) {
  try { await head(pathname); return true; } catch (e) {
    if (e instanceof BlobNotFoundError) return false;
    throw e;
  }
}

/** Delete the Blob files of one user's photos, then check they're gone.
 *  Throws (before any row is deleted) if a file is still there, so a re-run
 *  can finish the job. */
export async function deleteUserPhotoFiles(client: Client, userId: string) {
  // A test owner's venue photos too: their rows would only be set to null
  // with the profile, leaving files nobody can tie to a user.
  const { rows } = await client.query<{ pathname: string; thumb_pathname: string }>(
    `SELECT pathname, thumb_pathname FROM review_photos WHERE user_id = $1
     UNION ALL SELECT pathname, thumb_pathname FROM venue_photos WHERE user_id = $1`, [userId]);
  const paths = rows.flatMap(r => [r.pathname, r.thumb_pathname]);
  const odd = paths.filter(p => !PHOTO_PATH.test(p));
  if (odd.length) throw new Error(`refusing: unexpected photo pathname(s): ${odd.join(', ')}`);
  if (!paths.length) return { photos: 0, files: 0 };
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not set — run `npx vercel env pull .env.local --yes --environment development`.');
  for (let i = 0; i < paths.length; i += 100) await del(paths.slice(i, i + 100));
  const left: string[] = [];
  for (const p of paths) if (await exists(p)) left.push(p);
  if (left.length) throw new Error(`these photo files are still in the Blob store, nothing else deleted — run delete again: ${left.join(', ')}`);
  await client.query('DELETE FROM venue_photos WHERE user_id = $1', [userId]);
  return { photos: rows.length, files: paths.length };
}

/** Files in the Blob store that no `review_photos` row names (read-only).
 *  These can't be tied to a user, so they are only listed, never deleted. */
export async function listOrphanPhotoFiles(client: Client) {
  const { rows } = await client.query<{ pathname: string; thumb_pathname: string }>(
    'SELECT pathname, thumb_pathname FROM review_photos UNION ALL SELECT pathname, thumb_pathname FROM venue_photos');
  const known = new Set(rows.flatMap(r => [r.pathname, r.thumb_pathname]));
  const orphans: { pathname: string; size: number; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  let total = 0;
  do {
    const page = await list({ cursor, limit: 1000 });
    total += page.blobs.length;
    for (const b of page.blobs) if (!known.has(b.pathname)) orphans.push({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return { total, rows: rows.length, orphans };
}
