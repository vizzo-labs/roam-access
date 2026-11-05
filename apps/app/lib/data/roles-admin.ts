import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { getDb, schema } from '../db';
import { ensureProfile } from '../data';
import { ROLES, type Role } from '../roles';

const { userRoles } = schema;

export async function listRoleHolders() {
  return getDb().select().from(userRoles).orderBy(desc(userRoles.createdAt));
}

export async function grantRole(userId: string, role: Role, org: string | null, grantedBy: string) {
  if (!ROLES.some(r => r.id === role)) throw new Error('unknown role');
  await ensureProfile(userId);
  await getDb().insert(userRoles).values({ userId, role, org: org?.trim().slice(0, 80) || null, grantedBy }).onConflictDoNothing();
}

export async function revokeRole(userId: string, role: Role) {
  await getDb().delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)));
}
