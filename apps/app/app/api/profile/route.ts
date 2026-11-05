import { clerkClient } from '@clerk/nextjs/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { deleteProfile, updateProfile } from '@/lib/data';

export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('JSON body required');
  return Response.json(await updateProfile(userId, body));
}

// "Delete my account": the tester's needs, reviews and saved places go first,
// then the Clerk sign-in itself.
export async function DELETE() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  await deleteProfile(userId);
  const client = await clerkClient();
  await client.users.deleteUser(userId);
  return Response.json({ ok: true });
}
