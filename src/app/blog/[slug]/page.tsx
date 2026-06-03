import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowRight, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";
import { ShareButtons } from "./share-buttons";

type Params = { slug: string };

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_mdx: string | null;
  cover_url: string | null;
  tags: string[];
  reading_time: number | null;
  published_at: string | null;
  author_id: string | null;
  category_id: string | null;
};

type RelatedTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
};

type RelatedPost = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  reading_time: number | null;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return { title: "مقال", alternates: { canonical: `/blog/${slug}` } };
  }
  const { data: post } = await supabase
    .from("articles")
    .select("title, excerpt, meta_title, meta_description, cover_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<{
      title: string;
      excerpt: string | null;
      meta_title: string | null;
      meta_description: string | null;
      cover_url: string | null;
    }>();
  if (!post) {
    return { title: "مقال غير موجود", alternates: { canonical: `/blog/${slug}` } };
  }
  const stripSuffix = (t: string | null | undefined) =>
    t?.replace(/\s*\|\s*AI\.DY\s*$/i, "") ?? null;
  return {
    title: stripSuffix(post.meta_title) ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: stripSuffix(post.meta_title) ?? post.title,
      description: post.excerpt ?? post.meta_description ?? undefined,
      type: "article",
      images: post.cover_url ? [post.cover_url] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  // Single read with explicit fields. We do NOT touch views_count here —
  // it's an RLS-protected write that throws on anonymous visitors and
  // we don't want a side effect to break the page render.
  const { data: post, error } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, content_mdx, cover_url, tags, reading_time, published_at, author_id, category_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<Post>();
  if (error || !post) notFound();

  // Resolve target tools by slug. post.tags may include tool slugs (any
  // tag that looks like a slug) — we match them against the tools table
  // via .in("slug", ...). Wrapped in try/catch so a permission/RLS
  // issue degrades gracefully (the post still renders).
  let relatedTools: RelatedTool[] = [];
  try {
    const targetToolSlugs = (post.tags ?? [])
      .filter((t) => /^[a-z0-9-]+$/.test(t))
      .slice(0, 6);
    if (targetToolSlugs.length > 0) {
      const { data } = await supabase
        .from("tools")
        .select("id, slug, name, tagline")
        .in("slug", targetToolSlugs)
        .eq("is_published", true)
        .limit(6);
      relatedTools = (data as RelatedTool[] | null) ?? [];
    }
  } catch {
    // Best-effort: if the tools query fails (RLS, transient), the
    // related-tools section just doesn't render.
  }

  // Related posts: 3 most recent published articles excluding current.
  // Also wrapped in try/catch for the same reason.
  let relatedPosts: RelatedPost[] = [];
  try {
    const { data } = await supabase
      .from("articles")
      .select("id, slug, title, cover_url, reading_time")
      .eq("status", "published")
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3);
    relatedPosts = (data as RelatedPost[] | null) ?? [];
  } catch {
    // Best-effort.
  }

  const shareUrl = `${getSiteUrl()}/blog/${post.slug}`;

  return (
    <article className="flex flex-col flex-1">
      {/* ===== Cover ===== */}
      {post.cover_url && (
        <div className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <div className="aspect-[21/9] max-h-[480px] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* ===== Header ===== */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
          <nav className="mb-6 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <ChevronRight className="h-3 w-3 rotate-180" />
            <Link href="/blog" className="hover:text-violet-600">المدونة</Link>
            <ChevronRight className="h-3 w-3 rotate-180" />
            <span className="truncate text-zinc-700 dark:text-zinc-300">{post.title}</span>
          </nav>

          {post.tags && post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 4).map((t: string) => (
                <span
                  key={t}
                  className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {post.excerpt}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {post.published_at && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(post.published_at)}
              </span>
            )}
            {post.reading_time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.reading_time} د قراءة
              </span>
            )}
            {/* Share buttons are a Client Component (needs onClick) */}
            <ShareButtons url={shareUrl} title={post.title} />
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
        <div className="prose prose-zinc max-w-none text-lg leading-relaxed dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:my-4 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-li:my-2 prose-img:rounded-2xl">
          <ReactMarkdown>{post.content_mdx ?? ""}</ReactMarkdown>
        </div>
      </div>

      {/* ===== Related Tools (if any tags map to tool slugs) ===== */}
      {relatedTools.length > 0 && (
        <section className="border-y border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="mx-auto max-w-4xl px-6 py-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              الأدوات المذكورة في المقال
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTools.map((t) => (
                <Link
                  key={t.id}
                  href={`/tools/${t.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <ToolLogoServer slug={t.slug} name={t.name} size={40} rounded="lg" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-violet-600 dark:text-zinc-50 dark:group-hover:text-violet-400">
                      {t.name}
                    </p>
                    {t.tagline && (
                      <p className="truncate text-xs text-zinc-500">
                        {t.tagline}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Related Posts ===== */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            مقالات مشابهة
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {relatedPosts.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                {r.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.cover_url}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div
                    className="aspect-[16/10] w-full"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(6,182,212,0.10))",
                    }}
                  />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {r.title}
                  </h3>
                  {r.reading_time && (
                    <div className="mt-auto pt-2 text-xs text-zinc-500">
                      {r.reading_time} د قراءة
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              كل المقالات
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
