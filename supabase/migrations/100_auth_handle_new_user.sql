-- ============================================
-- 100_auth_handle_new_user.sql
--
-- Phase 1.1 — Auth Live
-- Re-asserts the auth.users → public.profiles trigger so signup
-- (email + Google) always creates a row in public.profiles.
-- Idempotent: safe to re-run.
--
-- Note: the function and trigger were first defined in 010_core.sql.
-- This migration re-asserts the canonical version (display_name column,
-- SECURITY DEFINER, search_path = public, auth) and backfills any
-- auth.users rows that pre-date the trigger activation.
--
-- Sits alongside 100_media_storage.sql (alphabetical: 100_a < 100_m,
-- so this runs first — no dependency on the storage bucket anyway).
-- ============================================

-- 1) Re-create handle_new_user() — idempotent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2) Re-attach the trigger — idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Backfill: any auth.users rows that pre-date the trigger
-- (e.g. created via admin client) get a profile now.
INSERT INTO public.profiles (id, email, display_name, avatar_url, role, locale, is_verified)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  u.raw_user_meta_data->>'avatar_url',
  'user'::user_role,
  COALESCE(u.raw_user_meta_data->>'locale', 'ar'),
  COALESCE((u.raw_user_meta_data->>'email_verified')::boolean, FALSE)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
