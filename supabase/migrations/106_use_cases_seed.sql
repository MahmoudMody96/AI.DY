-- ============================================
-- AI.DY — Seed: 6 use cases + missing tools
-- ============================================
-- Phase 1.6 (use case pages) — populates public.use_cases with 6
-- marketing/SEO landing pages that each group 5-8 tools around a
-- real user scenario.
--
-- The use case seed references a number of tool slugs that don't
-- exist in the live database yet (customer support, data analysis,
-- Arabic content, and education tools). To keep the seed self-
-- contained and idempotent, we INSERT any missing tools first using
-- the same shape as 090_seed.sql, then INSERT the 6 use cases with
-- their related_tool_ids resolved from the freshly-inserted rows.
--
-- Idempotent: every INSERT uses ON CONFLICT (slug) DO UPDATE so
-- re-running the migration refreshes titles/keywords without
-- breaking related_tool_ids.

-- ===========================
-- 1. Missing tools (10 tools)
-- ===========================
INSERT INTO public.tools (slug, name, name_en, tagline, description, website_url, category_id, pricing_type, starting_price, monthly_price, rating_avg, rating_count, is_featured, is_published, status, tags) VALUES
  -- Coding: codeium
  ('codeium', 'Codeium', 'Codeium', 'إكمال كود مجاني بالـ AI', 'مساعد برمجي مجاني مع autocomplete ذكي ودردشة داخل الـ IDE، يدعم عشرات اللغات.', 'https://codeium.com', (SELECT id FROM public.categories WHERE slug='coding'), 'freemium', 0, 0, 4.4, 1820, FALSE, TRUE, 'published', ARRAY['autocomplete', 'free', 'ide']),

  -- Customer support (none of these existed — fall under automation/coding)
  ('intercom-fin', 'Intercom Fin', 'Intercom Fin', 'مساعد دعم عملاء بالـ AI', 'مساعد ذكي من Intercom يرد على استفسارات العملاء بناءً على قاعدة المعرفة.', 'https://www.intercom.com/fin', (SELECT id FROM public.categories WHERE slug='automation'), 'paid', 0, 29, 4.5, 920, FALSE, TRUE, 'published', ARRAY['support', 'chatbot', 'enterprise']),
  ('zendesk-ai', 'Zendesk AI', 'Zendesk AI', 'دعم آلي داخل Zendesk', 'إضافات AI لمنصة Zendesk لتصنيف التذاكر واقتراح الردود.', 'https://www.zendesk.com/service/ai/', (SELECT id FROM public.categories WHERE slug='automation'), 'paid', 0, 89, 4.3, 740, FALSE, TRUE, 'published', ARRAY['support', 'ticketing', 'enterprise']),
  ('tidio', 'Tidio', 'Tidio', 'دعم ومحادثة مباشرة للمواقع', 'منصة محادثة مباشرة مع chatbot جاهز للمواقع الصغيرة والمتوسطة.', 'https://www.tidio.com', (SELECT id FROM public.categories WHERE slug='automation'), 'freemium', 0, 29, 4.4, 1120, FALSE, TRUE, 'published', ARRAY['support', 'live-chat', 'smb']),
  ('drift', 'Drift', 'Drift', 'محادثة مبيعات ودعم', 'منصة محادثة ABM للتسويق والمبيعات، تركّز على lead generation.', 'https://www.drift.com', (SELECT id FROM public.categories WHERE slug='automation'), 'paid', 0, 2500, 4.2, 540, FALSE, TRUE, 'published', ARRAY['support', 'sales', 'enterprise']),

  -- Data analysis
  ('julius-ai', 'Julius AI', 'Julius AI', 'تحليل بيانات بالذكاء', 'مساعد يحلل بياناتك (CSV, Excel, Sheets) ويرسم رسومًا ويجيب أسئلة بلغة طبيعية.', 'https://julius.ai', (SELECT id FROM public.categories WHERE slug='search'), 'freemium', 0, 20, 4.5, 680, FALSE, TRUE, 'published', ARRAY['analytics', 'csv', 'natural-language']),
  ('akkio', 'Akkio', 'Akkio', 'تحليلات تنبؤية بدون كود', 'منصة تحليلات وذكاء أعمال تنبؤية بدون كود.', 'https://www.akkio.com', (SELECT id FROM public.categories WHERE slug='search'), 'paid', 0, 49, 4.2, 320, FALSE, TRUE, 'published', ARRAY['analytics', 'predictive', 'no-code']),

  -- Arabic content
  ('araby-ai', 'Araby.AI', 'Araby.AI', 'أدوات AI عربية', 'منصة عربية لتوليد النصوص والصور والصوت بالعربية.', 'https://www.araby.ai', (SELECT id FROM public.categories WHERE slug='writing'), 'freemium', 0, 12, 4.2, 410, FALSE, TRUE, 'published', ARRAY['arabic', 'writing', 'localized']),
  ('kalam-ai', 'Kalam.ai', 'Kalam.ai', 'محتوى عربي متميز', 'أداة كتابة عربية متخصصة في النصوص التسويقية والإعلانية.', 'https://kalam.ai', (SELECT id FROM public.categories WHERE slug='writing'), 'paid', 0, 29, 4.0, 180, FALSE, TRUE, 'published', ARRAY['arabic', 'marketing', 'localized']),

  -- Education
  ('khan-labs', 'Khanmigo', 'Khanmigo', 'معلم AI من Khan Academy', 'مساعد تعليمي من Khan Academy يشرح ويوجّه دون إعطاء الإجابات مباشرة.', 'https://www.khanacademy.org/khan-labs', (SELECT id FROM public.categories WHERE slug='ai-assistants'), 'freemium', 0, 4, 4.6, 980, FALSE, TRUE, 'published', ARRAY['education', 'tutor', 'khan']),
  ('curipod', 'Curipod', 'Curipod', 'دروس تفاعلية بالـ AI', 'منصة لإنشاء دروس تفاعلية مع polls و open-ended prompts يقودها المعلم.', 'https://curipod.com', (SELECT id FROM public.categories WHERE slug='ai-assistants'), 'freemium', 0, 8, 4.3, 240, FALSE, TRUE, 'published', ARRAY['education', 'interactive', 'classroom']),
  ('magic-school', 'MagicSchool', 'MagicSchool', 'مساعد معلمين بالـ AI', 'منصة AI للمعلمين لإنشاء خطط دروس، اختبارات، IEPs، ورسائل لأولياء الأمور.', 'https://www.magicschool.ai', (SELECT id FROM public.categories WHERE slug='ai-assistants'), 'freemium', 0, 10, 4.5, 1820, FALSE, TRUE, 'published', ARRAY['education', 'teacher', 'lesson-plans'])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  category_id = EXCLUDED.category_id,
  pricing_type = EXCLUDED.pricing_type,
  starting_price = EXCLUDED.starting_price,
  monthly_price = EXCLUDED.monthly_price,
  is_featured = EXCLUDED.is_featured,
  is_published = EXCLUDED.is_published,
  status = EXCLUDED.status,
  tags = EXCLUDED.tags,
  updated_at = now();

-- ===========================
-- 2. Use cases (6)
-- ===========================
-- We resolve related_tool_ids via a subquery so reordering the INSERT
-- list above doesn't break the order. Each list is ordered by the
-- editor's preference (most prominent tool first).

INSERT INTO public.use_cases (slug, title, description, icon, related_tool_ids, seo_keywords, status) VALUES
  (
    'content-creation',
    'إنشاء المحتوى بالذكاء الاصطناعي',
    'إنشاء المحتوى بالذكاء الاصطناعي بقى أسرع وأسهل من أي وقت. من كتابة المقالات والإعلانات لتوليد الصور الإبداعية، الأدوات دي بتساعدك تنتج محتوى احترافي في دقائق. اختار الأداة المناسبة لنوع المحتوى بتاعك: نص، صور، أو حتى فيديو. كل أداة من دول ليها نقاط قوة مختلفة، فالأفضل تستخدم أكتر من واحدة في الـ workflow بتاعك عشان تطلع أفضل نتيجة.',
    'PenTool',
    ARRAY[
      (SELECT id FROM public.tools WHERE slug='chatgpt'),
      (SELECT id FROM public.tools WHERE slug='claude'),
      (SELECT id FROM public.tools WHERE slug='gemini'),
      (SELECT id FROM public.tools WHERE slug='jasper'),
      (SELECT id FROM public.tools WHERE slug='copy-ai'),
      (SELECT id FROM public.tools WHERE slug='midjourney'),
      (SELECT id FROM public.tools WHERE slug='leonardo-ai')
    ]::uuid[],
    ARRAY['إنشاء محتوى', 'كتابة بالذكاء الاصطناعي', 'توليد صور', 'ChatGPT', 'Midjourney', 'محتوى تسويقي'],
    'published'
  ),

  (
    'coding',
    'البرمجة بالذكاء الاصطناعي',
    'البرمجة بالذكاء الاصطناعي غيّرت طريقة المطورين في الشغل. من إكمال الكود تلقائيًا داخل الـ IDE لتوليد دوال كاملة من وصف نصي، الأدوات دي بتسرّع الشغل وبتساعدك تتعلم languages جديدة بسرعة. GitHub Copilot و Cursor الأفضل للـ production code، بينما Codeium مجاني وممتاز للـ indie developers. و Claude و ChatGPT أصدقاء ممتازين لما تحتاج تشرح كود قديم أو تعمل refactor.',
    'Code',
    ARRAY[
      (SELECT id FROM public.tools WHERE slug='github-copilot'),
      (SELECT id FROM public.tools WHERE slug='cursor'),
      (SELECT id FROM public.tools WHERE slug='claude'),
      (SELECT id FROM public.tools WHERE slug='chatgpt'),
      (SELECT id FROM public.tools WHERE slug='replit-ai'),
      (SELECT id FROM public.tools WHERE slug='codeium')
    ]::uuid[],
    ARRAY['برمجة بالذكاء الاصطناعي', 'مساعد برمجي', 'GitHub Copilot', 'Cursor', 'Codeium', 'مطورين'],
    'published'
  ),

  (
    'customer-support',
    'دعم العملاء الآلي',
    'دعم العملاء بالذكاء الاصطناعي بيوفر وقت الفِرق وبيحسّن تجربة العميل. من chatbots ترد 24/7 لأنظمة ticketing بتصنّف الطلبات تلقائيًا، الأدوات دي بتساعد الشركات الصغيرة والكبيرة تخدم عملاءها أسرع وبتكلفة أقل. Intercom Fin و Zendesk AI للشركات الكبيرة، Tidio حل ممتاز للمواقع الصغيرة، و Drift للتركيز على المبيعات. و ChatGPT مفيد لو عايز تبني support assistant مخصص.',
    'Phone',
    ARRAY[
      (SELECT id FROM public.tools WHERE slug='intercom-fin'),
      (SELECT id FROM public.tools WHERE slug='zendesk-ai'),
      (SELECT id FROM public.tools WHERE slug='tidio'),
      (SELECT id FROM public.tools WHERE slug='drift'),
      (SELECT id FROM public.tools WHERE slug='chatgpt')
    ]::uuid[],
    ARRAY['دعم عملاء', 'chatbot', 'Intercom', 'Zendesk', 'Tidio', 'دعم آلي'],
    'published'
  ),

  (
    'data-analysis',
    'تحليل البيانات',
    'تحليل البيانات بقى متاح لغير المتخصصين بفضل أدوات AI. تقدر تحمّل ملف CSV أو Excel وتطلب منها تلخيص أو رسم بياني أو تحليل اتجاهات بلغة طبيعية. ChatGPT و Claude ممتازين للـ exploratory analysis لما تشرح لهم المشكلة، Gemini متميز لو شغال على Google Sheets. و Julius.AI و Akkio tools متخصصة في الـ analytics — الأولى للمحترفين، والتانية للـ business users اللي عايزين تنبؤات بدون كود.',
    'BarChart3',
    ARRAY[
      (SELECT id FROM public.tools WHERE slug='chatgpt'),
      (SELECT id FROM public.tools WHERE slug='claude'),
      (SELECT id FROM public.tools WHERE slug='gemini'),
      (SELECT id FROM public.tools WHERE slug='julius-ai'),
      (SELECT id FROM public.tools WHERE slug='akkio')
    ]::uuid[],
    ARRAY['تحليل بيانات', 'analytics', 'Julius AI', 'Akkio', 'Excel AI', 'تحليل ذكاء أعمال'],
    'published'
  ),

  (
    'arabic-content',
    'كتابة المحتوى العربي',
    'كتابة المحتوى العربي بالـ AI محتاجة أدوات فاهمة اللغة والثقافة. الـ models العالمية زي ChatGPT و Claude و Gemini بتتحسّن في العربية، لكن أدوات متخصصة زي Araby.AI و Kalam.ai بتدّيك جودة أعلى في النصوص التسويقية والإعلانية. Jasper كمان بيدعم Arabic templates. في الـ workflow: استخدم نموذج عالمي للـ ideation والـ research، وأداة متخصصة للـ final copy العربي.',
    'Globe',
    ARRAY[
      (SELECT id FROM public.tools WHERE slug='chatgpt'),
      (SELECT id FROM public.tools WHERE slug='claude'),
      (SELECT id FROM public.tools WHERE slug='gemini'),
      (SELECT id FROM public.tools WHERE slug='jasper'),
      (SELECT id FROM public.tools WHERE slug='araby-ai'),
      (SELECT id FROM public.tools WHERE slug='kalam-ai')
    ]::uuid[],
    ARRAY['محتوى عربي', 'كتابة بالعربية', 'Araby AI', 'Kalam AI', 'تسويق عربي', 'AI عربي'],
    'published'
  ),

  (
    'education',
    'التعليم والتدريب',
    'التعليم بالذكاء الاصطناعي بيساعد الطلاب والمعلمين. للطلاب: Khanmigo (من Khan Academy) معلم AI بيشرح ويوجّه بدل ما يدّي إجابات مباشرة. للصفوف التفاعلية: Curipod بيساعد المعلمين يعملوا دروس polls و prompts. للمعلمين: MagicSchool.ai بيوفّر وقت كبير في إعداد خطط الدروس والاختبارات. و ChatGPT و Claude و Gemini أدوات عامة ممتازة للشرح وحل المسائل.',
    'BookOpen',
    ARRAY[
      (SELECT id FROM public.tools WHERE slug='chatgpt'),
      (SELECT id FROM public.tools WHERE slug='claude'),
      (SELECT id FROM public.tools WHERE slug='gemini'),
      (SELECT id FROM public.tools WHERE slug='khan-labs'),
      (SELECT id FROM public.tools WHERE slug='curipod'),
      (SELECT id FROM public.tools WHERE slug='magic-school')
    ]::uuid[],
    ARRAY['تعليم AI', 'Khanmigo', 'Curipod', 'MagicSchool', 'معلم AI', 'طلاب'],
    'published'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  related_tool_ids = EXCLUDED.related_tool_ids,
  seo_keywords = EXCLUDED.seo_keywords,
  status = EXCLUDED.status,
  updated_at = now();
