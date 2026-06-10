// AI.DY — Seed 3 sample blog_posts (Phase 1.5 acceptance)
// One blog_post + one comparison + one use_case, all published.

import { Client } from 'pg';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';

const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
if (!PASSWORD) {
  console.error('ERROR: SUPABASE_DB_PASSWORD env var required.');
  process.exit(1);
}

const c = new Client({
  host: process.env.SUPABASE_DB_HOST || 'aws-1-eu-central-1.pooler.supabase.com',
  port: Number(process.env.SUPABASE_DB_PORT || 6543),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres.qchnindfczaulufazivy',
  password: PASSWORD,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 60_000,
});

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

function readingTimeCeil(md) {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function renderHtml(md) {
  try {
    return renderToStaticMarkup(ReactMarkdown({ children: md }));
  } catch (err) {
    console.warn('renderToStaticMarkup failed:', err.message);
    return `<p>${md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n\n/g, '</p><p>')}</p>`;
  }
}

const posts = [
  {
    title: 'أفضل 5 أدوات AI للكتابة بالعربي',
    type: 'blog_post',
    excerpt: 'دليل عملي يغطي ChatGPT و Claude و Gemini و Jasper و Copy.ai للكتابة الاحترافية باللغة العربية — مع مقارنة للأسعار والمميزات.',
    body: `# أفضل 5 أدوات AI للكتابة بالعربي في 2026

لو بتدور على **مساعد كتابة بالذكاء الاصطناعي** بيفهم اللغة العربية كويس، فالقائمة دي هتوفر عليك ساعات من التجربة.

## 1. ChatGPT (من OpenAI)
- الأقوى في المحادثات الطويلة
- يفهم اللهجات العربية المختلفة
- بيساعد في الـ outline + تحرير + ترجمة
- **السعر:** مجاني للـ GPT-3.5، $20/شهر للـ GPT-4

## 2. Claude (من Anthropic)
- الأطول في الـ context (200K token)
- ممتاز للمقالات الطويلة والـ research
- بيتعامل مع النصوص القانونية والأكاديمية بدقة
- **السعر:** مجاني للـ Sonnet، $20/شهر للـ Opus

## 3. Gemini (من Google)
- متكامل مع Google Docs و Gmail
- البحث الفوري عن معلومات محدثة
- بيدعم الصور والملفات
- **السعر:** مجاني للـ Gemini Pro

## 4. Jasper AI
- متخصص في الـ marketing copy
- قوالب جاهزة (إعلانات، إيميلات، بوستات سوشيال)
- **السعر:** $49/شهر

## 5. Copy.ai
- سهل الاستخدام للمبتدئين
- Workflows تلقائية
- **السعر:** مجاني + خطة $36/شهر

## الخلاصة
- **للمبتدئين:** ابدأ بـ ChatGPT أو Gemini
- **للمحتوى الطويل:** Claude
- **للـ marketing:** Jasper أو Copy.ai

> جرّب بنفسك وشوف أنهي أداة بتناسب أسلوبك في الكتابة.`,
    target_tools: ['chatgpt', 'claude', 'gemini', 'jasper', 'copy-ai'],
    target_categories: ['ai-assistants', 'writing'],
    seo_keywords: ['ai', 'كتابة', 'عربي', 'chatgpt', 'claude', 'gemini', 'jasper', 'copy.ai'],
  },
  {
    title: 'ChatGPT vs Claude vs Gemini — مقارنة شاملة 2026',
    type: 'comparison',
    excerpt: 'مقارنة تفصيلية بين أقوى 3 نماذج AI في 2026: الجودة، السعر، السرعة، ودعم اللغة العربية.',
    body: `# ChatGPT vs Claude vs Gemini — مقارنة شاملة

## جدول المقارنة السريع

| الميزة | ChatGPT (GPT-4) | Claude (Sonnet 4) | Gemini (2.0 Pro) |
|---|---|---|---|
| السعر | $20/شهر | $20/شهر | مجاني/Pro |
| Context window | 128K | 200K | 2M |
| دعم العربي | ممتاز | ممتاز | ممتاز جداً |
| السرعة | سريع | متوسط | سريع جداً |
| البحث الفوري | ✅ | ❌ | ✅ |
| تحليل الصور | ✅ | ✅ | ✅ |
| Code generation | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## التوصيات حسب الاستخدام

### للكتابة الإبداعية
**Claude** هو الملك — أسلوبه أقرب للبشري وفيه nuance أكتر.

### للبرمجة
**Claude** و **ChatGPT** متنافسين، جرّب الاتنين.

### للبحث والمعلومات
**Gemini** يتفوق بفضل اتصاله الفوري بالإنترنت.

### للترجمة
**ChatGPT** الأفضل في الدقة.

## الخلاصة
مفيش "أحسن أداة" واحد — كل أداة ليها قوتها. **الاحترافيين** بيستخدموا 2-3 أدوات بالتوازي.`,
    target_tools: ['chatgpt', 'claude', 'gemini'],
    target_categories: ['ai-assistants', 'llm'],
    seo_keywords: ['chatgpt', 'claude', 'gemini', 'مقارنة', 'comparison', 'gpt-4', 'sonnet'],
  },
  {
    title: 'استخدم AI في خدمة العملاء — دليل شامل',
    type: 'use_case',
    excerpt: 'إزاي تستخدم أدوات AI لتحسين خدمة العملاء: من الردود التلقائية للـ chatbots لتحليل sentiment التذاكر.',
    body: `# استخدم AI في خدمة العملاء

خدمة العملاء من أكتر المجالات اللي الـ AI بيحقق فيها ROI عالي. في الدليل ده هنغطي **6 طرق عملية** لتطبيق AI في الـ customer support.

## 1. Chatbots للردود الأولية

- **أدوات مقترحة:** ChatGPT API، Claude API، Tidio، Intercom AI
- **التوفير:** 60-80% من التذاكر المتكررة
- **التكلفة:** $50-500/شهر

## 2. تحليل sentiment التذاكر

- AI بيصنّف التذاكر تلقائياً (إيجابي/سلبي/عاجل)
- بيوجّه التذاكر الحساسة لفريق senior
- **أدوات:** MonkeyLearn، Brand24، HubSpot Service Hub

## 3. تلخيص المحادثات الطويلة

- الـ support agent بياخد ملخص المحادثة كاملة في 5 ثواني
- بيوفر 10-15 دقيقة لكل تذكرة
- **أدوات:** ChatGPT، Claude

## 4. قاعدة معرفة ذكية

- AI بيجاوب من الـ docs بتاعتك
- بيقلل البحث اليدوي
- **أدوات:** Notion AI، Guru، Tettra

## 5. ترجمة فورية

- خدمة عملاء متعدد اللغات بدون فريق ترجمة
- **أدوات:** DeepL، Google Translate API، ChatGPT

## 6. تحليل أسباب الشكاوى

- AI بيكتشف الـ patterns في شكاوى العملاء
- بيقترح تحسينات للمنتج
- **أدوات:** MonkeyLearn، Gensim

## الخطوات العملية

### الأسبوع 1-2: التقييم
- حلّل الـ tickets الحالية
- حدد أكتر 5 أسئلة متكررة

### الأسبوع 3-4: MVP
- اعمل chatbot بسيط يجاوب على الـ FAQ
- اختبره على 10% من الـ traffic

### الشهر 2: التوسيع
- أضف sentiment analysis
- زوّد الـ coverage لـ 50% من الأسئلة

### الشهر 3+: التحسين
- حسّن بناءً على الـ feedback
- أضف multilingual support

## الـ Stack المقترح (لـ SaaS متوسط)

| الوظيفة | الأداة | التكلفة الشهرية |
|---|---|---|
| Chatbot | ChatGPT API + custom UI | $100-300 |
| Ticketing | HubSpot | $50 |
| Analytics | PostHog + AI | $0-100 |
| Knowledge base | Notion AI | $10/user |

## الخلاصة
ابدأ صغير — chatbot للـ FAQ — وقيس الأثر قبل ما تتوسع. **المفتاح:** AI ما يستبدلش الفريق، بيكمل شغله.`,
    target_tools: ['chatgpt', 'claude', 'deepseek', 'gemini', 'notion-ai'],
    target_categories: ['ai-assistants', 'customer-support', 'automation'],
    seo_keywords: ['ai', 'خدمة عملاء', 'customer support', 'chatbot', 'automation'],
  },
];

(async () => {
  console.log('Connecting...');
  await c.connect();

  for (const p of posts) {
    const slug = slugify(p.title);
    const bodyHtml = renderHtml(p.body);
    const readingTime = readingTimeCeil(p.body);

    // Check if exists
    const { rows: existing } = await c.query(
      'SELECT id FROM blog_posts WHERE slug = $1',
      [slug]
    );
    if (existing.length > 0) {
      console.log(`✓ Already exists: ${slug} (id=${existing[0].id}) — updating.`);
      await c.query(
        `UPDATE blog_posts
         SET title = $1, excerpt = $2, body_markdown = $3, body_html = $4,
             type = $5, target_tools = $6, target_categories = $7, seo_keywords = $8,
             reading_time_minutes = $9, status = 'published', published_at = now(),
             updated_at = now()
         WHERE slug = $10`,
        [
          p.title,
          p.excerpt,
          p.body,
          bodyHtml,
          p.type,
          p.target_tools,
          p.target_categories,
          p.seo_keywords,
          readingTime,
          slug,
        ]
      );
    } else {
      console.log(`+ Inserting: ${slug} (type=${p.type})`);
      await c.query(
        `INSERT INTO blog_posts
           (slug, title, excerpt, body_markdown, body_html, type,
            target_tools, target_categories, seo_keywords, reading_time_minutes,
            status, published_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published', now(), now(), now())`,
        [
          slug,
          p.title,
          p.excerpt,
          p.body,
          bodyHtml,
          p.type,
          p.target_tools,
          p.target_categories,
          p.seo_keywords,
          readingTime,
        ]
      );
    }
  }

  const { rows } = await c.query(
    "SELECT type, status, count(*)::int as n FROM blog_posts GROUP BY type, status ORDER BY type, status"
  );
  console.log('\n=== blog_posts summary ===');
  for (const r of rows) {
    console.log(`  ${r.type.padEnd(15)} ${r.status.padEnd(12)} ${r.n}`);
  }

  await c.end();
  console.log('\nDone.');
})().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
