// ============================================
// AI.DY — Supabase Admin Client (Service Role, Bypasses RLS)
// + getAdminUser() helper (User-Scoped, Throws if Not Admin)
// ============================================
//
// TWO ENTRY POINTS:
//
//   1) createAdminClient()  — service-role client, BYPASSES RLS.
//      USE WITH CAUTION. Only use in:
//        - Migration scripts
//        - Webhook handlers
//        - Admin-triggered Server Actions (after role check)
//      NEVER expose to the client.
//
//   2) getAdminUser()       — user-scoped helper that THROWS if the
//      current request's user is not an admin. Use in Server Components,
//      Server Actions, and Route Handlers to enforce role-based access
//      in a single line. Internally uses the cookie-aware Supabase client
//      so it respects RLS and reads the actual auth session.
//
// Both are server-only — `import "server-only"` will fail any client
// bundle that tries to pull this in.
// ============================================

import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';
import { createClient } from './server';

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
  _admin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

// ============================================
// getAdminUser() — throws if request has no admin
// ============================================

export type AdminUser = {
  id: string;
  email: string;
  profile: {
    id: string;
    role: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

/**
 * Resolve the currently authenticated user and assert they have an admin
 * role in `public.profiles`. Throws on:
 *   - Supabase not configured
 *   - No active session
 *   - Profile row missing
 *   - Role not in ('admin', 'super_admin')
 *
 * Use in Server Components / Server Actions / Route Handlers:
 *
 *   const admin = await getAdminUser();
 *   // safe to call admin-only operations
 *
 * For pages that want a redirect (instead of a thrown error), wrap in a
 * try/catch and call `redirect('/?error=admin_required')`.
 */
export async function getAdminUser(): Promise<AdminUser> {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('[getAdminUser] Supabase client unavailable');
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    throw new Error('[getAdminUser] Not authenticated');
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, role, display_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle<{
      id: string;
      role: string;
      display_name: string | null;
      avatar_url: string | null;
      email: string | null;
    }>();

  if (profileErr) {
    throw new Error(`[getAdminUser] Profile lookup failed: ${profileErr.message}`);
  }
  if (!profile) {
    throw new Error('[getAdminUser] Profile row missing for authenticated user');
  }
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    throw new Error(`[getAdminUser] Admin role required (got: ${profile.role})`);
  }

  return {
    id: user.id,
    email: user.email ?? profile.email ?? '',
    profile: {
      id: profile.id,
      role: profile.role,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    },
  };
}
