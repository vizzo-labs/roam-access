// A node-postgres client on the database lib/db/url.ts picks (unpooled: a
// direct session, so transactions and advisory locks behave).
import { Client } from 'pg';
import { pickDatabaseUrl, describeDatabaseUrl, type DbTarget } from '../../lib/db/url';

export async function connectPg(): Promise<{ client: Client; target: DbTarget; host: string }> {
  const { url, target } = pickDatabaseUrl({ unpooled: true });
  // pg treats sslmode=require as verify-full today and warns about it; say so explicitly.
  const u = new URL(url);
  if (['require', 'prefer', 'verify-ca'].includes(u.searchParams.get('sslmode') || '')) u.searchParams.set('sslmode', 'verify-full');
  const client = new Client({ connectionString: u.toString() });
  await client.connect();
  return { client, target, host: describeDatabaseUrl(url) };
}
