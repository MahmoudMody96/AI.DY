-- ============================================
-- AI.DY — Engagement: favorites, tool_views
-- ============================================

DROP TABLE IF EXISTS public.tool_views CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;

-- ===========================
-- favorites (user x tool)
-- ===========================
CREATE TABLE public.favorites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_id         UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_tool_id ON public.favorites(tool_id);

-- ===========================
-- tool_views (analytics)
-- ===========================
CREATE TABLE public.tool_views (
  id              BIGSERIAL PRIMARY KEY,
  tool_id         UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id      TEXT,                            -- anonymous session
  referrer        TEXT,
  user_agent      TEXT,
  country         TEXT,
  city            TEXT,
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_views_tool_id ON public.tool_views(tool_id);
CREATE INDEX idx_tool_views_user_id ON public.tool_views(user_id);
CREATE INDEX idx_tool_views_viewed_at ON public.tool_views(viewed_at DESC);
CREATE INDEX idx_tool_views_session_id ON public.tool_views(session_id);
