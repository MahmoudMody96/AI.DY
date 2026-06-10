import Link from "next/link";
import { Calendar, Clock, ArrowRight, Sparkles, MessageCircle, Heart, User, BookOpen, GitCompare, Briefcase, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  blog_post: { label: "مقال", icon: BookOpen },
  comparison: { label: "مقارنة", icon: GitCompare },
  use_case: { label: "حالة استخدام", icon: Briefcase },
  user_post: { label: "مشاركة", icon: User },
};

type UnifiedPost = {
  source: "blog_post" | "user_post";
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover: string | null;
  published_at: string | null;
  reading_time_min: number | null;
  type_label: string;
  type_icon: LucideIcon;
  author: { id: string; display_name: string | null; avatar_url: string | null } | null;
  likes_count: number;
  comments_count: number;
};

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  type: string;
  reading_time_minutes: number | null;
  published_at: string | null;
  author_id: string | null;
};

type UserPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  reading_time: number | null;
  published_at: string | null;
  author_id: string;
  likes_count: number;
  comments_count: number;
};

type Author = { id: string; display_name: string | null; avatar_url: string | null };

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function fetchUnified(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>): Promise<UnifiedPost[]> {
  const [blogRes, userRes] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image, type, reading_time_minutes, published_at, author_id")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_posts")
      .select("id, slug, title, excerpt, cover_url, reading_time, published_at, author_id, likes_count, comments_count")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50),
  ]);

  const blogRows = (blogRes.data as BlogPostRow[] | null) ?? [];
  const userRows = (userRes.data as UserPostRow[] | null) ?? [];

  const authorIds = Array.from(
    new Set(
      [
        ...blogRows.map((b) => b.author_id).filter(Boolean),
        ...userRows.map((u) => u.author_id),
      ] as string[]
    )
  );
  let authorMap: Record<string, Author> = {};
  if (authorIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);
    authorMap = Object.fromEntries(((data as Author[] | null) ?? []).map((a) => [a.id, a]));
  }

  const blogPosts: UnifiedPost[] = blogRows.map((b) => {
    const meta = TYPE_META[b.type] ?? TYPE_META.blog_post;
    return {
      source: "blog_post",
      id: b.id,
      slug: b.slug,
      title: b.title,
      excerpt: b.excerpt,
      cover: b.cover_image,
      published_at: b.published_at,
      reading_time_min: b.reading_time_minutes,
      type_label: meta.label,
      type_icon: meta.icon,
      author: b.author_id ? authorMap[b.author_id] ?? null : null,
      likes_count: 0,
      comments_count: 0,
    };
  });

  const userPosts: UnifiedPost[] = userRows.map((u) => ({
    source: "user_post",
    id: u.id,
    slug: u.slug,
    title: u.title,
    excerpt: u.excerpt,
    cover: u.cover_url,
    published_at: u.published_at,
    reading_time_min: u.reading_time,
    type_label: TYPE_META.user_post.label,
    type_icon: TYPE_META.user_post.icon,
    author: authorMap[u.author_id] ?? null,
    likes_count: u.likes_count ?? 0,
    comments_count: u.comments_count ?? 0,
  }));

  return [...blogPosts, ...userPosts].sort((a, b) => {
    const at = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bt = b.published_at ? new Date(b.published_at).getTime() : 0;
    return bt - at;
  });
}

export const metadata = {
  title: "المدونة",
  description: "مقالات، مراجعات، مقارنات، وحالات استخدام لأدوات الذكاء الاصطناعي. محتوى من فريق AI.DY ومن المجتمع.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const supabase = await createClient();
  let posts: UnifiedPost[] = [];

  if (supabase) {
    try {
      posts = await fetchUnified(supabase);
    } catch {
      posts = [];
    }
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 py-20 text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
          <h1 className="mb-3 text-4xl font-black tracking-tight">المدونة</h1>
          <p className="mb-2 text-zinc-600 dark:text-zinc-400">
            مقالات، مراجعات، وحالات استخدام أدوات الذكاء الاصطناعي
          </p>
        </section>
      </div>
    );
  }

  const [featured, ...rest] = posts;
  const TypeIcon = featured.type_icon;

  return (
    <div className="flex flex-col flex-1">
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                <Sparkles className="h-3 w-3" /> أحدث المقالات
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                مدوّنة AI.DY
              </h1>
            </div>
          </div>

          <Link
            href={`/blog/${featured.slug}`}
            className="group grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 lg:grid-cols-[1.4fr_1fr]"
          >
            {featured.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.cover} alt="" className="aspect-[16/10] h-full w-full object-cover lg:aspect-auto" />
            ) : (
              <div className="aspect-[16/10] h-full w-full lg:aspect-auto" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(6,182,212,0.18))" }} />
            )}
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  <TypeIcon className="h-3 w-3" />
                  {featured.type_label}
                </span>
                {featured.source === "blog_post" && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    AI.DY
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="mt-3 line-clamp-3 text-base text-zinc-600 dark:text-zinc-400">
                  {featured.excerpt}
                </p>
              )}

              {featured.author && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  {featured.author.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.author.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                      {(featured.author.display_name ?? "?").charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {featured.author.display_name ?? "AI.DY"}
                  </span>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                {featured.published_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(featured.published_at)}
                  </span>
                )}
                {featured.reading_time_min && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {featured.reading_time_min} د قراءة
                  </span>
                )}
                {featured.source === "user_post" && (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5" /> {featured.likes_count}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" /> {featured.comments_count}
                    </span>
                  </>
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
          {rest.map((p) => {
            const PTypeIcon = p.type_icon;
            return (
              <Link
                key={`${p.source}-${p.id}`}
                href={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt="" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/10] w-full" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.12))" }} />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                      <PTypeIcon className="h-2.5 w-2.5" />
                      {p.type_label}
                    </span>
                    {p.source === "blog_post" && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        AI.DY
                      </span>
                    )}
                  </div>
                  {p.author && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
                      {p.author.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.author.avatar_url} alt="" className="h-4 w-4 rounded-full" />
                      ) : (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                          {(p.author.display_name ?? "?").charAt(0)}
                        </div>
                      )}
                      <span>{p.author.display_name ?? "AI.DY"}</span>
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
                    {p.reading_time_min && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {p.reading_time_min} د
                      </span>
                    )}
                    {p.source === "user_post" && (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {p.likes_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {p.comments_count}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
