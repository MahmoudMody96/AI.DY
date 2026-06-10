// AI.DY — Phase 4.0: Seed 1 demo sponsored slot (chatgpt → homepage_hero)
// Idempotent — safe to re-run.
//
// Usage:
//   $env:SUPABASE_DB_PASSWORD = "..." ; node scripts/seed-sponsored-demo.mjs

import { Client } from "pg";

const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
if (!PASSWORD) {
  console.error("ERROR: SUPABASE_DB_PASSWORD env var required.");
  process.exit(1);
}

const CONFIG = {
  host: process.env.SUPABASE_DB_HOST || "aws-1-eu-central-1.pooler.supabase.com",
  port: Number(process.env.SUPABASE_DB_PORT || 6543),
  database: process.env.SUPABASE_DB_NAME || "postgres",
  user: process.env.SUPABASE_DB_USER || "postgres.qchnindfczaulufazivy",
  password: PASSWORD,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 30_000,
};

const c = new Client(CONFIG);
await c.connect();

try {
  // Find chatgpt tool id
  const toolRes = await c.query(
    `SELECT id FROM public.tools WHERE slug = 'chatgpt' LIMIT 1`
  );
  if (toolRes.rows.length === 0) {
    console.error("Tool 'chatgpt' not found — run pnpm db:reset / 090_seed first.");
    process.exit(1);
  }
  const toolId = toolRes.rows[0].id;

  // First: heal any orphan slot whose tool_id no longer points to a real tool.
  // This can happen if a seed ran before the table was fully populated and the
  // tool was created later with a fresh UUID.
  const orphan = await c.query(`
    UPDATE public.sponsored_slots s
    SET tool_id = $1
    WHERE NOT EXISTS (SELECT 1 FROM public.tools t WHERE t.id = s.tool_id)
    RETURNING id
  `, [toolId]);
  if (orphan.rows.length > 0) {
    console.log(`Healed ${orphan.rows.length} orphan slot(s) → chatgpt (${toolId})`);
  }

  // Look up any existing active homepage_hero slot for this tool
  const existRes = await c.query(
    `SELECT id FROM public.sponsored_slots
     WHERE position = 'homepage_hero'
       AND tool_id = $1
       AND status = 'active'
       AND ends_at > now()
     LIMIT 1`,
    [toolId]
  );
  if (existRes.rows.length > 0) {
    console.log(`Demo slot already exists: ${existRes.rows[0].id}`);
  } else {
    // Insert a 30-day slot for chatgpt → homepage_hero
    const ins = await c.query(
      `INSERT INTO public.sponsored_slots
        (position, tool_id, starts_at, ends_at, status, note)
       VALUES
        ('homepage_hero', $1, now(), now() + interval '30 days', 'active',
         'Demo slot — Phase 4.0 (replace with real campaign)')
       RETURNING id, position, starts_at, ends_at`,
      [toolId]
    );
    console.log(`Inserted demo slot ${ins.rows[0].id}:`);
    console.log(`  position: ${ins.rows[0].position}`);
    console.log(`  window:   ${ins.rows[0].starts_at.toISOString()} → ${ins.rows[0].ends_at.toISOString()}`);
  }

  // Also seed chatgpt.affiliate_url so the affiliate button is visible
  // Use DO block — works whether or not the column exists, and is
  // idempotent without needing a separate SELECT-then-conditional.
  await c.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='tools' AND column_name='affiliate_url'
      ) THEN
        UPDATE public.tools
        SET affiliate_url = 'https://chatgpt.com/?ref=aidy-demo'
        WHERE slug = 'chatgpt' AND affiliate_url IS NULL;
      END IF;
    END $$;
  `);
  const affRes = await c.query(
    `SELECT affiliate_url FROM public.tools WHERE slug = 'chatgpt' LIMIT 1`
  );
  console.log(`chatgpt.affiliate_url: ${affRes.rows[0]?.affiliate_url ?? "(null — affiliate_url column missing)"}`);
} finally {
  await c.end();
}
