// One-shot script: create admin user + log in to test the admin dashboard.
// Uses the service role key from .env.local. Run with: node scripts/admin-demo.mjs

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve('.env.local');
const envText = fs.readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = 'admin-demo@ai-dy.test';
const TEST_PASSWORD = 'AdminDemo!2026';
const TEST_NAME = 'Admin Demo';

(async () => {
  console.log('1. Creating / finding test user…');
  // List users and check if it exists
  const { data: list } = await admin.auth.admin.listUsers();
  let user = list?.users?.find((u) => u.email === TEST_EMAIL);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: TEST_NAME },
    });
    if (error) {
      console.error('  createUser failed:', error.message);
      process.exit(1);
    }
    user = data.user;
    console.log('  ✓ created user', user.id);
  } else {
    console.log('  ✓ user already exists', user.id);
  }

  console.log('2. Upserting profile row to super_admin…');
  const { error: upsertErr } = await admin
    .from('profiles')
    .upsert(
      { id: user.id, role: 'super_admin', display_name: TEST_NAME, email: TEST_EMAIL },
      { onConflict: 'id' }
    );
  if (upsertErr) {
    console.error('  profile upsert failed:', upsertErr.message);
    process.exit(1);
  }
  console.log('  ✓ role = super_admin');

  console.log('3. Output for Playwright…');
  console.log('---');
  console.log('EMAIL=' + TEST_EMAIL);
  console.log('PASSWORD=' + TEST_PASSWORD);
  console.log('---');
})();
