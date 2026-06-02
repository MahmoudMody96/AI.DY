// AI.DY — Tools API: GET /api/tools
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseOrError } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const result = await getSupabaseOrError();
  if (result instanceof Response) return result;

  const supabase = result;
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const sort = searchParams.get('sort') || 'rating';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));

  let query = supabase
    .from('tools')
    .select(
      `
      id, slug, name, name_en, tagline, description, website_url, logo_url,
      pricing_type, starting_price, monthly_price, rating_avg, rating_count,
      views_count, is_featured, status, is_published, tags,
      category:categories(id, slug, name, name_en, color, icon)
    `,
      { count: 'exact' }
    )
    .eq('is_published', true)
    .eq('status', 'published');

  if (slug) query = query.eq('slug', slug).limit(1);
  if (category) query = query.eq('category.slug', category);
  if (featured === 'true') query = query.eq('is_featured', true);

  if (sort === 'rating') query = query.order('rating_avg', { ascending: false });
  else if (sort === 'newest') query = query.order('created_at', { ascending: false });
  else if (sort === 'popular') query = query.order('views_count', { ascending: false });
  else if (sort === 'name') query = query.order('name', { ascending: true });

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data,
    meta: { total: count, page, limit, total_pages: count ? Math.ceil(count / limit) : 0 },
  });
}
