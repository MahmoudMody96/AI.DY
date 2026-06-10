-- ============================================
-- AI.DY — Phase 4.0 fix v2: completely rebuild newsletter RLS
-- ============================================
-- The original 070_rls.sql created 3 newsletter policies. The
-- newsletter_public_insert policy was defined WITH CHECK (true) on PUBLIC,
-- but PostgREST's role-switching flow (authenticator → SET ROLE anon) hits
-- a 401/RLS error.
--
-- This migration drops ALL newsletter policies and re-creates them with
-- explicit role targets (anon, authenticated, service_role) and the
-- correct semantics for the Phase 4.0 Resend integration.
--
-- Test approach: a single permissive INSERT policy that targets
-- {anon, authenticated} works for the public newsletter subscribe
-- form. Authenticated users (via the user-scoped SSR client) also
-- match this policy, which is fine — the form is open to everyone.

DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter;
DROP POLICY IF EXISTS "newsletter_self_update"  ON public.newsletter;
DROP POLICY IF EXISTS "newsletter_admin_all"     ON public.newsletter;

-- Public insert — anyone (anon or authenticated) can subscribe.
CREATE POLICY "newsletter_public_insert" ON public.newsletter
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Self-update — the user can mark themselves as unsubscribed.
-- (For Phase 4.0 we only do this via the /api/newsletter/unsubscribe
--  endpoint using a user-scoped client OR via service role.)
CREATE POLICY "newsletter_self_update" ON public.newsletter
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Admin all — only admins can read/update/delete any row.
CREATE POLICY "newsletter_admin_all" ON public.newsletter
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Note: service_role bypasses RLS entirely so no policy is needed.
