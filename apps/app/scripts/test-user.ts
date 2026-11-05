// Clerk TEST users for local/headless testing. Headless sign-up is blocked by
// bot protection, so we create the user with the Backend API and sign in with
// a one-time ticket instead.
//
//   npm run test-user -- create <name> [--port 3456]   → user + sign-in URL
//   npm run test-user -- signin <name> [--port 3456]   → fresh sign-in URL
//   npm run test-user -- delete <name>                 → Clerk user + dev DB rows
//
// Only ever touches `<name>+clerk_test@example.com` users, and only deletes DB
// rows on the DEV database. Never use this on real users.

import { connectPg } from './lib/pg';

const API = 'https://api.clerk.com/v1';
const key = process.env.CLERK_SECRET_KEY;

function emailFor(name: string) {
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(name)) throw new Error('name: lowercase letters, digits and dashes (e.g. "ra-search-1")');
  return `${name}+clerk_test@example.com`;
}

async function clerk<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!key) throw new Error('CLERK_SECRET_KEY is not set — run `npx vercel env pull .env.local --yes`.');
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Clerk ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

type ClerkUser = { id: string; email_addresses: { email_address: string }[] };

async function findUser(email: string) {
  const users = await clerk<ClerkUser[]>('GET', `/users?email_address=${encodeURIComponent(email)}`);
  return users.find(u => u.email_addresses.some(e => e.email_address === email)) || null;
}

async function signInUrl(userId: string, port: string) {
  const t = await clerk<{ token: string }>('POST', '/sign_in_tokens', { user_id: userId, expires_in_seconds: 3600 });
  return `http://localhost:${port}/sign-in?__clerk_ticket=${t.token}`;
}

async function main() {
  const [cmd, name] = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const portIdx = process.argv.indexOf('--port');
  const port = portIdx > 0 ? process.argv[portIdx + 1] : '3000';
  if (!cmd || !name) throw new Error('usage: test-user <create|signin|delete> <name> [--port N]');
  const email = emailFor(name);
  if (!email.endsWith('+clerk_test@example.com')) throw new Error('refusing: not a Clerk test email');

  if (cmd === 'create' || cmd === 'signin') {
    let user = await findUser(email);
    if (!user && cmd === 'create') {
      user = await clerk<ClerkUser>('POST', '/users', { email_address: [email], skip_password_requirement: true });
      console.log(`created ${email} (${user.id})`);
    }
    if (!user) throw new Error(`no test user ${email} — create it first`);
    console.log(`user id: ${user.id}`);
    console.log(`sign in: ${await signInUrl(user.id, port)}`);
    return;
  }

  if (cmd === 'delete') {
    const user = await findUser(email);
    if (!user) { console.log(`no Clerk user ${email}`); return; }
    const { client, target } = await connectPg();
    try {
      if (target !== 'dev') throw new Error('refusing to delete rows outside the dev database');
      // Photo images live in the dev Blob store: delete them first (rows cascade).
      const photos = await client.query('SELECT pathname, thumb_pathname FROM review_photos WHERE user_id = $1', [user.id]).catch(() => ({ rows: [] }));
      const paths = photos.rows.flatMap((p: { pathname: string; thumb_pathname: string }) => [p.pathname, p.thumb_pathname]);
      if (paths.length) {
        const { del } = await import('@vercel/blob');
        await del(paths);
        console.log(`deleted ${paths.length} photo file(s) from the dev Blob store`);
      }
      // Reviews, saved places and photo rows cascade from the profile.
      const r = await client.query('DELETE FROM profiles WHERE user_id = $1', [user.id]);
      console.log(`deleted ${r.rowCount} profile row(s) (+ cascaded reviews/saved) from the dev DB`);
    } finally {
      await client.end();
    }
    await clerk('DELETE', `/users/${user.id}`);
    console.log(`deleted Clerk user ${email} (${user.id})`);
    return;
  }
  throw new Error(`unknown command ${cmd}`);
}

main().catch(e => { console.error((e as Error).message); process.exit(1); });
