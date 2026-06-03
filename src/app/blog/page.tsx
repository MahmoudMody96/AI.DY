import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "المدونة",
  description: "مقالات ونصائح عن أدوات الذكاء الاصطناعي وكيفية استخدامها في عملك وحياتك اليومية.",
  alternates: { canonical: "/blog" },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const supabase = await createClient();
  let posts: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    cover_url: string | null;
    tags: string[];
    reading_time: number | null;
    published_at: string | null;
  }> = [];

  if (supabase) {
    const { data } = await supabase
      .from("articles")
      .select("id, slug, title, excerpt, cover_url, tags, reading_time, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50);
    posts = data ?? [];
  }

  return (
    <div className="flex flex-col flex-1">
      <section className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <nav className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-900 dark:text-zinc-100">المدونة</span>
          </nav>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">المدونة</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            مقالات ونصائح عن أدوات الذكاء الاصطناعي وكيفية استخدامها في عملك وحياتك اليومية.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-lg font-semibold">قيد البناء 🚧</p>
            <p className="mt-2 text-sm text-zinc-500">
              بنحضّر محتوى قوي — مقالات، مراجعات تفصيلية، ومقارنات. ارجع قريباً.
            </p>
            <Link
              href="/tools"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              استكشف الأدوات في الأثناء
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-700"
              >
                {p.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.cover_url}
                    alt=""
                    className="aspect-[16/9] w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-5">
                  {p.tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="text-lg font-bold leading-tight group-hover:text-violet-600">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {p.excerpt}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-zinc-500">
                    {p.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(p.published_at)}
                      </span>
                    )}
                    {p.reading_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {p.reading_time} د
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
