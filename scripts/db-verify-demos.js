// AI.DY — Verify the 3 reference chat demos
const { Client } = require('pg');
(async () => {
  const c = new Client({
    host: 'aws-1-eu-central-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.qchnindfczaulufazivy',
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const t = await c.query(
    "SELECT slug, name, demo_type, demo_config FROM public.tools WHERE slug IN ('chatgpt','claude','gemini') ORDER BY slug"
  );
  for (const r of t.rows) {
    console.log(r.slug, '|', r.demo_type, '|', JSON.stringify(r.demo_config));
  }
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
