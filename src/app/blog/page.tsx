import Link from "next/link";
import { Calendar, Clock, ArrowRight, Sparkles, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  tags: string[];
  reading_time: number | null;
  published_at: string | null;
  is_featured: boolean | null;
  category_id: string | null;
};

type Category = { id: string; name: string; slug: string };

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const metadata = {
  title: "المدونة",
  description: "مقالات، مراجعات، ومقارنات لأدوات الذكاء الاصطناعي. محدّثة أسبوعياً.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const supabase = await createClient();
  let posts: Post[] = [];
  let categories: Category[] = [];

  if (supabase) {
    const [postsRes, catRes] = await Promise.all([
      supabase
        .from("articles")
        .select(
          "id, slug, title, excerpt, cover_url, tags, reading_time, published_at, is_featured, category_id"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50),
      supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("position"),
    ]);
    posts = (postsRes.data as Post[] | null) ?? [];
    categories = (catRes.data as Category[] | null) ?? [];
  }

  // Build tag cloud
  const tagCounts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);

  const [featured, ...rest] = posts;

  if (posts.length === 0) {
    return (
      <div className="flex flex-col flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 py-20 text-center">
          <h1 className="mb-3 text-4xl font-black tracking-tight">المدونة</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            قريباً — بنحضّر محتوى قوي
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* ===== Hero / Featured Post ===== */}
      {featured && (
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                  <Sparkles className="h-3 w-3" /> الأحدث
                </p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  آخر المقالات
                </h1>
              </div>
            </div>

            <Link
              href={`/blog/${featured.slug}`}
              className="group grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 lg:grid-cols-[1.4fr_1fr]"
            >
              {featured.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.cover_url}
                  alt=""
                  className="aspect-[16/10] h-full w-full object-cover lg:aspect-auto"
                />
              ) : (
                <div
                  className="aspect-[16/10] h-full w-full lg:aspect-auto"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(6,182,212,0.18))",
                  }}
                />
              )}
              <div className="flex flex-col justify-center p-6 sm:p-8">
                {featured.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {featured.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-3 line-clamp-3 text-base text-zinc-600 dark:text-zinc-400">
                    {featured.excerpt}
                  </p>
                )}
                <div className="mt-5 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(featured.published_at)}
                  </span>
                  {featured.reading_time && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {featured.reading_time} د قراءة
                    </span>
                  )}
                </div>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 group-hover:text-violet-700 dark:text-violet-400">
                  اقرأ المقال
                  <ArrowRight className="h-4 w-4 rotate-180 transition group-hover:-translate-x-0.5" />
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ===== Filters (tags) ===== */}
      {topTags.length > 0 && (
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Search className="mb-0.5 mr-1 inline h-3 w-3" /> مواضيع:
              </span>
              {topTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Post Grid ===== */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            كل المقالات
            <span className="ml-2 text-base font-normal text-zinc-500">
              ({posts.length})
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              {p.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover_url}
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div
                  className="aspect-[16/10] w-full"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.12))",
                  }}
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                {p.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {p.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <h3 className="line-clamp-2 text-lg font-bold leading-snug text-zinc-900 group-hover:text-violet-600 dark:text-zinc-50 dark:group-hover:text-violet-400">
                  {p.title}
                </h3>
                {p.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {p.excerpt}
                  </p>
                )}
                <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-zinc-500">
                  {p.published_at && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(p.published_at)}
                    </span>
                  )}
                  {p.reading_time && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {p.reading_time} د
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
