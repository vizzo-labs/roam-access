import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { getDb, schema } from './db';
import { getUserId, isAdmin } from './auth';

const { userRoles, venueClaims } = schema;

export type Role = 'council';
export const ROLES: { id: Role; label: string }[] = [{ id: 'council', label: 'Council (dashboard + DIAP export)' }];

export async function getRoles(userId: string): Promise<Role[]> {
  const rows = await getDb().select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
  return rows.map(r => r.role as Role);
}

/** Council dashboard: an admin-granted 'council' role, or an admin. */
export async function canSeeCouncil(userId: string | null) {
  if (!userId) return false;
  if ((await getRoles(userId)).includes('council')) return true;
  return isAdmin();
}

/** Venue ids this person manages (approved claims only). */
export async function managedVenueIds(userId: string): Promise<string[]> {
  const rows = await getDb().select({ venueId: venueClaims.venueId }).from(venueClaims)
    .where(and(eq(venueClaims.userId, userId), eq(venueClaims.status, 'approved')));
  return rows.map(r => r.venueId);
}

export async function managesVenue(userId: string | null, venueId: string) {
  if (!userId) return false;
  const [row] = await getDb().select({ id: venueClaims.id }).from(venueClaims)
    .where(and(eq(venueClaims.userId, userId), eq(venueClaims.venueId, venueId), eq(venueClaims.status, 'approved')));
  return !!row;
}

/** For the Me screen: which portal links to show. */
export async function getPortalAccess() {
  const userId = await getUserId();
  if (!userId) return null;
  const [council, venues, pending] = await Promise.all([
    canSeeCouncil(userId),
    managedVenueIds(userId),
    getDb().select({ id: venueClaims.id }).from(venueClaims)
      .where(and(eq(venueClaims.userId, userId), inArray(venueClaims.status, ['pending']))),
  ]);
  return { council, venues: venues.length, pendingClaims: pending.length };
}
