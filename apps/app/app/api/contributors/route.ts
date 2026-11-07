import { getUserId, unauthorized } from '@/lib/auth';
import { getMyContrib, getTopContributors } from '@/lib/data/contributors';

// Me → recognition: my contributor badges and counts ("Helped N people"), and
// the pilot area's top contributors this month (named people only, no needs).
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const [me, top] = await Promise.all([getMyContrib(userId), getTopContributors(5)]);
  return Response.json({ me, top }, { headers: { 'Cache-Control': 'private, no-store' } });
}
