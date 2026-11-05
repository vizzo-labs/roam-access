import { getUserId, unauthorized } from '@/lib/auth';
import { getBootstrap } from '@/lib/data';

// Everything the app needs on load: the tester's profile, every venue with its
// community facts, what they saved and reviewed, and pilot-wide numbers.
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  return Response.json(await getBootstrap(userId), { headers: { 'Cache-Control': 'private, no-store' } });
}
