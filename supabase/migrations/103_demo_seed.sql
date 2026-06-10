-- ============================================
-- AI.DY — Phase 1.4: Reference demo seed (chat for ChatGPT, Claude, Gemini)
-- ============================================
-- Sets demo_type = 'chat' and a per-tool demo_config on the 3 reference
-- assistants. Idempotent via UPDATE WHERE slug = ?.

UPDATE public.tools
SET
  demo_type = 'chat',
  demo_config = jsonb_build_object(
    'model', 'gpt-3.5-turbo',
    'systemPrompt', 'You are a helpful AI assistant. Reply briefly in Arabic.',
    'maxTokens', 300,
    'temperature', 0.7,
    'rateLimit', 10,
    'placeholder', 'اكتب رسالتك لـ ChatGPT…',
    'greeting', 'مرحباً! أنا نموذج محادثة. اكتب أي سؤال وجرّبني.'
  )
WHERE slug = 'chatgpt';

UPDATE public.tools
SET
  demo_type = 'chat',
  demo_config = jsonb_build_object(
    'model', 'claude-3-haiku-20240307',
    'systemPrompt', 'أنت مساعد ذكي. أجب بإيجاز وباللغة العربية.',
    'maxTokens', 300,
    'temperature', 0.7,
    'rateLimit', 10,
    'placeholder', 'اكتب رسالتك لـ Claude…',
    'greeting', 'مرحباً! أنا Claude. اسألني أي شيء.'
  )
WHERE slug = 'claude';

UPDATE public.tools
SET
  demo_type = 'chat',
  demo_config = jsonb_build_object(
    'model', 'gemini-1.5-flash',
    'systemPrompt', 'You are Gemini. Reply briefly in Arabic.',
    'maxTokens', 300,
    'temperature', 0.7,
    'rateLimit', 10,
    'placeholder', 'اكتب رسالتك لـ Gemini…',
    'greeting', 'مرحباً! أنا Gemini. جرّب قدراتي في البحث والمحادثة.'
  )
WHERE slug = 'gemini';
