// Check if post data exists in DB
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
  const slug = 'best-ai-writing-tools-2026-arabic';
  const { data, error } = await admin
    .from('articles')
    .select('id, slug, title, content_mdx, views_count, author_id, category_id')
    .eq('slug', slug)
    .maybeSingle();
  console.log('Article query:', { error: error?.message, hasData: !!data });
  if (data) {
    console.log('id:', data.id);
    console.log('title:', data.title);
    console.log('content length:', data.content_mdx?.length);
    console.log('views_count:', data.views_count);
    console.log('author_id:', data.author_id);
    console.log('category_id:', data.category_id);
    console.log('first 100 chars:', data.content_mdx?.slice(0, 100));
  } else {
    // Try all articles
    const { data: all } = await admin.from('articles').select('slug, title');
    console.log('All articles:', all);
  }
})();
