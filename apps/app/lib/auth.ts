import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';

/** The signed-in Clerk user id, or null. Every API route starts here. */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export const unauthorized = () => Response.json({ error: 'Sign in required' }, { status: 401 });
export const badRequest = (msg: string) => Response.json({ error: msg }, { status: 400 });

/** Admins are listed by email in ADMIN_EMAILS (comma-separated). */
export async function isAdmin(): Promise<boolean> {
  const allow = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!allow.length) return false;
  const user = await currentUser();
  if (!user) return false;
  return user.emailAddresses.some(e => e.verification?.status === 'verified' && allow.includes(e.emailAddress.toLowerCase()));
}
