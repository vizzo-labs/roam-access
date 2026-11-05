import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // Unpooled URL: migrations need a direct session, not the pooler.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! },
});
