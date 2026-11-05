import { unauthorized } from '@/lib/auth';
import { getPortalAccess } from '@/lib/roles';

// Which extra areas this person can open: council dashboard, venue dashboards.
export async function GET() {
  const access = await getPortalAccess();
  if (!access) return unauthorized();
  return Response.json(access, { headers: { 'Cache-Control': 'private, no-store' } });
}
