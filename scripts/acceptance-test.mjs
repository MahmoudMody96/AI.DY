// Final acceptance test: full UGC flow on live site
import { Client } from 'pg';

const c = new Client({
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT),
  database: process.env.SUPABASE_DB_NAME,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: false,
});
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MAIN = 'https://ai-dy-git-main-mahmouds-projects-97f3fe54.vercel.app';

(async () => {
  await c.connect();
  const author = (await c.query('SELECT id, display_name FROM public.profiles LIMIT 1')).rows[0];
  if (!author) {
    console.log('no profile');
    await c.end();
    return;
  }
  console.log('Using author:', author);

  // 1. Insert 3 published + 1 draft
  const slugs = [];
  for (let i = 1; i <= 3; i++) {
    const slug = `final-test-${i}-${Date.now()}`;
    await c.query(
      `INSERT INTO public.user_posts (slug, title, excerpt, body, author_id, status, reading_time, published_at)
       VALUES ($1, $2, $3, $4, $5, 'published', 3, now())`,
      [slug, `Final Test Post #${i}`, `Excerpt ${i}`, `Body ${i}`, author.id]
    );
    slugs.push(slug);
  }
  // 1 draft
  const draftSlug = `final-draft-${Date.now()}`;
  await c.query(
    `INSERT INTO public.user_posts (slug, title, excerpt, body, author_id, status, reading_time)
     VALUES ($1, 'DRAFT - should be hidden', 'x', 'y', $2, 'draft', 1)`,
    [draftSlug, author.id]
  );
  console.log('Inserted:', [...slugs, 'DRAFT:' + draftSlug]);

  // 2. /blog should list the 3 published
  const blog = await (await fetch(MAIN + '/blog')).text();
  const publishedHits = slugs.filter((s) => blog.includes(s)).length;
  console.log('/blog published posts visible:', publishedHits + '/3');
  console.log('/blog draft visible (should be 0):', blog.includes(draftSlug) ? 1 : 0);

  // 3. /blog/[slug] should 200 for published, 404 for draft
  for (const slug of slugs) {
    const r = await fetch(MAIN + '/blog/' + slug);
    console.log('  /blog/' + slug.slice(0, 30) + '... ->', r.status);
  }
  const draftR = await fetch(MAIN + '/blog/' + draftSlug);
  console.log('  /blog/' + draftSlug.slice(0, 30) + '... (draft) ->', draftR.status, '(expect 404)');

  // 4. /api/user/posts
  const api = await fetch(SUPABASE_URL + '/rest/v1/user_posts?slug=in.(' + slugs.join(',') + ')&select=slug,title,reading_time', { headers: { apikey: ANON } });
  const apiData = await api.json();
  console.log('Rest API posts visible:', apiData.length + '/3');
  console.log('Rest API reading_time column working:', apiData.every((p) => 'reading_time' in p && p.reading_time === 3));

  // 5. RLS: anon should NOT see draft
  const draftApi = await fetch(SUPABASE_URL + '/rest/v1/user_posts?slug=eq.' + draftSlug + '&select=slug', { headers: { apikey: ANON } });
  const draftData = await draftApi.json();
  console.log('Anon sees draft (should be 0 rows):', draftData.length);

  // 6. Cleanup
  await c.query('DELETE FROM public.user_posts WHERE slug = ANY($1)', [slugs]);
  await c.query('DELETE FROM public.user_posts WHERE slug = $1', [draftSlug]);
  console.log('Cleaned up.');
  await c.end();
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});
