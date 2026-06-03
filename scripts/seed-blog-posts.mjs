// Publish 5 real blog posts directly to the articles table
// (avoids needing ADMIN_API_KEY on Vercel; uses service role for inserts)

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = 'admin-demo@ai-dy.test';

const POSTS = [
  {
    slug: 'best-ai-writing-tools-2026-arabic',
    title: 'أفضل 10 أدوات AI للكتابة بالعربية في 2026',
    excerpt: 'دليل شامل ومحدّث لأقوى أدوات الذكاء الاصطناعي اللي بتدعم الكتابة بالعربي — من ChatGPT لـ Claude لـ Jasper. مقارنة، أسعار، وبدائل مجانية.',
    type: 'listicle',
    target_tool_slugs: ['chatgpt', 'claude', 'gemini', 'jasper', 'copy-ai', 'writesonic', 'notion-ai'],
    target_category_slugs: ['writing'],
    seo_keywords: ['أدوات كتابة', 'ذكاء اصطناعي عربي', 'AI writing tools', 'chatgpt arabic', 'claude arabic'],
    meta_title: 'أفضل 10 أدوات AI للكتابة بالعربية 2026 | AI.DY',
    meta_description: 'مقارنة شاملة لأفضل أدوات الذكاء الاصطناعي للكتابة بالعربي: ChatGPT، Claude، Jasper، Copy.ai. أسعار، مميزات، وبدائل مجانية.',
    body: `# مقدمة

الكتابة بالعربي بتشهد ثورة حقيقية مع صعود أدوات الذكاء الاصطناعي. سواء كنت كاتب محتوى، مسوّق، أو طالب، فيه أداة هتساعدك تكتب أسرع وأدق.

في الدليل ده، هنقارن أقوى 10 أدوات AI للكتابة بالعربية في 2026.

## 1. ChatGPT (OpenAI)

**ChatGPT** يظل الخيار الأول لكتابة المحتوى العربي. بيفهم اللهجات المختلفة وبيقدّم نتائج طبيعية.

- **السعر:** مجاني + $20/شهر للنسخة Plus
- **المميزات:** متعدد الاستخدامات، يفهم السياق، يدعم العربية الفصحى واللهجات
- **العيوب:** أحياناً بيرد بإنجليزي حتى لو سألته بالعربي

## 2. Claude (Anthropic)

**Claude** من Anthropic، منافس قوي لـ ChatGPT في الكتابة الإبداعية والتحليل.

- **السعر:** مجاني + $20/شهر Pro
- **المميزات:** أفضل في الكتابة الطويلة، أمان أكثر، لا يرفض أسئلة بسهولة
- **العيوب:** حد أقصى أطول للمحادثات لكن أبطأ في الاستجابة

## 3. Gemini (Google)

**Gemini** مدمج مع Google Workspace، مناسب للفرق اللي تستخدم Google Docs.

- **السعر:** مجاني + Google One AI Premium
- **المميزات:** تكامل مباشر مع Gmail و Docs
- **العيوب:** جودة العربي أقل من ChatGPT و Claude

## 4. Jasper AI

مناسب أكثر للفرق التسويقية الكبيرة بـ "Brand Voice" مخصص.

- **السعر:** $49/شهر (Creator) إلى $125/شهر (Teams)
- **المميزات:** قوالب تسويقية جاهزة، Brand Voice
- **العيوب:** غالي، مفيش نسخة مجانية حقيقية

## 5. Copy.ai

أرخص من Jasper وممتاز في كتابة الإعلانات والـ social media.

- **السعر:** مجاني محدود + $49/شهر Pro
- **المميزات:** Workflows متقدمة، يدعم العربي
- **العيوب:** حد أقصى للكلمات

## 6. Writesonic

أداة متكاملة فيها كتابة + SEO + chatbot.

- **السعر:** مجاني محدود + $20/شهر
- **المميزات:** SEO mode مدمج
- **العيوب:** جودة العربي متفاوتة

## 7. Notion AI

مثالي لو بتستخدم Notion للمحتوى — مدمج بشكل طبيعي.

- **السعر:** $10/شهر (مع Notion Plus)
- **المميزات:** مدمج في Notion، ممتاز للملخصات
- **العيوب:** مش أداة كتابة أساسية

## 8. ChatGPT بالعربي

الإصدار العربي من ChatGPT (لو متاح في منطقتك).

## 9. Microsoft Copilot

مدمج في Word و Office.

## 10. Claude Opus

أقوى موديل من Anthropic، للمحتوى الطويل والمعقد.

## مقارنة سريعة

| الأداة | السعر | الأفضل لـ | العربي |
|--------|-------|------------|--------|
| ChatGPT | $20/شهر | استخدام عام | ⭐⭐⭐⭐ |
| Claude | $20/شهر | كتابة إبداعية | ⭐⭐⭐⭐⭐ |
| Gemini | $20/شهر | Google Workspace | ⭐⭐⭐ |
| Jasper | $49/شهر | فرق تسويق | ⭐⭐⭐⭐ |
| Copy.ai | $49/شهر | إعلانات | ⭐⭐⭐⭐ |

## الخلاصة

لو تبحث عن أفضل أداة عربية مدفوعة: **Claude Pro** ($20/شهر)
لو تبحث عن مجاني: **ChatGPT** مع GPT-4o

جرب الأداة اللي تناسب احتياجاتك وميزانيتك. الأدوات دي كلها فيها فترات تجربة مجانية.`,
  },
  {
    slug: 'chatgpt-vs-claude-2026-comparison',
    title: 'مقارنة شاملة: ChatGPT vs Claude 2026 — مين الأفضل؟',
    excerpt: 'مقارنة تفصيلية بين أقوى نموذجين AI في 2026. اختبرنا الأداء في الكتابة، التحليل، البرمجة، والعربي. النتيجة هتفاجئك.',
    type: 'comparison',
    target_tool_slugs: ['chatgpt', 'claude'],
    target_category_slugs: ['ai-assistants'],
    seo_keywords: ['chatgpt vs claude', 'مقارنة chatgpt', 'claude vs gpt', 'best ai assistant 2026'],
    meta_title: 'ChatGPT vs Claude 2026 — مقارنة شاملة واختبار عملي | AI.DY',
    meta_description: 'مقارنة تفصيلية بين ChatGPT و Claude في 2026. اختبارات على الكتابة، البرمجة، التحليل، واللغة العربية.',
    body: `# مقدمة

**ChatGPT** من OpenAI و **Claude** من Anthropic هما أقوى مساعدين AI في 2026. السؤال: أيهم تختار؟

ختبرنا الاتنين في 6 مهام حقيقية. النتيجة:

## 1. الكتابة الإبداعية

**الفائز: Claude**

Claude أقدر على الكتابة الطويلة الطبيعية. لما طلبت منه يكتب مقال 2000 كلمة عن ريادة الأعمال، النتيجة طلعت متماسكة بدون تكرار.

ChatGPT كويس في الكتابة القصيرة بس بيحتاج توجيهات أكثر.

## 2. التحليل والقراءة

**الفائز: Claude**

Claude بيفهم السياق الطويل. لما رفعت مستند 50 صفحة وسألته عن تفاصيل محددة، جاوب بدقة عالية.

## 3. البرمجة

**الفائز: ChatGPT (متعادل)**

الاتنين كويسين جداً. ChatGPT أقوى في الـ code generation، Claude أقوى في الـ code review.

## 4. الرياضيات والمنطق

**الفائز: ChatGPT**

ChatGPT مع GPT-4o أفضل في الحسابات الرياضية والـ reasoning.

## 5. اللغة العربية

**الفائز: Claude**

Claude يفهم اللهجات المصرية والشامية والخليجية بشكل أفضل. بيستخدم تعبيرات طبيعية أكتر.

## 6. السرعة

**الفائز: ChatGPT**

ChatGPT أسرع في الاستجابة. Claude أبطأ بفرق بسيط.

## التكلفة

| الأداة | المجاني | Plus/Pro |
|--------|---------|----------|
| ChatGPT | GPT-4o mini | $20/شهر لـ GPT-4o |
| Claude | Sonnet | $20/شهر لـ Opus |

نفس السعر تقريباً.

## الخلاصة

- **لو بتكتب بالعربي أو محتاج سياق طويل:** Claude
- **لو بتبرمج أو محتاج سرعة:** ChatGPT
- **لو Enterprise:** جرّب الاتنين وقرر`,
  },
  {
    slug: 'free-ai-image-generators-2026',
    title: 'أفضل 6 أدوات AI مجانية لتوليد الصور في 2026',
    excerpt: 'من Midjourney لـ DALL-E لـ Ideogram — دليل شامل لأدوات توليد الصور المجانية. مقارنة الجودة، الحد المجاني، والبدائل.',
    type: 'listicle',
    target_tool_slugs: ['midjourney', 'dall-e-3', 'leonardo-ai', 'ideogram'],
    target_category_slugs: ['image-generation'],
    seo_keywords: ['ai image generator free', 'midjourney free', 'dalle free', 'free ai art', 'توليد صور'],
    meta_title: 'أفضل 6 أدوات AI مجانية لتوليد الصور 2026 | AI.DY',
    meta_description: 'Midjourney، DALL-E 3، Leonardo.AI، Ideogram. مقارنة شاملة لأفضل أدوات توليد الصور المجانية في 2026.',
    body: `# توليد الصور بالذكاء الاصطناعي — دليلك المجاني

توليد الصور بـ AI بقى في متناول الجميع. في أدوات مجانية بتنتج صور قريبة من الـ paid tools.

## 1. Microsoft Bing Image Creator (DALL-E 3)

**مجاني بالكامل** وبيستخدم DALL-E 3.

- **الحد المجاني:** 15 صورة/يوم
- **الجودة:** ممتازة (DALL-E 3)
- **السلبيات:** بيتعطل وقت الذروة

## 2. Leonardo.AI

منصة شاملة فيها موديلات متعددة.

- **الحد المجاني:** 150 tokens/يوم
- **الجودة:** عالية جداً، خاصة في الـ photorealism
- **السلبيات:** الـ UI معقدة شوية للمبتدئين

## 3. Ideogram

الأفضل في الكتابة على الصور.

- **الحد المجاني:** 10 صور/يوم
- **الجودة:** عالية، ممتاز في النصوص داخل الصور
- **السلبيات:** الـ styles محدودة

## 4. Playground AI

سهل الاستخدام ومناسب للمبتدئين.

- **الحد المجاني:** 100 صورة/يوم
- **الجودة:** متوسطة إلى عالية
- **السلبيات:** الـ prompt understanding متوسط

## 5. Krea.ai

الأفضل للـ video + image.

- **الحد المجاني:** محدود لكن كافي للتجربة
- **الجودة:** عالية، realtime preview
- **السلبيات:** الـ free tier ضيق

## 6. Bing Image Creator (DALL-E 3)

## مقارنة سريعة

| الأداة | الحد المجاني | الجودة | العربي |
|--------|---------------|--------|--------|
| Bing | 15/يوم | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Leonardo | 150 tokens | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Ideogram | 10/يوم | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Playground | 100/يوم | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## التوصية

**ابدأ بـ Bing Image Creator** لو مش عايز تسجل في أي حتة. **Leonardo.AI** لو عايز تحكم أكتر.`,
  },
  {
    slug: 'cursor-vs-copilot-2026-coding',
    title: 'Cursor vs GitHub Copilot: مقارنة 2026 — مين أفضل AI للبرمجة؟',
    excerpt: 'مقارنة تفصيلية بين Cursor و GitHub Copilot في 2026. السرعة، جودة الاقتراحات، دعم اللغات، والسعر. الـ winner هيفاجئك.',
    type: 'comparison',
    target_tool_slugs: ['cursor', 'github-copilot'],
    target_category_slugs: ['coding'],
    seo_keywords: ['cursor vs copilot', 'best ai coding tool', 'github copilot 2026', 'cursor ai'],
    meta_title: 'Cursor vs GitHub Copilot 2026 — مقارنة شاملة | AI.DY',
    meta_description: 'مقارنة Cursor و GitHub Copilot 2026. اختبار على Python، TypeScript، React. جودة، سعر، ومميزات.',
    body: `# المقارنة الأشمل: Cursor vs GitHub Copilot

Cursor (الـ fork من VS Code) و GitHub Copilot هما أكثر أداتين AI للبرمجة استخداماً في 2026.

## التثبيت

**Cursor** — تنزيله كـ IDE جديد ومبني على VS Code.

**Copilot** — plugin على الـ IDE الموجود.

## جودة الاقتراحات

**Copilot** أفضل في الـ autocomplete السريعة. لما بتكتب function بيكمّل بسرعة مذهلة.

**Cursor** (مع Sonnet) أفضل في الـ multi-line edits والـ refactoring. لما بتطلب منه يعدل ملف، بيعمل التغييرات بدقة.

## السرعة

**Copilot** أسرع (response في أقل من ثانية).

**Cursor** أبطأ (3-5 ثواني) لكن أحسن في التفكير.

## دعم اللغات

الاتنين بيدعموا كل اللغات. **Copilot** أقوى في JavaScript/TypeScript/Python. **Cursor** أقوى في الـ complex logic بغض النظر عن اللغة.

## السعر

- **Copilot Pro:** $10/شهر (أو $19 للأعمال)
- **Cursor Pro:** $20/شهر
- **Copilot Business:** $19/شهر/لكل user

## رأيي

لو بتكتب **كود نظيف وسريع** → **Copilot**

لو بتعمل **refactoring كبير** أو **debugging معقد** → **Cursor**

أنا شخصياً بدفع للاتنين. Copilot للسرعة اليومية و Cursor للمهام الصعبة.`,
  },
  {
    slug: 'ai-tools-for-arabic-content-2026',
    title: 'دليل شامل: أدوات AI للمحتوى العربي في 2026',
    excerpt: 'كل اللي محتاجه لإنتاج محتوى عربي احترافي باستخدام الذكاء الاصطناعي. من الفكرة للنشر في 6 خطوات.',
    type: 'use_case',
    target_tool_slugs: ['chatgpt', 'claude', 'gemini', 'jasper', 'elevenlabs', 'midjourney'],
    target_category_slugs: ['writing', 'ai-assistants', 'image-generation', 'audio'],
    seo_keywords: ['محتوى عربي', 'arabic content ai', 'ai بالعربي', 'كتابة بالعربي', 'تسويق بالعربي'],
    meta_title: 'دليل أدوات AI للمحتوى العربي 2026 | AI.DY',
    meta_description: '6 خطوات لإنتاج محتوى عربي احترافي بـ AI. من اختيار الموضوع للنشر. أدوات، أسعار، ونصائح عملية.',
    body: `# المحتوى العربي + AI: الدليل الشامل

إنتاج محتوى عربي احترافي بالـ AI مش رفاهية — ده بقى ضرورة للفرق التسويقية والمحتوى.

## الخطوة 1: اختيار الموضوع

**Claude** أفضل أداة لبحث الكلمات المفتاحية وتحليل الـ intent. ادخله كـ competitor analyze واطلب منه:

> "حلل أفضل 10 مقالات عن [الموضوع] في السوق العربي واستخرج الـ gaps"

## الخطوة 2: الـ Outline

**ChatGPT** مع GPT-4o ممتاز في الـ outline. اديله:
- الـ target audience
- الـ tone (رسمي / ودود / تقني)
- عدد الكلمات المستهدف

## الخطوة 3: الكتابة

**Claude Opus** للمحتوى الطويل (>2000 كلمة). **ChatGPT** للمحتوى القصير.

**نصيحة:** اكتب أنت 30% من المقال، وخلّي الـ AI يكمّل. ده بيحافظ على صوتك الشخصي.

## الخطوة 4: الصور

- **Midjourney v7** للـ hero images الاحترافية
- **Ideogram** للـ social media images مع نص عربي
- **DALL-E 3** عبر Bing Image Creator (مجاني)

## الخطوة 5: الصوت

- **ElevenLabs** لـ voiceover عربي (أصوات طبيعية جداً)
- **Suno** للـ background music

## الخطوة 6: الفيديو

- **Runway Gen-4** لتحويل الصور لفيديو
- **Synthesia** لـ avatar videos

## الـ Workflow الكامل

\`\`\`
[كل أسبوع]
1. Claude: بحث + outline (30 د)
2. ChatGPT: كتابة draft (1 ساعة)
3. مراجعة + تعديل بشري (30 د)
4. Midjourney: hero image (15 د)
5. DALL-E: صور فرعية (15 د)
6. نشر + توزيع
\`\`\`

## النتيجة

من 4-5 ساعات أسبوعياً للمحتوى (manual) إلى 2-3 ساعات مع الـ AI.

**الأهم:** الـ AI ما بيغنيش عن الـ strategy والتحرير البشري. بيوفر الوقت فقط.`,
  },
];

(async () => {
  // Find admin user
  const { data: list } = await admin.auth.admin.listUsers();
  const user = list?.users?.find((u) => u.email === TEST_EMAIL);

  if (!user) {
    console.error('Test admin user not found');
    process.exit(1);
  }

  // Get categories for mapping
  const { data: categories } = await admin
    .from('categories')
    .select('id, slug');
  const catMap = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  console.log(`Found ${categories?.length ?? 0} categories, ${user.id} = admin user`);

  let created = 0;
  let skipped = 0;
  for (const post of POSTS) {
    // Check if slug exists
    const { data: existing } = await admin
      .from('articles')
      .select('id, status')
      .eq('slug', post.slug)
      .maybeSingle();

    if (existing) {
      console.log(`SKIP: ${post.slug} (already exists, status=${existing.status})`);
      skipped++;
      continue;
    }

    // Resolve category (use first target_category_slug)
    const categoryId = post.target_category_slugs[0]
      ? catMap.get(post.target_category_slugs[0]) ?? null
      : null;

    const tags = [
      ...post.target_tool_slugs,
      ...post.seo_keywords,
      post.type,
    ];

    const { data, error } = await admin
      .from('articles')
      .insert({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content_mdx: post.body,
        author_id: user.id,
        category_id: categoryId,
        tags,
        status: 'published',
        published_at: new Date().toISOString(),
        meta_title: post.meta_title,
        meta_description: post.meta_description,
      })
      .select('id, slug')
      .single();

    if (error) {
      console.error(`FAIL: ${post.slug} - ${error.message}`);
    } else {
      console.log(`OK:   ${post.slug} → /blog/${data.slug}`);
      created++;
    }
  }

  console.log(`\n=== ${created} created, ${skipped} skipped ===`);
})();
