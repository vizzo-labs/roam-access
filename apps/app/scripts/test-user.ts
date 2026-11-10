// Clerk TEST users for local/headless testing. Headless sign-up is blocked by
// bot protection, so we create the user with the Backend API and sign in with
// a one-time ticket instead.
//
//   npm run test-user -- create <name> [--port 3456]   → user + sign-in URL
//   npm run test-user -- signin <name> [--port 3456]   → fresh sign-in URL
//       add --base https://app.roamaccess.com.au to sign in on a deployed
//       address instead of localhost (same Clerk instance only)
//   npm run test-user -- delete <name>                 → Clerk user + dev DB rows
//                                                         + that user's photo files
//   npm run test-user -- orphans                       → list photo files in the dev
//                                                         Blob store no row names (read-only)
//
// Only ever touches `<name>+clerk_test@example.com` users, and only deletes DB
// rows on the DEV database. Never use this on real users.
//
// Test users live on the Clerk DEVELOPMENT instance only (sk_test_… key, the
// one Preview and Development use). Production runs a separate Clerk
// production instance (sk_live_…) on app.roamaccess.com.au, where
// `+clerk_test` addresses are not test addresses and sign-in tickets would
// create real sessions — so this script refuses a live key.

import { connectPg } from './lib/pg';
import { deleteUserPhotoFiles, listOrphanPhotoFiles } from './lib/test-user-photos';

const API = 'https://api.clerk.com/v1';
const key = process.env.CLERK_SECRET_KEY;

function emailFor(name: string) {
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(name)) throw new Error('name: lowercase letters, digits and dashes (e.g. "ra-search-1")');
  return `${name}+clerk_test@example.com`;
}

async function clerk<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!key) throw new Error('CLERK_SECRET_KEY is not set — run `npx vercel env pull .env.local --yes`.');
  if (!key.startsWith('sk_test_')) throw new Error('refusing: CLERK_SECRET_KEY is not a development-instance key (sk_test_…). Test users live on the dev instance only — pull the Development env (`npx vercel env pull .env.local --yes --environment development`).');
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

async function signInUrl(userId: string, base: string) {
  const t = await clerk<{ token: string }>('POST', '/sign_in_tokens', { user_id: userId, expires_in_seconds: 3600 });
  return `${base}/sign-in?__clerk_ticket=${t.token}`;
}

async function main() {
  const [cmd, name] = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (cmd === 'orphans') {
    const { client, target } = await connectPg();
    try {
      if (target !== 'dev') throw new Error('refusing: the dev database only');
      const r = await listOrphanPhotoFiles(client);
      console.log(`${r.total} file(s) in the Blob store · ${r.rows} photo row(s) in the dev DB · ${r.orphans.length} file(s) no row names:`);
      for (const o of r.orphans) console.log(`  ${o.pathname}  ${o.size} B  ${o.uploadedAt.toISOString()}`);
      if (r.orphans.length) console.log('Not deleted: they can\'t be tied to a user. Check them by hand.');
    } finally { await client.end(); }
    return;
  }
  const portIdx = process.argv.indexOf('--port');
  const port = portIdx > 0 ? process.argv[portIdx + 1] : '3000';
  const baseIdx = process.argv.indexOf('--base');
  const base = baseIdx > 0 ? new URL(process.argv[baseIdx + 1]).origin : `http://localhost:${port}`;
  if (!cmd || !name) throw new Error('usage: test-user <create|signin|delete> <name> [--port N | --base URL] · test-user orphans');
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
    console.log(`sign in: ${await signInUrl(user.id, base)}`);
    return;
  }

  if (cmd === 'delete') {
    const user = await findUser(email);
    if (!user) { console.log(`no Clerk user ${email}`); return; }
    const { client, target } = await connectPg();
    try {
      if (target !== 'dev') throw new Error('refusing to delete rows outside the dev database');
      // Photo files live in the dev Blob store: delete this user's first and
      // check they're gone (rows cascade from the profile below).
      const ph = await deleteUserPhotoFiles(client, user.id);
      console.log(`deleted ${ph.files} photo file(s) (${ph.photos} photo(s)) from the dev Blob store`);
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
