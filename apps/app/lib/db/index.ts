import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set — run `vercel env pull`.');
  return drizzle(neon(url), { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

// Lazy: importing this module must never touch the network or env at build time.
export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}

export { schema };
