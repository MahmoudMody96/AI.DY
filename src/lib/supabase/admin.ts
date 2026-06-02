// ============================================
// AI.DY — Supabase Admin Client (Service Role, Bypasses RLS)
// ============================================
//
// USE WITH CAUTION. This client has full DB access. Only use in:
//   - Migration scripts
//   - Webhook handlers
//   - Admin-triggered Server Actions (after role check)
// NEVER expose to the client.
// ============================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';

let _admin: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient | null {
  if (_admin) return _admin;
  const env = getServerEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[supabase:admin] SUPABASE_SERVICE_ROLE_KEY not set — admin client disabled');
    }
    return null;
  }
  _admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
