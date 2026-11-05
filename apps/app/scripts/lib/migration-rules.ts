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

/** The first rule a migration breaks, or null if it's allowed. */
export function migrationViolation(sql: string): string | null {
  const code = stripSqlComments(sql);
  for (const [re, what] of DESTRUCTIVE) if (re.test(code)) return what;
  if (TRANSACTION.test(stripDollarQuoted(code))) return 'transaction control (the runner wraps each file in a transaction)';
  return null;
}
