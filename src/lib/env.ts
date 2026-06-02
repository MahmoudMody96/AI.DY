// ============================================
// AI.DY — Environment variable validation
// Throws on first import if any required var is missing or malformed.
// ============================================

import { z } from 'zod';

const ServerEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_DB_HOST: z.string().min(1).optional(),
  SUPABASE_DB_PORT: z.coerce.number().int().positive().optional(),
  SUPABASE_DB_NAME: z.string().min(1).optional(),
  SUPABASE_DB_USER: z.string().min(1).optional(),
  SUPABASE_DB_PASSWORD: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1).default('AI.DY'),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
});

const PublicEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1).default('AI.DY'),
});

export type ServerEnv = z.infer<typeof ServerEnv>;
export type PublicEnv = z.infer<typeof PublicEnv>;

/**
 * Server-only env. Reads from process.env. Use in:
 * - Server Components
 * - Route Handlers
 * - Server Actions
 * - Migration scripts
 */
export function getServerEnv(): ServerEnv {
  const parsed = ServerEnv.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

/**
 * Public env (safe for client). Use NEXT_PUBLIC_* vars only.
 */
export function getPublicEnv(): PublicEnv {
  const parsed = PublicEnv.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid public environment variables:\n${issues}`);
  }
  return parsed.data;
}

/**
 * Convenience: silent fallback for client components.
 * Returns the public env or {} on error (logged but not thrown).
 */
export function getPublicEnvSafe(): PublicEnv | null {
  try {
    return getPublicEnv();
  } catch (err) {
    if (typeof window !== 'undefined') {
      console.warn('[env] Public env validation failed:', err);
    }
    return null;
  }
}
