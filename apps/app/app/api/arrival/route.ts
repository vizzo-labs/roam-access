import type { NextRequest } from 'next/server';
import { badRequest, getUserId, unauthorized } from '@/lib/auth';
import { ensureProfile } from '@/lib/data';
import { getArrivalSteps, saveArrivalSteps } from '@/lib/data/arrival-steps';

const headers = { 'Cache-Control': 'private, no-store' };

// Getting there 2 (I2): the community's step-by-step arrival for one venue,
// most-confirmed first. Never part of a verdict.
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const venueId = req.nextUrl.searchParams.get('venue');
  if (!venueId) return badRequest('venue required');
  return Response.json({ steps: await getArrivalSteps(venueId, userId) }, { headers });
}

// Add (or replace) your steps for a venue.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('JSON body required');
  await ensureProfile(userId);
  const r = await saveArrivalSteps(userId, body);
  if ('error' in r && r.error) return badRequest(r.error);
  return Response.json({ replaced: r.replaced, steps: await getArrivalSteps(body.venueId, userId) }, { status: 201, headers });
}
