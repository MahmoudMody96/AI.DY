-- ============================================
-- AI.DY — Triggers: updated_at, view_count, rating recalc
-- ============================================

-- Idempotent: drop trigger functions first (drops depend on them)
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.recalc_tool_rating() CASCADE;
DROP FUNCTION IF EXISTS public.recalc_tool_favorites() CASCADE;
DROP FUNCTION IF EXISTS public.recalc_tool_views() CASCADE;
DROP FUNCTION IF EXISTS public.set_published_at() CASCADE;

-- Generic: touch updated_at on row UPDATE
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables that have updated_at
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_tools_updated_at BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_newsletter_updated_at BEFORE UPDATE ON public.newsletter
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_demos_updated_at BEFORE UPDATE ON public.demos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===========================
-- Recalculate tool rating when reviews change
-- ===========================
CREATE OR REPLACE FUNCTION public.recalc_tool_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_tool_id UUID;
BEGIN
  target_tool_id := COALESCE(NEW.tool_id, OLD.tool_id);

  UPDATE public.tools
  SET
    rating_avg = COALESCE((
      SELECT AVG(rating)::NUMERIC(3, 2)
      FROM public.reviews
      WHERE tool_id = target_tool_id AND status = 'approved'
    ), 0),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE tool_id = target_tool_id AND status = 'approved'
    )
  WHERE id = target_tool_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_reviews_recalc_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalc_tool_rating();

-- ===========================
-- Update tool favorites_count when favorites change
-- ===========================
CREATE OR REPLACE FUNCTION public.recalc_tool_favorites()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_tool_id UUID;
BEGIN
  target_tool_id := COALESCE(NEW.tool_id, OLD.tool_id);

  UPDATE public.tools
  SET favorites_count = (
    SELECT COUNT(*) FROM public.favorites WHERE tool_id = target_tool_id
  )
  WHERE id = target_tool_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_favorites_recalc
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.recalc_tool_favorites();

-- ===========================
-- Update tool views_count
-- ===========================
CREATE OR REPLACE FUNCTION public.recalc_tool_views()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tool_id IS NOT NULL THEN
    UPDATE public.tools
    SET views_count = (
      SELECT COUNT(*) FROM public.tool_views WHERE tool_id = NEW.tool_id
    )
    WHERE id = NEW.tool_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tool_views_recalc
  AFTER INSERT ON public.tool_views
  FOR EACH ROW EXECUTE FUNCTION public.recalc_tool_views();

-- ===========================
-- Auto-set published_at when status -> published
-- ===========================
CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status <> 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tools_published_at BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.set_published_at();
CREATE TRIGGER trg_articles_published_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_published_at();
