const { Client } = require('pg');
(async () => {
  const c = new Client({host: 'aws-1-eu-central-1.pooler.supabase.com', port: 6543, database: 'postgres', user: 'postgres.qchnindfczaulufazivy', password: 'Kemo_prompt@2026', ssl: {rejectUnauthorized: false}});
  await c.connect();
  const t = await c.query("SELECT id, slug, name, rating_avg, rating_count FROM public.tools WHERE slug = 'chatgpt'");
  console.log('ChatGPT:', t.rows[0]);
  await c.end();
})();
