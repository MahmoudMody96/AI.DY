-- ============================================
-- AI.DY — Core domain: profiles, categories, tools
-- ============================================

-- Idempotent: drop in reverse-dependency order before re-creating.
DROP TABLE IF EXISTS public.tools CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ===========================
-- profiles (1:1 with auth.users)
-- ===========================
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  display_name    TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  website_url     TEXT,
  role            user_role NOT NULL DEFAULT 'user',
  locale          TEXT NOT NULL DEFAULT 'ar',
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);

-- Trigger: auto-create profile when auth.users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================
-- categories
-- ===========================
CREATE TABLE public.categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,                    -- Arabic
  name_en         TEXT,                             -- English
  description     TEXT,
  icon            TEXT,                             -- lucide icon name
  color           TEXT,                             -- hex color for theming
  parent_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  position        INT NOT NULL DEFAULT 0,           -- sort order
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  seo_title       TEXT,
  seo_description TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_is_active_position ON public.categories(is_active, position);

-- ===========================
-- tools
-- ===========================
CREATE TABLE public.tools (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  name_en             TEXT,
  tagline             TEXT,
  description         TEXT,
  description_en      TEXT,
  long_description    TEXT,
  website_url         TEXT,
  documentation_url   TEXT,
  logo_url            TEXT,
  screenshot_url      TEXT,
  category_id         UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  pricing_type        pricing_type NOT NULL DEFAULT 'freemium',
  pricing_currency    TEXT DEFAULT 'USD',
  starting_price      NUMERIC(10, 2),
  monthly_price       NUMERIC(10, 2),
  pricing_info        JSONB NOT NULL DEFAULT '{}'::jsonb,
  pricing_plans       JSONB NOT NULL DEFAULT '[]'::jsonb,
  features            JSONB NOT NULL DEFAULT '[]'::jsonb,
  pros                JSONB NOT NULL DEFAULT '[]'::jsonb,
  cons                JSONB NOT NULL DEFAULT '[]'::jsonb,
  screenshots         JSONB NOT NULL DEFAULT '[]'::jsonb,
  has_free_trial      BOOLEAN NOT NULL DEFAULT FALSE,
  trial_days          INT,
  rating_avg          NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  rating_count        INT NOT NULL DEFAULT 0,
  views_count         INT NOT NULL DEFAULT 0,
  clicks_count        INT NOT NULL DEFAULT 0,
  favorites_count     INT NOT NULL DEFAULT 0,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_sponsored        BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  sponsored_until     TIMESTAMPTZ,
  status              tool_status NOT NULL DEFAULT 'draft',
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  meta_title          TEXT,
  meta_description    TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,
  contact_whatsapp    TEXT,
  submitted_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tools_slug ON public.tools(slug);
CREATE INDEX idx_tools_category_id ON public.tools(category_id);
CREATE INDEX idx_tools_status ON public.tools(status);
CREATE INDEX idx_tools_is_published_featured ON public.tools(is_published, is_featured) WHERE is_published = TRUE;
CREATE INDEX idx_tools_rating_avg ON public.tools(rating_avg DESC);
CREATE INDEX idx_tools_views_count ON public.tools(views_count DESC);
CREATE INDEX idx_tools_pricing_type ON public.tools(pricing_type);
CREATE INDEX idx_tools_tags_gin ON public.tools USING GIN (tags);
CREATE INDEX idx_tools_name_trgm ON public.tools USING GIN (name gin_trgm_ops);

-- Full-text search
ALTER TABLE public.tools ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(name, '') || ' ' ||
      coalesce(name_en, '') || ' ' ||
      coalesce(tagline, '') || ' ' ||
      coalesce(description, '')
    )
  ) STORED;
CREATE INDEX idx_tools_search ON public.tools USING GIN (search_vector);
