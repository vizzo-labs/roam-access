import { defineConfig } from 'drizzle-kit';
import { pickDatabaseUrl } from './lib/db/url';

// Schema changes go through SQL files in migrations/ (npm run db:migrate) —
// never `drizzle-kit push`, which can drop columns another branch added.
// This config is kept for read-only tools (`drizzle-kit studio`) and for
// drafting SQL with `drizzle-kit generate --out /tmp/draft`.
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // Same rule as the app (dev DB unless VERCEL_ENV=production); unpooled for a direct session.
  dbCredentials: { url: pickDatabaseUrl({ unpooled: true }).url },
});
