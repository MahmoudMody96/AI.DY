-- ============================================
-- AI.DY — Seed: 8 categories + 30 real tools
-- ============================================
-- Idempotent via ON CONFLICT. Uses subqueries for category_id lookups
-- so the order of inserts doesn't matter.

-- ===========================
-- Categories
-- ===========================
INSERT INTO public.categories (slug, name, name_en, description, icon, color, position) VALUES
  ('ai-assistants', 'مساعدون ذكيون', 'AI Assistants', 'مساعدين ذكاء اصطناعي للمحادثة، الكتابة، والتحليل.', 'Bot', '#8B5CF6', 1),
  ('writing', 'كتابة المحتوى', 'Writing & Content', 'أدوات توليد وكتابة المحتوى والمقالات.', 'PenTool', '#F59E0B', 2),
  ('image-generation', 'توليد الصور', 'Image Generation', 'أدوات توليد وتحرير الصور بالذكاء الاصطناعي.', 'ImageIcon', '#EC4899', 3),
  ('coding', 'البرمجة', 'Coding', 'مساعدين ذكاء اصطناعي للمطورين والبرمجة.', 'Code', '#10B981', 4),
  ('video', 'الفيديو', 'Video', 'أدوات توليد وتحرير الفيديو بالذكاء الاصطناعي.', 'Video', '#EF4444', 5),
  ('audio', 'الصوت', 'Audio', 'تحويل النص لصوت، توليد الموسيقى، والـ voice cloning.', 'Music', '#06B6D4', 6),
  ('automation', 'الأتمتة', 'Automation', 'منصات أتمتة سير العمل بدون كود.', 'Workflow', '#0EA5E9', 7),
  ('search', 'البحث', 'Search', 'محركات بحث ذكية مع مصادر.', 'Search', '#3B82F6', 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  position = EXCLUDED.position,
  updated_at = now();

-- ===========================
-- Tools (30)
-- ===========================
-- AI Assistants (5)
INSERT INTO public.tools (slug, name, name_en, tagline, description, website_url, category_id, pricing_type, starting_price, monthly_price, rating_avg, rating_count, is_featured, is_published, status, tags) VALUES
  ('chatgpt', 'ChatGPT', 'ChatGPT', 'مساعد ذكي للمحادثة والكتابة', 'نموذج لغوي كبير من OpenAI للمحادثة، الكتابة، الترجمة، وتوليد الأفكار. يدعم العربية.', 'https://chat.openai.com', (SELECT id FROM public.categories WHERE slug='ai-assistants'), 'freemium', 0, 20, 4.9, 15420, TRUE, TRUE, 'published', ARRAY['chatbot', 'writing', 'translation']),
  ('claude', 'Claude', 'Claude', 'مساعد للتحليل والكتابة الطويلة', 'نموذج من Anthropic متميز في المحادثات الطويلة والتحليل العميق وفهم المستندات الكبيرة.', 'https://claude.ai', (SELECT id FROM public.categories WHERE slug='ai-assistants'), 'freemium', 0, 20, 4.8, 8920, TRUE, TRUE, 'published', ARRAY['chatbot', 'analysis', 'long-form']),
  ('gemini', 'Gemini', 'Gemini', 'مساعد Google مع البحث الحي', 'مساعد ذكي من Google يدمج البحث الفعلي بنموذج لغوي متقدم.', 'https://gemini.google.com', (SELECT id FROM public.categories WHERE slug='ai-assistants'), 'freemium', 0, 20, 4.6, 4820, TRUE, TRUE, 'published', ARRAY['chatbot', 'search', 'google']),
  ('microsoft-copilot', 'Microsoft Copilot', 'Microsoft Copilot', 'مساعد مدمج في Windows و Office', 'مساعد من Microsoft مدمج في Windows 11 و Microsoft 365 و Edge.', 'https://copilot.microsoft.com', (SELECT id FROM public.categories WHERE slug='ai-assistants'), 'freemium', 0, 30, 4.4, 6210, FALSE, TRUE, 'published', ARRAY['chatbot', 'productivity', 'office']),
  ('deepseek', 'DeepSeek', 'DeepSeek', 'نموذج مفتوح المصدر عالي الأداء', 'نموذج لغوي مفتوح المصدر من DeepSeek بأداء قوي وسعر منخفض.', 'https://deepseek.com', (SELECT id FROM public.categories WHERE slug='ai-assistants'), 'freemium', 0, 5, 4.5, 3140, FALSE, TRUE, 'published', ARRAY['open-source', 'chatbot', 'api']),

  -- Writing (4)
  ('jasper', 'Jasper', 'Jasper', 'منصة محتوى احترافية للفِرق', 'مساعد كتابة للـ marketing ومحتوى الـ brand voice، موجه للشركات.', 'https://jasper.ai', (SELECT id FROM public.categories WHERE slug='writing'), 'paid', 49, 49, 4.3, 5210, FALSE, TRUE, 'published', ARRAY['marketing', 'brand-voice', 'teams']),
  ('copy-ai', 'Copy.ai', 'Copy.ai', 'كتابة سريعة للـ marketing', 'أداة سريعة لكتابة نصوص الـ marketing والـ social media.', 'https://copy.ai', (SELECT id FROM public.categories WHERE slug='writing'), 'freemium', 0, 49, 4.2, 3120, FALSE, TRUE, 'published', ARRAY['marketing', 'social-media', 'fast']),
  ('writesonic', 'Writesonic', 'Writesonic', 'محتوى + SEO + Chatbot', 'منصة متعددة لإنشاء المحتوى وتحسين SEO وبناء chatbots.', 'https://writesonic.com', (SELECT id FROM public.categories WHERE slug='writing'), 'freemium', 0, 20, 4.4, 2890, FALSE, TRUE, 'published', ARRAY['seo', 'content', 'chatbot']),
  ('notion-ai', 'Notion AI', 'Notion AI', 'ذكاء اصطناعي داخل Notion', 'مساعد ذكي مدمج في Notion للتلخيص، الترجمة، وكتابة الملاحظات.', 'https://notion.so/product/ai', (SELECT id FROM public.categories WHERE slug='writing'), 'paid', 10, 10, 4.3, 2150, FALSE, TRUE, 'published', ARRAY['notes', 'productivity', 'in-workspace']),

  -- Image Generation (4)
  ('midjourney', 'Midjourney', 'Midjourney', 'صور فنية مذهلة', 'من Midjourney لتوليد صور فنية عالية الجودة من الأوصاف النصية.', 'https://midjourney.com', (SELECT id FROM public.categories WHERE slug='image-generation'), 'paid', 10, 30, 4.7, 6540, TRUE, TRUE, 'published', ARRAY['art', 'quality', 'discord']),
  ('dall-e-3', 'DALL-E 3', 'DALL-E 3', 'توليد صور من OpenAI', 'مولد صور من OpenAI بدقة عالية ويفهم التعليمات المعقدة.', 'https://openai.com/dall-e-3', (SELECT id FROM public.categories WHERE slug='image-generation'), 'paid', 0, 20, 4.5, 3280, TRUE, TRUE, 'published', ARRAY['openai', 'quality', 'chatgpt']),
  ('leonardo-ai', 'Leonardo.AI', 'Leonardo.AI', 'توليد صور للألعاب والمشاريع', 'منصة توليد صور مع control nets ونماذج متعددة، مفضلة للمصممين والـ game devs.', 'https://leonardo.ai', (SELECT id FROM public.categories WHERE slug='image-generation'), 'freemium', 0, 12, 4.5, 2150, FALSE, TRUE, 'published', ARRAY['gaming', 'controlnet', 'design']),
  ('ideogram', 'Ideogram', 'Ideogram', 'صور مع نصوص دقيقة', 'مولد صور متميز في رسم النصوص داخل الصور بشكل دقيق.', 'https://ideogram.ai', (SELECT id FROM public.categories WHERE slug='image-generation'), 'freemium', 0, 8, 4.4, 980, FALSE, TRUE, 'published', ARRAY['text-in-image', 'typography']),

  -- Coding (3)
  ('github-copilot', 'GitHub Copilot', 'GitHub Copilot', 'مساعد برمجي ذكي', 'مساعد من GitHub و OpenAI يقترح كود داخل الـ IDE ويدعم محادثة.', 'https://github.com/features/copilot', (SELECT id FROM public.categories WHERE slug='coding'), 'paid', 0, 10, 4.4, 12850, TRUE, TRUE, 'published', ARRAY['ide', 'autocomplete', 'github']),
  ('cursor', 'Cursor', 'Cursor', 'محرر كود بالـ AI', 'محرر مبني على VS Code مع AI مدمج يفهم المشروع كله.', 'https://cursor.sh', (SELECT id FROM public.categories WHERE slug='coding'), 'freemium', 0, 20, 4.7, 4890, FALSE, TRUE, 'published', ARRAY['ide', 'refactor', 'agent']),
  ('replit-ai', 'Replit AI', 'Replit AI', 'IDE سحابي مع AI', 'IDE سحابي مع AI مدمج يساعد في كتابة وتشغيل الكود مباشرة في المتصفح.', 'https://replit.com/ai', (SELECT id FROM public.categories WHERE slug='coding'), 'freemium', 0, 25, 4.2, 1820, FALSE, TRUE, 'published', ARRAY['cloud-ide', 'beginners', 'deploy']),

  -- Video (3)
  ('runway', 'Runway', 'Runway', 'إنشاء فيديو بالذكاء الاصطناعي', 'أداة متقدمة لتوليد وتحرير الفيديو من نصوص وصور، مع Gen-3.', 'https://runwayml.com', (SELECT id FROM public.categories WHERE slug='video'), 'freemium', 0, 35, 4.4, 2560, TRUE, TRUE, 'published', ARRAY['gen-3', 'video-edit', 'effects']),
  ('pika', 'Pika', 'Pika', 'توليد فيديو إبداعي', 'منصة لتوليد فيديوهات إبداعية من نصوص وصور، سهلة الاستخدام.', 'https://pika.art', (SELECT id FROM public.categories WHERE slug='video'), 'freemium', 0, 10, 4.3, 1450, FALSE, TRUE, 'published', ARRAY['creative', 'easy', 'short-clips']),
  ('synthesia', 'Synthesia', 'Synthesia', 'فيديوهات بشخصيات AI', 'منصة لإنشاء فيديوهات تعليمية بـ avatars AI بدون كاميرا.', 'https://synthesia.io', (SELECT id FROM public.categories WHERE slug='video'), 'paid', 22, 67, 4.5, 3120, FALSE, TRUE, 'published', ARRAY['avatars', 'training', 'enterprise']),

  -- Audio (3)
  ('elevenlabs', 'ElevenLabs', 'ElevenLabs', 'أصوات واقعية من نص', 'تحويل نص إلى كلام بأصوات واقعية متعددة اللغات، مع voice cloning.', 'https://elevenlabs.io', (SELECT id FROM public.categories WHERE slug='audio'), 'freemium', 0, 5, 4.6, 1820, TRUE, TRUE, 'published', ARRAY['tts', 'voice-clone', 'multilingual']),
  ('murf-ai', 'Murf AI', 'Murf AI', 'أصوات احترافية للفيديو', 'منصة TTS بأصوات احترافية للفيديوهات والعروض.', 'https://murf.ai', (SELECT id FROM public.categories WHERE slug='audio'), 'paid', 23, 23, 4.4, 980, FALSE, TRUE, 'published', ARRAY['tts', 'video-voiceover', 'studio']),
  ('suno', 'Suno', 'Suno', 'توليد أغاني بالـ AI', 'منصة لتوليد أغانٍ كاملة بكلمات وموسيقى من وصف نصي.', 'https://suno.com', (SELECT id FROM public.categories WHERE slug='audio'), 'freemium', 0, 10, 4.5, 2890, FALSE, TRUE, 'published', ARRAY['music', 'songs', 'lyrics']),

  -- Automation (3)
  ('zapier', 'Zapier', 'Zapier', 'ربط تطبيقاتك ببعض', 'منصة أتمتة تربط بين آلاف التطبيقات بدون كود.', 'https://zapier.com', (SELECT id FROM public.categories WHERE slug='automation'), 'freemium', 0, 19, 4.3, 3240, TRUE, TRUE, 'published', ARRAY['no-code', 'integrations', 'zaps']),
  ('make', 'Make', 'Make', 'أتمتة بصرية قوية', 'منصة أتمتة بصرية (Integromat سابقًا) لسيناريوهات معقدة.', 'https://make.com', (SELECT id FROM public.categories WHERE slug='automation'), 'freemium', 0, 9, 4.5, 1820, FALSE, TRUE, 'published', ARRAY['visual', 'complex', 'scenarios']),
  ('n8n', 'n8n', 'n8n', 'أتمتة مفتوحة المصدر', 'منصة أتمتة مفتوحة المصدر، self-hostable، قوية ومرنة.', 'https://n8n.io', (SELECT id FROM public.categories WHERE slug='automation'), 'freemium', 0, 20, 4.6, 1240, FALSE, TRUE, 'published', ARRAY['open-source', 'self-host', 'flexible']),

  -- Search (3)
  ('perplexity', 'Perplexity', 'Perplexity', 'محرك بحث ذكي', 'محرك بحث يستخدم الذكاء الاصطناعي مع مصادر موثوقة و citations.', 'https://perplexity.ai', (SELECT id FROM public.categories WHERE slug='search'), 'freemium', 0, 20, 4.5, 3890, TRUE, TRUE, 'published', ARRAY['search', 'citations', 'real-time']),
  ('you-com', 'You.com', 'You.com', 'بحث AI مع تطبيقات', 'محرك بحث AI مع تطبيقات مدمجة (code, write, imagine).', 'https://you.com', (SELECT id FROM public.categories WHERE slug='search'), 'freemium', 0, 15, 4.2, 1240, FALSE, TRUE, 'published', ARRAY['search', 'apps', 'ai-modes']),
  ('andi', 'Andi', 'Andi', 'بحث محادثة بدون ads', 'محرك بحث محادثة بدون إعلانات، يعرض النتائج كإجابة.', 'https://andisearch.com', (SELECT id FROM public.categories WHERE slug='search'), 'freemium', 0, 0, 4.1, 480, FALSE, TRUE, 'published', ARRAY['no-ads', 'conversational', 'privacy'])
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
  rating_avg = EXCLUDED.rating_avg,
  rating_count = EXCLUDED.rating_count,
  is_featured = EXCLUDED.is_featured,
  is_published = EXCLUDED.is_published,
  status = EXCLUDED.status,
  tags = EXCLUDED.tags,
  updated_at = now();
