-- ============================================
-- AI.DY — Row Level Security policies
-- ============================================

-- Idempotent: drop existing functions + policies first
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(UUID) CASCADE;

-- ===========================
-- Enable RLS on every public table
-- ===========================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ===========================
-- Helper: is_admin()
-- ===========================
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'super_admin'
  );
$$;

-- ===========================
-- profiles
-- ===========================
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- categories — public read, admin write
-- ===========================
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- tools — public read published, admin write
-- ===========================
CREATE POLICY "tools_public_read" ON public.tools FOR SELECT
  USING (status = 'published' AND is_published = TRUE);
CREATE POLICY "tools_admin_all" ON public.tools FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "tools_owner_update" ON public.tools FOR UPDATE
  USING (submitted_by = auth.uid()) WITH CHECK (submitted_by = auth.uid());

-- ===========================
-- articles
-- ===========================
CREATE POLICY "articles_public_read" ON public.articles FOR SELECT
  USING (status = 'published');
CREATE POLICY "articles_admin_all" ON public.articles FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "articles_author_update" ON public.articles FOR UPDATE
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- ===========================
-- reviews
-- ===========================
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT
  USING (status = 'approved');
CREATE POLICY "reviews_user_insert" ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_user_update" ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_user_delete" ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY "reviews_admin_all" ON public.reviews FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- comments
-- ===========================
CREATE POLICY "comments_public_read" ON public.comments FOR SELECT
  USING (status = 'approved');
CREATE POLICY "comments_user_insert" ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_user_update" ON public.comments FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_user_delete" ON public.comments FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY "comments_admin_all" ON public.comments FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- favorites — user only
-- ===========================
CREATE POLICY "favorites_self_read" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_self_insert" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_self_delete" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- ===========================
-- tool_views — anyone can insert (anonymous), no read
-- ===========================
CREATE POLICY "tool_views_public_insert" ON public.tool_views FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "tool_views_admin_read" ON public.tool_views FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ===========================
-- plans — public read active
-- ===========================
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (is_active = TRUE);
CREATE POLICY "plans_admin_all" ON public.plans FOR ALL
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- ===========================
-- leads — public insert, admin read/update
-- ===========================
CREATE POLICY "leads_public_insert" ON public.leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "leads_admin_all" ON public.leads FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "leads_owner_read" ON public.leads FOR SELECT
  USING (auth.uid() = assigned_to);

-- ===========================
-- subscriptions — user own
-- ===========================
CREATE POLICY "subscriptions_self_read" ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- payments — user own
-- ===========================
CREATE POLICY "payments_self_read" ON public.payments FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "payments_admin_all" ON public.payments FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- api_keys — user own
-- ===========================
CREATE POLICY "api_keys_self_all" ON public.api_keys FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===========================
-- audit_log — admin only
-- ===========================
CREATE POLICY "audit_log_admin_read" ON public.audit_log FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ===========================
-- jobs — service role only (no public access)
-- (handled by service_role bypass)
-- ===========================

-- ===========================
-- newsletter — public insert
-- ===========================
CREATE POLICY "newsletter_public_insert" ON public.newsletter FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "newsletter_self_update" ON public.newsletter FOR UPDATE
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "newsletter_admin_all" ON public.newsletter FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- demos — public read active
-- ===========================
CREATE POLICY "demos_public_read" ON public.demos FOR SELECT USING (is_active = TRUE);
CREATE POLICY "demos_admin_all" ON public.demos FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- redirects — public read active
-- ===========================
CREATE POLICY "redirects_public_read" ON public.redirects FOR SELECT USING (is_active = TRUE);
CREATE POLICY "redirects_admin_all" ON public.redirects FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===========================
-- site_settings — public read if is_public, admin write
-- ===========================
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT
  USING (is_public = TRUE);
CREATE POLICY "site_settings_admin_all" ON public.site_settings FOR ALL
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
