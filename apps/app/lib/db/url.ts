// Which database to talk to. ONE rule for the app, the build and every script:
//
//   VERCEL_ENV === 'production'  → DATABASE_URL      (production Neon)
//   anything else                → DEV_DATABASE_URL  (dev Neon: local, previews)
//
// If DEV_DATABASE_URL is missing outside production we fall back to
// DATABASE_URL with a loud warning — that is production data.
//
// No 'server-only' here: scripts (migrate, seed) import this too.

export type DbTarget = 'production' | 'dev';

let warned = false;

export function pickDatabaseUrl(opts: { unpooled?: boolean } = {}): { url: string; target: DbTarget } {
  const env = process.env;
  const suffix = opts.unpooled ? '_UNPOOLED' : '';
  const read = (name: string) => (opts.unpooled ? env[name + suffix] || env[name] : env[name]);

  if (env.VERCEL_ENV === 'production') {
    const url = read('DATABASE_URL');
    if (!url) throw new Error('DATABASE_URL is not set (production).');
    return { url, target: 'production' };
  }

  const dev = read('DEV_DATABASE_URL');
  if (dev) return { url: dev, target: 'dev' };

  const fallback = read('DATABASE_URL');
  if (!fallback) throw new Error('Neither DEV_DATABASE_URL nor DATABASE_URL is set — run `npx vercel env pull .env.local --yes`.');
  if (!warned) {
    warned = true;
    console.warn('[db] DEV_DATABASE_URL is not set — falling back to DATABASE_URL (PRODUCTION data). Pull env vars to use the dev database.');
  }
  return { url: fallback, target: 'production' };
}

// Host only, never credentials — safe to log.
export function describeDatabaseUrl(url: string) {
  try { return new URL(url).hostname.split('.')[0]; } catch { return '(unparseable url)'; }
}
