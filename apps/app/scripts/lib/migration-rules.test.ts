// npx tsx scripts/lib/migration-rules.test.ts
import assert from 'node:assert/strict';
import { migrationViolation as v } from './migration-rules';

const ok = [
  `DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'x') THEN\n    ALTER TABLE t ADD CONSTRAINT x CHECK (a > 0);\n  END IF;\nEND $$;`,
  `DO $body$\nBEGIN\n  PERFORM 1;\nEND\n$body$;`,
  `DO $$ BEGIN PERFORM 1; END $$;`,
  `CREATE TABLE IF NOT EXISTS t (id int); -- BEGIN in a comment\n/* COMMIT */`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS x text;\nCREATE INDEX IF NOT EXISTS i ON t (ended_at);`,
];
for (const s of ok) assert.equal(v(s), null, s);

const bad: [string, string][] = [
  [`BEGIN;\nCREATE TABLE t (id int);\nCOMMIT;`, 'transaction'],
  [`CREATE TABLE t (id int);\nCOMMIT;`, 'transaction'],
  [`START TRANSACTION;`, 'transaction'],
  [`DO $$ BEGIN PERFORM 1; END $$;\nEND;`, 'transaction'],
  [`ROLLBACK;`, 'transaction'],
  [`DO $$ BEGIN DROP TABLE t; END $$;`, 'DROP'],
  [`ALTER TABLE t DROP COLUMN x;`, 'DROP'],
  [`DELETE FROM t;`, 'DELETE FROM'],
  [`ALTER TABLE t RENAME TO u;`, 'RENAME'],
];
for (const [s, what] of bad) assert.ok(v(s)?.startsWith(what), `${what} expected for: ${s} (got ${v(s)})`);

console.log(`migration rules: ${ok.length} allowed, ${bad.length} refused — ok`);
