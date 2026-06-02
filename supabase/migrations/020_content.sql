-- ============================================
-- AI.DY — Content domain: articles, reviews, comments
-- ============================================

DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;

-- ===========================
-- articles (MDX blog posts)
-- ===========================
CREATE TABLE public.articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  title_en        TEXT,
  excerpt         TEXT,
  content_mdx     TEXT NOT NULL,                   -- MDX source
  content_html    TEXT,                            -- pre-rendered HTML (cached)
  cover_url       TEXT,
  author_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  reading_time    INT,                             -- minutes
  views_count     INT NOT NULL DEFAULT 0,
  likes_count     INT NOT NULL DEFAULT 0,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  status          article_status NOT NULL DEFAULT 'draft',
  meta_title      TEXT,
  meta_description TEXT,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_status_published ON public.articles(status, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_articles_author_id ON public.articles(author_id);
CREATE INDEX idx_articles_category_id ON public.articles(category_id);
CREATE INDEX idx_articles_tags_gin ON public.articles USING GIN (tags);
CREATE INDEX idx_articles_title_trgm ON public.articles USING GIN (title gin_trgm_ops);

-- ===========================
-- reviews (1 per user per tool)
-- ===========================
CREATE TABLE public.reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id         UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           TEXT,
  content         TEXT NOT NULL,
  pros            JSONB NOT NULL DEFAULT '[]'::jsonb,
  cons            JSONB NOT NULL DEFAULT '[]'::jsonb,
  helpful_count   INT NOT NULL DEFAULT 0,
  status          review_status NOT NULL DEFAULT 'pending',
  moderated_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tool_id, user_id)
);

CREATE INDEX idx_reviews_tool_id ON public.reviews(tool_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- ===========================
-- comments (on articles)
-- ===========================
CREATE TABLE public.comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  likes_count     INT NOT NULL DEFAULT 0,
  status          comment_status NOT NULL DEFAULT 'pending',
  moderated_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_article_id ON public.comments(article_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_status ON public.comments(status);
