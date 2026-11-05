// Apply SQL migrations from migrations/ in name order, each in its own
// transaction, recording them in `_migrations`. Runs before every build
// (prebuild), against the database lib/db/url.ts picks:
//   Vercel production build → production · previews and local → dev.
//
//   npm run db:migrate              apply pending migrations
//   npm run db:migrate -- --status  list applied / pending, change nothing
//
// SKIP_MIGRATIONS=1 skips (e.g. a build with no database access).
// Rules (see AGENTS.md): additive only, never edit a merged migration.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { connectPg } from './lib/pg';

const DIR = path.join(__dirname, '..', 'migrations');
const NAME = /^\d{12}_[a-z0-9][a-z0-9_-]*\.sql$/;
// Advisory lock key: parallel builds (several previews at once) take turns.
const LOCK = 'roam-access:migrations';

// Destructive statements are refused outright: parallel branches share the
// dev database, and a drop/rename on one breaks every other.
const FORBIDDEN: [RegExp, string][] = [
  [/\bdrop\s+(table|column|index|constraint|schema|type|view|function|trigger|sequence|extension)\b/i, 'DROP'],
  [/\brename\b/i, 'RENAME'],
  [/\btruncate\b/i, 'TRUNCATE'],
  [/\balter\s+column\s+\S+\s+(set\s+data\s+)?type\b/i, 'ALTER COLUMN … TYPE'],
  [/\bdelete\s+from\b/i, 'DELETE FROM'],
  [/^\s*(begin|commit|rollback)\b/im, 'transaction control (the runner wraps each file in a transaction)'],
];

const stripSqlComments = (sql: string) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

function loadFiles() {
  const all = readdirSync(DIR).filter(f => !f.startsWith('.')).sort();
  const bad = all.filter(f => !NAME.test(f));
  if (bad.length) throw new Error(`Bad migration file name(s): ${bad.join(', ')} — use YYYYMMDDHHMM_<slug>.sql`);
  return all.map(name => {
    const sql = readFileSync(path.join(DIR, name), 'utf8');
    const code = stripSqlComments(sql);
    for (const [re, what] of FORBIDDEN) {
      if (re.test(code)) throw new Error(`${name}: ${what} is not allowed — migrations are additive only (see AGENTS.md).`);
    }
    return { name, sql, checksum: sha(sql) };
  });
}

async function main() {
  if (process.env.SKIP_MIGRATIONS === '1') { console.log('[migrate] SKIP_MIGRATIONS=1 — skipping.'); return; }
  const statusOnly = process.argv.includes('--status');
  const files = loadFiles();
  const { client, target, host } = await connectPg();
  console.log(`[migrate] ${target} database (${host}) · ${files.length} migration file(s)`);
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS _migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamp with time zone NOT NULL DEFAULT now()
    )`);
    let applied = 0;
    for (const f of files) {
      await client.query('BEGIN');
      try {
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [LOCK]);
        const { rows } = await client.query<{ checksum: string }>('SELECT checksum FROM _migrations WHERE name = $1', [f.name]);
        if (rows.length) {
          await client.query('COMMIT');
          if (rows[0].checksum !== f.checksum) {
            console.warn(`[migrate] WARNING ${f.name} changed after it was applied here (never edit an applied migration — add a new file).`);
          }
          if (statusOnly) console.log(`  applied  ${f.name}`);
          continue;
        }
        if (statusOnly) { await client.query('ROLLBACK'); console.log(`  PENDING  ${f.name}`); continue; }
        await client.query(f.sql);
        await client.query('INSERT INTO _migrations (name, checksum) VALUES ($1, $2)', [f.name, f.checksum]);
        await client.query('COMMIT');
        applied++;
        console.log(`[migrate] applied ${f.name}`);
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw new Error(`${f.name} failed and was rolled back: ${(e as Error).message}`);
      }
    }
    if (!statusOnly) console.log(applied ? `[migrate] done — ${applied} applied.` : '[migrate] up to date.');
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(`[migrate] ${(e as Error).message}`); process.exit(1); });
