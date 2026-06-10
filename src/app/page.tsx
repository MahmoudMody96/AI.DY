import Link from "next/link";
import { ArrowLeft, Sparkles, Shield, Globe, Zap, Compass, Library } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";
import { BRAND_VOICE } from "@/components/brand/voice";
import { Container } from "@/components/layout/container";
import { ToolGrid } from "@/components/tools/tool-grid";
import { CategoryGrid } from "@/components/categories/category-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { SponsoredSlot } from "@/components/marketing/sponsored-slot";
import { LeadGenCta } from "@/components/marketing/lead-gen-cta";

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
      {/* ===== Hero — editorial, asymmetric, warm cream backdrop ===== */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="absolute inset-0 -z-10 pattern-stars" aria-hidden />
        <div
          className="absolute -top-32 -end-32 -z-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 -start-32 -z-10 h-96 w-96 rounded-full bg-primary/8 blur-3xl"
          aria-hidden
        />

        <Container className="py-20 sm:py-28">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_1fr]">
            {/* Copy column — type-driven, generous space */}
            <div className="relative">
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-sm font-semibold text-foreground-soft shadow-warm-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <span>
                  {totalTools} {totalTools === 1 ? "أداة" : "أداة"} · محدّثة يومياً
                </span>
              </div>

              <h1 className="heading-display text-5xl text-foreground sm:text-6xl lg:text-7xl">
                <span className="block">دليلك</span>
                <span className="block">
                  لأدوات <span className="text-primary">الذكاء</span>
                </span>
                <span className="block">الاصطناعي.</span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-relaxed text-foreground-soft">
                {BRAND_VOICE.mission} مراجعات حقيقية، أسعار محدّثة، وبدائل
                مجانية لكل أداة تحتاجها.
              </p>

              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href="/tools" className="gap-2">
                    استكشف الأدوات
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/use-cases">حالات الاستخدام</Link>
                </Button>
              </div>

              {/* Trust strip — warm, not glassy */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-foreground-soft">
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" /> مراجعات حقيقية
                </span>
                <span className="hidden h-4 w-px bg-border sm:inline-block" />
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-primary" /> دعم عربي
                </span>
                <span className="hidden h-4 w-px bg-border sm:inline-block" />
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" /> محدّثة يومياً
                </span>
              </div>
            </div>

            {/* Logo wall — paper card with warm border */}
            <div className="relative">
              <div className="absolute -inset-3 -z-10 rounded-2xl border border-border bg-surface-elevated shadow-warm-md" />
              <div className="relative rounded-xl border border-border bg-surface-elevated p-6 shadow-warm-sm">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-soft">
                  أشهر الأدوات
                </p>
                <div className="grid grid-cols-4 gap-2.5">
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
                  ).map((tool) => (
                    <div
                      key={tool.slug}
                      className="group flex aspect-square items-center justify-center rounded-md border border-border bg-card p-2 transition hover:border-primary hover:shadow-warm-sm"
                    >
                      <ToolLogoServer
                        slug={tool.slug}
                        name={tool.name}
                        size={36}
                        className="h-full w-full"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-5 border-t border-border pt-4 text-xs text-foreground-soft">
                  +{totalTools} أداة أخرى في الكتالوج الكامل
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== How it works — 3 steps, warm sand surface ===== */}
      <section className="border-b border-border bg-surface/40">
        <Container className="py-16">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow mb-2">الطريقة</p>
            <h2 className="heading-display text-3xl text-foreground sm:text-4xl">
              من الفكرة للأداة المناسبة في 3 خطوات
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Compass,
                title: "تصفّح الفئات",
                body: "اختار من 8 فئات — كتابة، برمجة، صور، فيديو، أتمتة…",
              },
              {
                icon: Sparkles,
                title: "جرّب قبل ما تلتزم",
                body: "كل أداة فيها Demo تجريبي. شوفها بإيدك قبل ما تدفع.",
              },
              {
                icon: Library,
                title: "احفظ وشارك",
                body: "سجّل حسابك واحفظ الأدوات اللي عجبتك في مكتبة شخصية.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-lg border border-border bg-card p-6 transition hover:border-primary hover:shadow-warm-md"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-base font-bold">
                    ۰{1 + i}
                  </span>
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-soft">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ===== Sponsored slot ===== */}
      <Container className="py-12">
        <SponsoredSlot position="homepage_hero" />
      </Container>

      {/* ===== Categories ===== */}
      <section className="py-20">
        <Container>
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">تصفّح بالفئة</p>
              <h2 className="heading-display text-3xl text-foreground sm:text-4xl">
                اختار فئتك وابدأ
              </h2>
              <p className="mt-2 max-w-xl text-foreground-soft">
                من المساعدين للصور، من البرمجة للأتمتة — كل فئة فيها أفضل الأدوات
              </p>
            </div>
            <Link
              href="/categories"
              className="hidden text-sm font-semibold text-primary hover:underline sm:inline-block"
            >
              كل الفئات ←
            </Link>
          </div>

          {categories.length > 0 ? (
            <CategoryGrid categories={categories} variant="featured" />
          ) : (
            <EmptyState
              title="لا توجد فئات بعد"
              description="ستظهر الفئات هنا عند إضافتها."
            />
          )}
        </Container>
      </section>

      {/* ===== Featured Tools — paper-warm surface ===== */}
      {featured.length > 0 && (
        <section className="border-y border-border bg-surface/30">
          <Container className="py-20">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2 inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> مختارة من الفريق
                </p>
                <h2 className="heading-display text-3xl text-foreground sm:text-4xl">
                  الأدوات المميزة
                </h2>
                <p className="mt-2 max-w-xl text-foreground-soft">
                  أفضل {featured.length} أدوات بناءً على تقييمات المستخدمين
                </p>
              </div>
              <Link
                href="/tools"
                className="hidden text-sm font-semibold text-primary hover:underline sm:inline-block"
              >
                كل الأدوات ←
              </Link>
            </div>

            <ToolGrid tools={featured} />
          </Container>
        </section>
      )}

      {/* ===== Latest (News) ===== */}
      {news.length > 0 && (
        <section className="py-20">
          <Container>
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">أحدث المقالات</p>
                <h2 className="heading-display text-3xl text-foreground sm:text-4xl">
                  من مدوّنة AI.DY
                </h2>
                <p className="mt-2 max-w-xl text-foreground-soft">
                  مقارنات، مراجعات، وأخبار أسبوعية من فريقنا
                </p>
              </div>
              <Link
                href="/blog"
                className="hidden text-sm font-semibold text-primary hover:underline sm:inline-block"
              >
                كل المقالات ←
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {news.map((n) => (
                <Link
                  key={n.id}
                  href={`/blog/${n.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-warm-md"
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
                          "linear-gradient(135deg, rgba(194,138,42,0.18), rgba(183,71,42,0.18))",
                      }}
                    />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {n.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {n.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-soft"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground group-hover:text-primary">
                      {n.title}
                    </h3>
                    {n.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-foreground-soft">
                        {n.excerpt}
                      </p>
                    )}
                    <div className="mt-auto pt-3 text-xs text-foreground-soft">
                      {relativeTime(n.published_at)}
                      {n.reading_time && <span> · {n.reading_time} د قراءة</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ===== CTA — paper card with warm border, no gradient mesh ===== */}
      <section className="py-20">
        <Container>
          <div className="relative overflow-hidden rounded-xl border border-border-strong bg-card p-10 text-center sm:p-16">
            <div
              className="absolute inset-0 -z-10 pattern-stars opacity-50"
              aria-hidden
            />
            <div className="relative">
              <p className="eyebrow mb-3">جاهز تختار؟</p>
              <h2 className="heading-display mx-auto max-w-2xl text-3xl text-foreground sm:text-4xl">
                {totalTools} أداة، {categories.length} فئات — كل اللي محتاجه في
                مكان واحد
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-foreground-soft">
                قارن، جرّب، واختار. من غير إعلانات مدفوعة ولا بدائل مدفونة.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/tools" className="gap-2">
                    ابدأ الاستكشاف
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/categories">تصفّح الفئات</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== LeadGenCta (Phase 4.0) ===== */}
      <section className="border-t border-border pb-20">
        <Container>
          <LeadGenCta variant="default" source="homepage" />
        </Container>
      </section>
    </div>
  );
}

// Local Button alias to keep this file self-contained for the
// homepage redesign — uses the project's Button component.
import { Button } from "@/components/ui/button";
