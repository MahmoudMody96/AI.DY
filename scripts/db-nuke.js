// AI.DY — DB reset (full nuke)
// Drops the entire `public` schema and recreates it empty.
// Use only in dev. NEVER run against production data.
//
// SECURITY: reads SUPABASE_DB_PASSWORD from env var only.

import { Client } from 'pg';

const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
if (!PASSWORD) {
  console.error('ERROR: SUPABASE_DB_PASSWORD env var required.');
  process.exit(1);
}

const CONFIG = {
  host: process.env.SUPABASE_DB_HOST || 'aws-1-eu-central-1.pooler.supabase.com',
  port: Number(process.env.SUPABASE_DB_PORT || 6543),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres.qchnindfczaulufazivy',
  password: PASSWORD,
  ssl: { rejectUnauthorized: false },
};

const SQL = `
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON SCHEMA public TO postgres;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT
    ON SEQUENCES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE
    ON FUNCTIONS TO anon, authenticated, service_role;
`;

(async () => {
  const c = new Client(CONFIG);
  await c.connect();
  console.log('Connected. Nuking public schema...');
  await c.query('BEGIN');
  try {
    await c.query(SQL);
    await c.query('COMMIT');
    console.log('OK: schema nuked.');
  } catch (err) {
    await c.query('ROLLBACK');
    console.error('FAILED:', err.message);
    await c.end();
    process.exit(1);
  }
  const r = await c.query(`SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'`);
  console.log(`Verification: ${r.rows[0].n} tables (expect 0).`);
  await c.end();
})().catch((err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
