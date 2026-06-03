// Fetch the post page with auth and inspect the response
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

(async () => {
  const { data: signin, error: signErr } = await admin.auth.signInWithPassword({
    email: 'admin-demo@ai-dy.test',
    password: 'AdminDemo!2026',
  });
  if (signErr) {
    console.error('signin error:', signErr.message);
    process.exit(1);
  }
  const cookie = `sb-${env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token=${encodeURIComponent(JSON.stringify({
    access_token: signin.session.access_token,
    refresh_token: signin.session.refresh_token,
    expires_at: signin.session.expires_at,
    token_type: 'bearer',
    user: signin.session.user,
  }))}`;

  const r = await fetch(
    'https://ai-dy-git-main-mahmouds-projects-97f3fe54.vercel.app/blog/best-ai-writing-tools-2026-arabic',
    { headers: { cookie } }
  );
  console.log('Status:', r.status);
  const text = await r.text();
  // Find the error
  const m = text.match(/<title>([^<]+)/);
  console.log('Title:', m?.[1]);
  // Look for any error indication
  if (text.includes("couldn't load")) {
    console.log('Server error: "couldn\'t load" detected');
  }
  if (text.includes("ERROR 2412140922")) {
    console.log('Found error code 2412140922');
  }
  // Find the next-error-h1
  const errMatch = text.match(/next-error-h1[\s\S]{0,2000}/);
  if (errMatch) console.log('Error block:', errMatch[0].slice(0, 1500));
})();
