import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { pickDatabaseUrl } from './url';

function createDb() {
  // Production deployments use DATABASE_URL; everything else the dev database.
  const { url } = pickDatabaseUrl();
  return drizzle(neon(url), { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

// Lazy: importing this module must never touch the network or env at build time.
export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}

export { schema };
export { pickDatabaseUrl } from './url';
