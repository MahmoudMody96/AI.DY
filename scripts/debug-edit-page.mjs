// Fetch the page with auth context and log the error
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const cookieProjectRef = url.split('//')[1].split('.')[0];

(async () => {
  const { data: signin, error: signErr } = await admin.auth.signInWithPassword({
    email: 'admin-demo@ai-dy.test',
    password: 'AdminDemo!2026',
  });
  if (signErr) {
    console.error('signin error:', signErr.message);
    process.exit(1);
  }
  const cookieValue = encodeURIComponent(JSON.stringify({
    access_token: signin.session.access_token,
    refresh_token: signin.session.refresh_token,
    expires_at: signin.session.expires_at,
    expires_in: signin.session.expires_in,
    token_type: 'bearer',
    user: signin.session.user,
  }));
  const cookie = `sb-${cookieProjectRef}-auth-token=${cookieValue}`;

  const r = await fetch(
    'https://ai-dy-git-main-mahmouds-projects-97f3fe54.vercel.app/admin/tools/bec6e5ee-4d11-4497-8fe6-c26135506315/edit',
    { headers: { cookie } }
  );
  console.log('Status:', r.status);
  const text = await r.text();
  const title = text.match(/<title>([^<]+)/);
  if (title) console.log('Title:', title[1]);
  const m = text.match(/errorCode[\s\S]{0,500}/i);
  if (m) console.log('Error code:', m[0].slice(0, 500));
  // look for digest error
  const digest = text.match(/digest[\s\S]{0,200}/i);
  if (digest) console.log('Digest:', digest[0].slice(0, 200));
  // log first 500 chars of body
  const body = text.match(/<body[\s\S]{0,3000}/);
  if (body) console.log('Body excerpt:', body[0].slice(0, 1500));
})();
