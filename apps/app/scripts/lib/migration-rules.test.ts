// npx tsx scripts/lib/migration-rules.test.ts
import assert from 'node:assert/strict';
import { migrationViolation as v } from './migration-rules';

const ok = [
  `DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'x') THEN\n    ALTER TABLE t ADD CONSTRAINT x CHECK (a > 0);\n  END IF;\nEND $$;`,
  `DO $body$\nBEGIN\n  PERFORM 1;\nEND\n$body$;`,
  `DO $$ BEGIN PERFORM 1; END $$;`,
  `CREATE TABLE IF NOT EXISTS t (id int); -- BEGIN in a comment\n/* COMMIT */`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS x text;\nCREATE INDEX IF NOT EXISTS i ON t (ended_at);`,
  // The one allowed DROP: widen the facilities layer check in the same file.
  `ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_layer_chk;\nALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk CHECK (layer IN ('toilets', 'beach', 'arrival'));`,
  `alter table  facilities\n  drop constraint if exists facilities_layer_chk ;\n-- comment\nALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk\n  CHECK (layer IN ('beach','arrival','toilets'));`,
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
  // The facilities layer swap is allowed only in its exact, safe form.
  [`ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_layer_chk;`, 'DROP'],
  [`ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_layer_chk;\nALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk CHECK (layer IN ('beach', 'arrival'));`, 'DROP'],
  [`ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_layer_chk;\nALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk CHECK (layer IN ('toilets', 'arrival'));`, 'DROP'],
  [`ALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk CHECK (layer IN ('toilets', 'beach', 'arrival'));\nALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_layer_chk;`, 'DROP'],
  [`ALTER TABLE facilities DROP CONSTRAINT facilities_layer_chk;\nALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk CHECK (layer IN ('toilets', 'beach', 'arrival'));`, 'DROP'],
  [`ALTER TABLE venues DROP CONSTRAINT IF EXISTS facilities_layer_chk;\nALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk CHECK (layer IN ('toilets', 'beach', 'arrival'));`, 'DROP'],
  [`ALTER TABLE facilities DROP CONSTRAINT IF EXISTS temp_barriers_target_type_chk;\nALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk CHECK (layer IN ('toilets', 'beach', 'arrival'));`, 'DROP'],
  [`ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_layer_chk;\nALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk CHECK (layer IN ('toilets', 'beach', 'arrival'));\nALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_pkey;`, 'DROP'],
  [`ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_layer_chk;\nALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_layer_chk;\nALTER TABLE facilities ADD CONSTRAINT facilities_layer_chk CHECK (layer IN ('toilets', 'beach', 'arrival'));`, 'DROP'],
  [`DO $$ BEGIN ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_layer_chk; END $$;`, 'DROP'],
];
for (const [s, what] of bad) assert.ok(v(s)?.startsWith(what), `${what} expected for: ${s} (got ${v(s)})`);

console.log(`migration rules: ${ok.length} allowed, ${bad.length} refused — ok`);
