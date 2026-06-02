// ============================================
// AI.DY — Supabase Server Client (Server Components, Route Handlers, Server Actions)
// ============================================
//
// Returns `SupabaseClient | null` so callers can branch on configuration
// status. Falls back to an anonymous (no-cookie) client when the cookie
// store is unavailable (e.g. during static generation in dev).
// ============================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getServerEnv } from '@/lib/env';

function getSupabaseUrl(): string {
  return getServerEnv().NEXT_PUBLIC_SUPABASE_URL;
}

function getSupabaseAnonKey(): string {
  return getServerEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/**
 * Try to build a cookie-aware Supabase client (for auth-bound queries).
 * If `cookies()` is unavailable (e.g. in some static prerender paths), we
 * fall back to a plain anonymous client — same RLS reads still work.
 */
async function buildClient(): Promise<SupabaseClient | null> {
  try {
    const env = getServerEnv();
    const cookieStore = await cookies();
    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options as CookieOptions);
              });
            } catch {
              // setAll called from a Server Component — ignored.
            }
          },
        },
      }
    );
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[supabase:server] cookie client unavailable, falling back to anon:', err);
    }
  }

  // Plain anonymous client — works for all public read queries
  // under RLS. Sufficient for /api/tools, /api/categories, etc.
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}

/**
 * Create a Supabase client for Server Components and Route Handlers.
 * Returns null if env vars are not configured.
 */
export async function createClient(): Promise<SupabaseClient | null> {
  return buildClient();
}

/**
 * Helper for API routes. Returns the Supabase client OR a `NextResponse`
 * with a 503 — so callers can `return` it directly.
 */
export async function getSupabaseOrError(): Promise<SupabaseClient | Response> {
  const client = await buildClient();
  if (!client) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return client;
}
