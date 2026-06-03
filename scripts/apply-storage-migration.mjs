// Apply the storage migration to create the "media" bucket
import { Client } from 'pg';
import fs from 'fs';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const sql = fs.readFileSync('supabase/migrations/100_media_storage.sql', 'utf-8');
const c = new Client({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT),
  database: env.SUPABASE_DB_NAME,
  user: env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 60000,
});

(async () => {
  await c.connect();
  console.log('Running migration 100_media_storage.sql...');
  await c.query(sql);
  console.log('OK');
  const { rows } = await c.query(
    "SELECT id, name, public FROM storage.buckets WHERE id = 'media'"
  );
  console.log('Bucket:', rows);
  await c.end();
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
