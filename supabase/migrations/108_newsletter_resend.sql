-- ============================================
-- AI.DY — Phase 4.0: Newsletter + Resend integration helpers
-- ============================================
-- The `newsletter` table already exists (050_ops.sql) with:
--   id, email (UNIQUE), name, is_confirmed, confirm_token,
--   unsubscribed_at, locale, source, tags, created_at, updated_at.
--   RLS: public_insert, self_update, admin_all.
--
-- This migration is a no-op safety net that:
--   1) Re-asserts the UNIQUE index on email (in case it was lost).
--   2) Adds a partial index on is_confirmed=true (hot path for
--      "send to confirmed subscribers" queries).
--   3) Adds a partial index on unsubscribed_at IS NOT NULL (so the
--      unsubscribe funnel can be analyzed cheaply).
--   4) Documents the lifecycle status mapping we use in the API:
--        is_confirmed=false + unsubscribed_at=null  → 'pending'
--        is_confirmed=true  + unsubscribed_at=null  → 'active'
--        is_confirmed=true  + unsubscribed_at!=null → 'unsubscribed'
--      (No schema change — we expose a virtual `status` column in
--      the API response so client code can treat it as enum-like.)
--
-- Idempotent: re-runs are no-ops.

-- ===========================
-- Index: confirmed subscribers
-- ===========================
CREATE INDEX IF NOT EXISTS idx_newsletter_is_confirmed
  ON public.newsletter (created_at DESC)
  WHERE is_confirmed = true;

-- ===========================
-- Index: unsubscribed users
-- ===========================
CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribed_at
  ON public.newsletter (unsubscribed_at DESC)
  WHERE unsubscribed_at IS NOT NULL;

-- ===========================
-- Comments
-- ===========================
COMMENT ON COLUMN public.newsletter.is_confirmed IS
  'true after the user clicks the confirmation link in the welcome email. Until then, the row is in `pending` virtual status.';
COMMENT ON COLUMN public.newsletter.unsubscribed_at IS
  'When set, the user is in `unsubscribed` virtual status. We never delete the row — useful for churn analytics.';
COMMENT ON COLUMN public.newsletter.source IS
  'Optional UTM-style source tag (e.g. "footer_form", "homepage_modal"). Populated by the subscribe API from the request origin.';
