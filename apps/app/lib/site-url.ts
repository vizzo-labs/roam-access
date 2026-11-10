// The app's public address, for links that leave the app: share links, QR
// codes, printed cards, the embeddable widget, the organiser kit, open data
// and link-preview metadata.
//
// One setting: NEXT_PUBLIC_SITE_URL. Production sets it to
// https://app.roamaccess.com.au. Previews and local builds leave it unset and
// use the address they are served from, so their links stay on the preview.
// NEXT_PUBLIC_* is inlined at build time, so this works on the server and in
// the browser alike. Changing it needs a new build.

/** `https://host[:port]` with no trailing slash, or '' if the value isn't a usable http(s) URL. */
export function normaliseOrigin(value: string | undefined | null): string {
  if (!value) return '';
  const raw = value.trim();
  if (!raw) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
    return u.origin;
  } catch {
    return '';
  }
}

/** The configured public origin ('' when unset: use the request's own). */
export const SITE_URL = normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL);

/** The public origin, else the one this request or page came from. */
export function publicOrigin(fallback: string): string {
  return SITE_URL || normaliseOrigin(fallback) || fallback;
}

/** In the browser: the public origin, else this page's own. */
export function clientOrigin(): string {
  return SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
}

/**
 * Server, build time: the public origin, else this deployment's own address
 * (Vercel's branch URL on previews, the production domain on production,
 * localhost locally). For metadataBase, so link previews get absolute URLs.
 */
export function metadataOrigin(): string {
  if (SITE_URL) return SITE_URL;
  const env = process.env.VERCEL_ENV;
  const host = env === 'preview' ? (process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL)
    : env === 'production' ? (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL)
    : '';
  return normaliseOrigin(host) || `http://localhost:${process.env.PORT || 3000}`;
}
