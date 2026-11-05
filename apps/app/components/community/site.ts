import 'server-only';
import { headers } from 'next/headers';

/** This deployment's origin, for share links and QR codes. Request-time. */
export async function siteOrigin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'roam-access.vercel.app';
  const proto = h.get('x-forwarded-proto') || (/^(localhost|127\.)/.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}
