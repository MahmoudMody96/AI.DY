// AI.DY — Categories API: GET /api/categories
import { NextResponse } from 'next/server';
import { getSupabaseOrError } from '@/lib/supabase/server';

export async function GET() {
  const result = await getSupabaseOrError();
  if (result instanceof Response) return result;

  const supabase = result;
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, name_en, description, icon, color, position')
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
