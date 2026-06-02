// AI.DY — Migration runner
// Connects to Supabase Shared Pooler (IPv4-compatible) and runs all
// SQL migration files in order.
//
// SECURITY: reads SUPABASE_DB_PASSWORD from env var only. NEVER hardcode.
//
// Usage:
//   $env:SUPABASE_DB_PASSWORD = "..." ; node scripts/db-migrate.js
//   SUPABASE_DB_PASSWORD=... node scripts/db-migrate.js
//
// Migration files are read from ./supabase/migrations/ in alphabetical order.
// Use the numeric prefix to control order: 000_init.sql, 010_core.sql, etc.

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
if (!PASSWORD) {
  console.error('ERROR: SUPABASE_DB_PASSWORD env var required.');
  console.error('  PowerShell:  $env:SUPABASE_DB_PASSWORD = "..."');
  console.error('  bash/zsh:    SUPABASE_DB_PASSWORD="..." node scripts/db-migrate.js');
  console.error('  Rotate the password in Supabase Dashboard if it was leaked.');
  process.exit(1);
}

const CONFIG = {
  host: process.env.SUPABASE_DB_HOST || 'aws-1-eu-central-1.pooler.supabase.com',
  port: Number(process.env.SUPABASE_DB_PORT || 6543),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres.qchnindfczaulufazivy',
  password: PASSWORD,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 120_000, // 2 min per statement
};

const MIGRATIONS_DIR = path.resolve('supabase/migrations');

(async () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations dir not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.error(`No .sql files found in ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} migration(s):`);
  files.forEach((f) => console.log(`  - ${f}`));

  const c = new Client(CONFIG);
  await c.connect();
  console.log('Connected. Running migrations...\n');

  for (const file of files) {
    const full = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(full, 'utf-8');
    process.stdout.write(`  ${file} ... `);
    try {
      await c.query('BEGIN');
      await c.query(sql);
      await c.query('COMMIT');
      console.log('OK');
    } catch (err) {
      await c.query('ROLLBACK');
      console.log('FAILED');
      console.error(`\nError in ${file}:`, err.message);
      await c.end();
      process.exit(1);
    }
  }

  // Summary
  const tables = await c.query(`
    SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public'
  `);
  const policies = await c.query(`
    SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'public'
  `);
  const tools = await c.query(`SELECT count(*)::int AS n FROM public.tools`);
  const cats = await c.query(`SELECT count(*)::int AS n FROM public.categories`);

  console.log('\n=== Migration Summary ===');
  console.log(`Tables:    ${tables.rows[0].n}`);
  console.log(`Policies:  ${policies.rows[0].n}`);
  console.log(`Categories: ${cats.rows[0].n}`);
  console.log(`Tools:     ${tools.rows[0].n}`);

  await c.end();
  console.log('\nDone.');
})().catch((err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
