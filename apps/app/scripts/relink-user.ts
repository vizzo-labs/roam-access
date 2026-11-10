// Move one person's rows from an old Clerk user id to a new one.
//
// Why: Clerk development and production instances have separate users, so a
// person who signed up on the dev instance gets a NEW user id on production.
// Every row we hold for them (profile, reviews, saved places, photos …) is
// keyed by the old id. This moves all of it, in one transaction, to the new id.
//
//   npm run relink-user -- --from user_OLD --to user_NEW              dry run (dev DB)
//   npm run relink-user -- --from user_OLD --to user_NEW --apply      write (dev DB)
//
// Production (only with the founder's explicit go, see AGENTS.md):
//   VERCEL_ENV=production npm run relink-user -- --from … --to … --production [--apply]
//
// Rules:
// - Dry run unless --apply. A dry run prints row counts per table and writes nothing.
// - The production database needs --production as well as VERCEL_ENV=production.
// - The new id may already have a profile only if it is EMPTY (made by the first
//   sign-in, nothing else hangs off it): that empty profile is replaced. If the new
//   id has any reviews, saved places … we stop — merging needs a person to decide.
// - The old profile row is copied to the new id (same name, needs, public_id …),
//   every column that points at it is moved, then the old row is removed. Counts
//   are checked before COMMIT; any mismatch rolls everything back.
// - Prints ids and counts only — never names, emails or needs.

import { connectPg } from './lib/pg';

// Columns that hold a user id but have no foreign key to profiles (audit fields).
// Foreign-key columns are discovered from the database itself.
const LOOSE: [string, string][] = [
  ['user_roles', 'granted_by'],
  ['venue_claims', 'decided_by'],
  ['mapping_events', 'created_by'],
  ['venue_badges', 'added_by'],
  ['venue_entrances', 'located_by'],
  ['review_reports', 'decided_by'],
];

const ID = /^user_[A-Za-z0-9]{10,64}$/;
const ident = (s: string) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error(`unexpected identifier ${s}`);
  return `"${s}"`;
};

function arg(name: string) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

type Col = { tbl: string; col: string };

async function main() {
  const from = arg('--from');
  const to = arg('--to');
  const apply = process.argv.includes('--apply');
  const wantProd = process.argv.includes('--production');
  if (!from || !to || !ID.test(from) || !ID.test(to)) throw new Error('usage: relink-user --from user_OLD --to user_NEW [--apply] [--production]');
  if (from === to) throw new Error('--from and --to are the same id');

  const { client, target, host } = await connectPg();
  try {
    if (target === 'production' && !wantProd) throw new Error(`refusing: this is the PRODUCTION database (${host}). Add --production if that is really what you mean.`);
    if (target !== 'production' && wantProd) throw new Error(`refusing: --production given but the database is ${target} (${host}). Set VERCEL_ENV=production.`);
    console.log(`database: ${target} (${host}) · ${apply ? 'APPLY' : 'dry run'} · ${from} → ${to}`);

    const fks = (await client.query<{ tbl: string; col: string }>(`
      SELECT c.conrelid::regclass::text AS tbl, a.attname AS col
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f' AND c.confrelid = 'profiles'::regclass
      ORDER BY 1, 2`)).rows;
    const existing = new Set((await client.query<{ k: string }>(
      `SELECT table_name || '.' || column_name AS k FROM information_schema.columns WHERE table_schema = 'public'`)).rows.map(r => r.k));
    const loose = LOOSE.filter(([t, c]) => existing.has(`${t}.${c}`)).map(([tbl, col]) => ({ tbl, col }));
    const cols: Col[] = [...fks, ...loose];

    const count = async (c: Col, id: string) =>
      (await client.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${ident(c.tbl)} WHERE ${ident(c.col)} = $1`, [id])).rows[0].n;
    const profileOf = async (id: string) =>
      (await client.query<{ public_id: string }>('SELECT public_id FROM profiles WHERE user_id = $1', [id])).rows[0];
    const tally = async (id: string) => {
      const m = new Map<string, number>();
      for (const c of cols) m.set(`${c.tbl}.${c.col}`, await count(c, id));
      return m;
    };
    const show = (m: Map<string, number>) => [...m].filter(([, n]) => n).map(([k, n]) => `${k}=${n}`).join(' ') || '(none)';

    await client.query('BEGIN');
    const oldProfile = await profileOf(from);
    if (!oldProfile) throw new Error(`no profile for ${from} — nothing to move`);
    const before = await tally(from);
    const newProfile = await profileOf(to);
    const newRows = await tally(to);
    console.log(`old ${from}: profile yes · ${show(before)}`);
    console.log(`new ${to}: profile ${newProfile ? 'yes' : 'no'} · ${show(newRows)}`);
    if ([...newRows.values()].some(n => n > 0)) {
      throw new Error(`refusing: ${to} already has rows of its own — merge by hand`);
    }

    if (!apply) {
      await client.query('ROLLBACK');
      console.log(`dry run: would ${newProfile ? 'replace the empty new profile, ' : ''}copy the profile and move ${[...before.values()].reduce((a, b) => a + b, 0)} row(s). Nothing written. Add --apply to do it.`);
      return;
    }

    // 1 · An empty profile the new id made on its first sign-in gives way.
    if (newProfile) await client.query('DELETE FROM profiles WHERE user_id = $1', [to]);

    // 2 · Copy the old profile to the new id (a placeholder public_id while both rows exist).
    const pcols = (await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles'
       AND column_name NOT IN ('user_id', 'public_id') ORDER BY ordinal_position`)).rows.map(r => ident(r.column_name));
    await client.query(
      `INSERT INTO profiles (user_id, public_id, ${pcols.join(', ')})
       SELECT $2, 'relink' || substr(md5(random()::text), 1, 10), ${pcols.join(', ')} FROM profiles WHERE user_id = $1`, [from, to]);

    // 3 · Move every row that points at the old id.
    for (const c of cols) {
      await client.query(`UPDATE ${ident(c.tbl)} SET ${ident(c.col)} = $2 WHERE ${ident(c.col)} = $1`, [from, to]);
    }

    // 4 · Remove the old profile (nothing points at it now) and give its public_id
    //     to the new one, so /u/<public_id> links keep working.
    await client.query('DELETE FROM profiles WHERE user_id = $1', [from]);
    await client.query('UPDATE profiles SET public_id = $2 WHERE user_id = $1', [to, oldProfile.public_id]);

    // 5 · Check, then commit.
    const after = await tally(to);
    const left = await tally(from);
    const ok = [...before].every(([k, n]) => after.get(k) === n) && [...left.values()].every(n => n === 0)
      && !(await profileOf(from)) && (await profileOf(to))?.public_id === oldProfile.public_id;
    if (!ok) {
      await client.query('ROLLBACK');
      throw new Error(`counts don't match — rolled back. before ${show(before)} · after ${show(after)} · left ${show(left)}`);
    }
    await client.query('COMMIT');
    console.log(`done: ${to} now has profile yes · ${show(after)}; ${from} has nothing left.`);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error((e as Error).message); process.exit(1); });
