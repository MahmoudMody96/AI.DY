import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Shield, Globe, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ToolCard } from "@/components/ui/tool-card";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";
import { CATEGORY_ACCENTS } from "@/components/brand/tokens";
import { BRAND_VOICE } from "@/components/brand/voice";

type Category = {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  position: number | null;
};

type Tool = {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  tagline: string | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  pricing_type: string | null;
  starting_price: number | null;
  monthly_price: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  is_featured: boolean | null;
  category: Pick<Category, "id" | "name" | "slug" | "icon" | "color"> | null;
};

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  tags: string[];
  published_at: string | null;
  reading_time: number | null;
};

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "اليوم";
  if (days < 2) return "أمس";
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

export default async function Home() {
  const supabase = await createClient();

  let categories: Category[] = [];
  let featured: Tool[] = [];
  let totalTools = 0;
  let news: NewsItem[] = [];

  if (supabase) {
    const [categoriesRes, featuredRes, statsRes, newsRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, slug, name, name_en, description, icon, color, position")
        .eq("is_active", true)
        .order("position", { ascending: true }),
      supabase
        .from("tools")
        .select(
          "id, slug, name, name_en, tagline, description, website_url, logo_url, pricing_type, starting_price, monthly_price, rating_avg, rating_count, is_featured, category:categories(id, name, slug, icon, color)"
        )
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("rating_avg", { ascending: false })
        .limit(6),
      supabase.from("tools").select("id", { count: "exact", head: true }),
      supabase
        .from("articles")
        .select("id, slug, title, excerpt, cover_url, tags, published_at, reading_time")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(4),
    ]);

    categories = (categoriesRes.data as Category[] | null) ?? [];
    featured = (featuredRes.data as unknown as Tool[] | null) ?? [];
    totalTools = statsRes.count ?? 0;
    news = (newsRes.data as NewsItem[] | null) ?? [];
  }

  return (
    <div className="flex flex-col flex-1">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        {/* Subtle gradient mesh background */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.18), transparent), radial-gradient(ellipse 60% 40% at 80% 30%, rgba(6, 182, 212, 0.10), transparent)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            {/* Copy */}
            <div className="text-center lg:text-right">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-4 py-1.5 text-sm font-medium text-violet-700 shadow-sm backdrop-blur dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                </span>
                <span className="font-mono text-xs font-semibold tracking-wider">
                  {totalTools} {totalTools === 1 ? "أداة" : "أداة"} · محدّثة يومياً
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
                {BRAND_VOICE.tagline.split(" ").map((word, i, arr) =>
                  i === arr.length - 2 ? (
                    <span key={i}>
                      <br />
                      <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                        {word}{" "}
                      </span>
                    </span>
                  ) : i >= arr.length - 1 ? (
                    <span key={i} className="text-zinc-900 dark:text-zinc-50">
                      {word}
                    </span>
                  ) : (
                    <span key={i}>{word} </span>
                  )
                )}
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 lg:mx-0 dark:text-zinc-400">
                {BRAND_VOICE.mission}. مراجعات حقيقية، أسعار محدّثة، وبدائل مجانية لكل أداة تحتاجها.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                <Link
                  href="/tools"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  استكشف الأدوات
                  <ArrowRight className="h-4 w-4 transition group-hover:-translate-x-0.5 rotate-180" />
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  اقرأ المدونة
                </Link>
              </div>

              {/* Trust strip */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500 lg:justify-start dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> مراجعات حقيقية
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> دعم عربي
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> محدّثة يومياً
                </span>
              </div>
            </div>

            {/* Logo wall — the social proof */}
            <div className="relative">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 blur-2xl" />
              <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {(featured.length > 0
                  ? featured.slice(0, 8)
                  : [
                      { slug: "chatgpt", name: "ChatGPT" },
                      { slug: "claude", name: "Claude" },
                      { slug: "gemini", name: "Gemini" },
                      { slug: "midjourney", name: "Midjourney" },
                      { slug: "cursor", name: "Cursor" },
                      { slug: "perplexity", name: "Perplexity" },
                      { slug: "elevenlabs", name: "ElevenLabs" },
                      { slug: "zapier", name: "Zapier" },
                    ]
                ).map((tool, i) => (
                  <div
                    key={tool.slug}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <ToolLogoServer
                      slug={tool.slug}
                      name={tool.name}
                      size={48}
                      rounded="xl"
                      className="h-full w-full"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                +{totalTools} أداة أخرى في الكتالوج
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Categories ===== */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
              تصفّح بالفئة
            </p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              اختار فئتك وابدأ
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              من المساعدين للصور، من البرمجة للأتمتة — كل فئة فيها أفضل الأدوات
            </p>
          </div>
          <Link
            href="/categories"
            className="hidden text-sm font-semibold text-violet-600 hover:text-violet-700 sm:inline-block dark:text-violet-400"
          >
            عرض الكل ←
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => {
            const accent = CATEGORY_ACCENTS[cat.slug] ?? CATEGORY_ACCENTS["ai-assistants"];
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div
                  className="absolute inset-0 -z-10 opacity-0 transition group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${accent.from}10, ${accent.to}05)`,
                  }}
                />
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: `${accent.from}15` }}
                >
                  {accent.emoji}
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {cat.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== Featured Tools ===== */}
      {featured.length > 0 && (
        <section className="border-y border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-3 w-3" /> مختارة من الفريق
                </p>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                  الأدوات المميزة
                </h2>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  أفضل {featured.length} أدوات بناءً على تقييمات المستخدمين
                </p>
              </div>
              <Link
                href="/tools"
                className="hidden text-sm font-semibold text-violet-600 hover:text-violet-700 sm:inline-block dark:text-violet-400"
              >
                كل الأدوات ←
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Latest (News) ===== */}
      {news.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                <TrendingUp className="h-3 w-3" /> أحدث المقالات
              </p>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                آخر التحديثات من AI.DY
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                مقارنات، مراجعات، وأخبار أسبوعية من فريقنا
              </p>
            </div>
            <Link
              href="/blog"
              className="hidden text-sm font-semibold text-violet-600 hover:text-violet-700 sm:inline-block dark:text-violet-400"
            >
              كل المقالات ←
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {news.map((n) => (
              <Link
                key={n.id}
                href={`/blog/${n.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                {n.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.cover_url}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div
                    className="aspect-[16/10] w-full"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))",
                    }}
                  />
                )}
                <div className="flex flex-1 flex-col p-5">
                  {n.tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {n.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="line-clamp-2 text-base font-bold leading-snug text-zinc-900 group-hover:text-violet-600 dark:text-zinc-50 dark:group-hover:text-violet-400">
                    {n.title}
                  </h3>
                  {n.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {n.excerpt}
                    </p>
                  )}
                  <div className="mt-auto pt-3 text-xs text-zinc-500">
                    {relativeTime(n.published_at)}
                    {n.reading_time && <span> · {n.reading_time} د قراءة</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-10 text-center text-white sm:p-16">
          <div
            className="absolute inset-0 -z-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.4), transparent 60%)",
            }}
          />
          <div className="relative z-10">
            <h2 className="text-3xl font-black sm:text-4xl">
              جاهز تختار أداة الذكاء الاصطناعي المناسبة؟
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
              قارن بين {totalTools} أداة في {categories.length} فئات. كل اللي
              محتاجه في مكان واحد.
            </p>
            <Link
              href="/tools"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
            >
              ابدأ الاستكشاف
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
