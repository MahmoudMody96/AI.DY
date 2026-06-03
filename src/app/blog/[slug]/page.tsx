import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";

type Params = { slug: string };

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
    .maybeSingle();
  if (!post) {
    return { title: "مقال غير موجود", alternates: { canonical: `/blog/${slug}` } };
  }
  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.meta_title ?? post.title,
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

  const { data: post, error } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, content_mdx, content_html, cover_url, tags, reading_time, published_at, author_id, category_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !post) notFound();

  // Increment views (fire and forget)
  void supabase
    .from("articles")
    .update({ views_count: ((post as { views_count?: number }).views_count ?? 0) + 1 })
    .eq("id", post.id);

  return (
    <div className="flex flex-col flex-1">
      <section className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <nav className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-violet-600">المدونة</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-900 dark:text-zinc-100">{post.title}</span>
          </nav>
          {post.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {post.tags.slice(0, 4).map((t: string) => (
                <span
                  key={t}
                  className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(post.published_at)}
              </span>
            )}
            {post.reading_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.reading_time} د قراءة
              </span>
            )}
          </div>
        </div>
      </section>

      {post.cover_url && (
        <div className="mx-auto w-full max-w-3xl px-6 pt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_url}
            alt=""
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        </div>
      )}

      <article className="prose prose-zinc mx-auto w-full max-w-3xl px-6 py-12 dark:prose-invert">
        <ReactMarkdown>{post.content_mdx}</ReactMarkdown>
      </article>

      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            كل المقالات
          </Link>
        </div>
      </div>
    </div>
  );
}
