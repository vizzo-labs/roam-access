// Read-only `\d`-style dump of the schema: columns, constraints, indexes and
// applied migrations. Compare two databases by diffing the output.
//
//   npm run db:describe            # the database lib/db/url.ts picks (dev locally)

import { connectPg } from './lib/pg';

async function main() {
  const { client, target, host } = await connectPg();
  try {
    await client.query('SET default_transaction_read_only = on');
    console.log(`# ${target} database (${host})\n`);

    const cols = await client.query(`
      select table_name, column_name, format_type(a.atttypid, a.atttypmod) as type,
             is_nullable, column_default
      from information_schema.columns c
      join pg_attribute a on a.attrelid = (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass
                         and a.attname = c.column_name
      where c.table_schema = 'public'
      order by table_name, ordinal_position`);
    let last = '';
    for (const r of cols.rows) {
      if (r.table_name !== last) { console.log(`\n## ${r.table_name}`); last = r.table_name; }
      console.log(`  ${r.column_name.padEnd(14)} ${r.type.padEnd(26)} ${r.is_nullable === 'NO' ? 'not null' : 'null    '} ${r.column_default ?? ''}`);
    }

    const cons = await client.query(`
      select conrelid::regclass::text as tbl, conname, pg_get_constraintdef(oid) as def
      from pg_constraint where connamespace = 'public'::regnamespace and contype <> 'n'
      order by 1, 2`);
    console.log('\n## constraints');
    for (const r of cons.rows) console.log(`  ${r.tbl}.${r.conname}: ${r.def}`);

    const idx = await client.query(`select indexdef from pg_indexes where schemaname = 'public' order by tablename, indexname`);
    console.log('\n## indexes');
    for (const r of idx.rows) console.log(`  ${r.indexdef}`);

    const has = await client.query(`select to_regclass('public._migrations') is not null as ok`);
    console.log('\n## applied migrations');
    if (has.rows[0].ok) {
      const m = await client.query('select name, applied_at from _migrations order by name');
      for (const r of m.rows) console.log(`  ${r.name}  ${r.applied_at.toISOString()}`);
      if (!m.rows.length) console.log('  (none)');
    } else console.log('  (no _migrations table yet)');
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
