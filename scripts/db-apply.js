// AI.DY — apply a single migration file (idempotent safe)
// Usage: node scripts/db-apply.js <filename.sql>
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
if (!PASSWORD) { console.error('ERROR: SUPABASE_DB_PASSWORD env var required.'); process.exit(1); }

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/db-apply.js <migration-file.sql>'); process.exit(1); }

const full = path.resolve('supabase/migrations', file);
if (!fs.existsSync(full)) { console.error(`File not found: ${full}`); process.exit(1); }

const sql = fs.readFileSync(full, 'utf-8');
const c = new Client({
  host: process.env.SUPABASE_DB_HOST || 'aws-1-eu-central-1.pooler.supabase.com',
  port: +(process.env.SUPABASE_DB_PORT || 6543),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres.qchnindfczaulufazivy',
  password: PASSWORD,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 120_000,
});

(async () => {
  console.log(`Applying: ${file}`);
  await c.connect();
  try {
    await c.query('BEGIN');
    await c.query(sql);
    await c.query('COMMIT');
    console.log('OK');
  } catch (err) {
    await c.query('ROLLBACK');
    console.error('FAILED:', err.message);
    process.exit(1);
  }
  await c.end();
})();
