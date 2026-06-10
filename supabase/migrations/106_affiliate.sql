-- ============================================
-- AI.DY — Phase 4.0: Affiliate links on tools
-- ============================================
-- Adds an `affiliate_url` column to the public.tools table so the
-- platform can earn a commission when users click "جرب الأداة بخصم"
-- (try with discount) on a tool page.
--
-- Schema is intentionally simple — owners manage affiliate links
-- directly in the DB or via the (future) admin form. There is no
-- hardcoded tracking platform; we just open the link in a new tab
-- with `rel="noopener sponsored"` for compliance with Google's
-- sponsored-links policy.
--
-- Idempotent: re-runs are no-ops.
-- Backward compatible: column is nullable; tools without affiliate
--   programs continue to show the regular "زيارة الموقع" CTA.

-- ===========================
-- Column
-- ===========================
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

-- ===========================
-- Constraint: must be a URL when set
-- ===========================
ALTER TABLE public.tools
  DROP CONSTRAINT IF EXISTS tools_affiliate_url_check;

ALTER TABLE public.tools
  ADD CONSTRAINT tools_affiliate_url_check
  CHECK (affiliate_url IS NULL OR affiliate_url ~* '^https?://');

-- ===========================
-- Comment
-- ===========================
COMMENT ON COLUMN public.tools.affiliate_url IS
  'Optional partner/affiliate link. When set, /tools/[slug] renders a "جرب الأداة بخصم" CTA in addition to the regular "زيارة الموقع" link. rel="noopener sponsored" is applied for Google compliance.';
