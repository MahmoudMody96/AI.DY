// Generate a magic-link for the test admin, then return the URL
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = 'admin-demo@ai-dy.test';
const SITE_URL = 'https://ai-dy-git-main-mahmouds-projects-97f3fe54.vercel.app';

(async () => {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_EMAIL,
    options: { redirectTo: SITE_URL + '/auth/callback?next=/admin' },
  });
  if (error) {
    console.error('generateLink error:', error.message);
    process.exit(1);
  }
  // Rewrite redirect_to in the action_link to our site
  const url = new URL(data.properties.action_link);
  url.searchParams.set('redirect_to', SITE_URL + '/auth/callback?next=/admin');
  console.log('ACTION_LINK=' + url.toString());
})();
