// What a migration file may contain (see AGENTS.md → Migrations). Pure, so it
// can be checked without a database: `npx tsx scripts/lib/migration-rules.test.ts`.
//
// Destructive statements are refused outright: parallel branches share the
// dev database, and a drop/rename on one breaks every other. These are checked
// everywhere, including inside DO $$ … $$ bodies.
const DESTRUCTIVE: [RegExp, string][] = [
  [/\bdrop\s+(table|column|index|constraint|schema|type|view|function|trigger|sequence|extension)\b/i, 'DROP'],
  [/\brename\b/i, 'RENAME'],
  [/\btruncate\b/i, 'TRUNCATE'],
  [/\balter\s+column\s+\S+\s+(set\s+data\s+)?type\b/i, 'ALTER COLUMN … TYPE'],
  [/\bdelete\s+from\b/i, 'DELETE FROM'],
];

// Transaction control — the runner wraps each file in its own transaction.
// Checked only OUTSIDE dollar-quoted bodies, so a PL/pgSQL block
// (DO $$ BEGIN … END $$;) is fine: its BEGIN/END are not transaction control.
const TRANSACTION = /^\s*(begin|commit|rollback|abort|end|start\s+transaction|savepoint|release(\s+savepoint)?)\b/im;

export const stripSqlComments = (sql: string) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');

/** Replace every $tag$ … $tag$ body with an empty one. */
export const stripDollarQuoted = (sql: string) => sql.replace(/\$([A-Za-z_][A-Za-z0-9_]*)?\$[\s\S]*?\$\1\$/g, '$$$$');

// The ONE allowed DROP: swapping the `facilities.layer` check for a wider one
// (I2 added the 'arrival' layer). A CHECK can't be widened in place, so the
// file may drop `facilities_layer_chk` only if it re-adds it, after the drop,
// with a list that still holds 'toilets' and 'beach'. The file runs in one
// transaction, so the table is never left without a check. Nothing else.
const FACILITIES_LAYER_DROP = /alter\s+table\s+(?:public\.)?facilities\s+drop\s+constraint\s+if\s+exists\s+facilities_layer_chk\s*;/gi;
const FACILITIES_LAYER_ADD = /alter\s+table\s+(?:public\.)?facilities\s+add\s+constraint\s+facilities_layer_chk\s+check\s*\(\s*layer\s+in\s*\(([^)]*)\)\s*\)\s*;/i;

/** Remove the facilities layer-check swap when it's well-formed (see above). */
export function allowFacilitiesLayerSwap(code: string): string {
  const drops = [...code.matchAll(FACILITIES_LAYER_DROP)];
  if (drops.length !== 1) return code;
  const drop = drops[0];
  const after = code.slice(drop.index! + drop[0].length);
  const add = FACILITIES_LAYER_ADD.exec(after);
  if (!add) return code;
  const values = add[1].split(',').map(x => x.trim().toLowerCase());
  if (!values.includes("'toilets'") || !values.includes("'beach'")) return code;
  return code.slice(0, drop.index!) + code.slice(drop.index! + drop[0].length);
}

/** The first rule a migration breaks, or null if it's allowed. */
export function migrationViolation(sql: string): string | null {
  const code = allowFacilitiesLayerSwap(stripSqlComments(sql));
  for (const [re, what] of DESTRUCTIVE) if (re.test(code)) return what;
  if (TRANSACTION.test(stripDollarQuoted(code))) return 'transaction control (the runner wraps each file in a transaction)';
  return null;
}
