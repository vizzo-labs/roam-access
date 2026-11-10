import 'server-only';
import { headers } from 'next/headers';
import { SITE_URL } from '@/lib/site-url';

/**
 * The public origin for share links and QR codes: NEXT_PUBLIC_SITE_URL in
 * production (lib/site-url), else this request's own host (previews, local).
 */
export async function siteOrigin() {
  if (SITE_URL) return SITE_URL;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (/^(localhost|127\.)/.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}
