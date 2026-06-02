// ============================================
// AI.DY — Supabase Client (Browser / Client Components)
// ============================================
//
// Use this in `'use client'` components. Reads only NEXT_PUBLIC_* vars.
// ============================================

'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from '@/lib/env';

let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (_client) return _client;
  const env = getPublicEnv();
  _client = createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return _client;
}
