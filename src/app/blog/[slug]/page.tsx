import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";

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
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
    .maybeSingle<Pick<Post, "title" | "excerpt"> & {
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
  // it's an RLS-protected write that can throw on anonymous visitors
  // and we don't want a side effect to break the page render.
  const { data: post, error } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, content_mdx, cover_url, tags, reading_time, published_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<Post>();
  if (error || !post) notFound();

  return (
    <article className="flex flex-col flex-1">
      {/* Cover */}
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

      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
          <nav className="mb-6 text-xs text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-violet-600">المدونة</Link>
            <span className="mx-2">/</span>
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
            {post.published_at && <span>{formatDate(post.published_at)}</span>}
            {post.reading_time && <span>{post.reading_time} د قراءة</span>}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
        <div className="prose prose-zinc max-w-none text-lg leading-relaxed dark:prose-invert">
          <ReactMarkdown>{post.content_mdx ?? ""}</ReactMarkdown>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            ← كل المقالات
          </Link>
        </div>
      </div>
    </article>
  );
}
