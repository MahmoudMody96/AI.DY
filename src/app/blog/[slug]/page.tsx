import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Calendar,
  Clock,
  ArrowRight,
  Twitter,
  Linkedin,
  Link2,
  ChevronRight,
  Heart,
  MessageCircle,
  User,
  BookOpen,
  GitCompare,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";
import { ShareButtons } from "./share-buttons";
import { LikeButton, CommentsSection } from "./post-actions";

type Params = { slug: string };

// ============================================
// blog_posts (Content Engine — editorial / agent-generated)
// ============================================
type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string;
  body_html: string | null;
  cover_image: string | null;
  type: "blog_post" | "comparison" | "use_case";
  target_tools: string[] | null;
  target_categories: string[] | null;
  seo_keywords: string[] | null;
  reading_time_minutes: number | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// user_posts (UGC blog — community / members)
// ============================================
type UserPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  tags: string[];
  reading_time: number | null;
  published_at: string | null;
  author_id: string;
  likes_count: number;
  comments_count: number;
};

type Author = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type Comment = {
  id: string;
  content: string;
  author: { display_name: string | null; avatar_url: string | null } | null;
  created_at: string;
  parent_id: string | null;
  status: string;
};

const TYPE_META: Record<string, { label: string; icon: LucideIcon; labelAr: string }> = {
  blog_post: { label: "Blog Post", icon: BookOpen, labelAr: "مقال" },
  comparison: { label: "Comparison", icon: GitCompare, labelAr: "مقارنة" },
  use_case: { label: "Use Case", icon: Briefcase, labelAr: "حالة استخدام" },
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

// ============================================
// generateMetadata — works for both blog_post and user_post
// ============================================
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return { title: "مشاركة", alternates: { canonical: `/blog/${slug}` } };
  }

  // Try blog_posts first
  const { data: blogPost } = await supabase
    .from("blog_posts")
    .select("title, excerpt, type, seo_keywords, cover_image, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<{
      title: string;
      excerpt: string | null;
      type: string;
      seo_keywords: string[] | null;
      cover_image: string | null;
      published_at: string | null;
    }>();

  if (blogPost) {
    const description = blogPost.excerpt ?? undefined;
    const keywords = blogPost.seo_keywords ?? [];
    return {
      title: blogPost.title,
      description,
      keywords: keywords.length > 0 ? keywords : undefined,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: {
        title: blogPost.title,
        description,
        type: "article",
        url: `${getSiteUrl()}/blog/${slug}`,
        images: blogPost.cover_image ? [{ url: blogPost.cover_image }] : undefined,
        publishedTime: blogPost.published_at ?? undefined,
        siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "AI.DY",
        locale: "ar_EG",
      },
      twitter: {
        card: "summary_large_image",
        title: blogPost.title,
        description,
        images: blogPost.cover_image ? [blogPost.cover_image] : undefined,
      },
    };
  }

  // Fallback: user_posts
  const { data: post } = await supabase
    .from("user_posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<{ title: string; excerpt: string | null }>();
  if (!post) {
    return { title: "مشاركة غير موجودة", alternates: { canonical: `/blog/${slug}` } };
  }
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
    },
  };
}

// ============================================
// Main page — dispatches to blog_post or user_post renderer
// ============================================
export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  // 1) Try blog_posts (Content Engine)
  const { data: blogPost } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, body_markdown, body_html, cover_image, type, target_tools, target_categories, seo_keywords, reading_time_minutes, author_id, published_at, created_at, updated_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<BlogPost>();

  if (blogPost) {
    return <BlogPostView post={blogPost} />;
  }

  // 2) Try user_posts (UGC) — original flow preserved
  const { data: post } = await supabase
    .from("user_posts")
    .select(
      "id, slug, title, excerpt, body, cover_url, tags, reading_time, published_at, author_id, likes_count, comments_count"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<UserPost>();

  // Backwards compatibility: if no user_post matches, the slug might be
  // an old editorial article. Redirect to /news/[slug] for the new home.
  if (!post) {
    const { data: article } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle<{ id: string }>();
    if (article) {
      redirect(`/news/${slug}`);
    }
    notFound();
  }

  // --- Original user_posts render path (preserved) ---
  let author: Author | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio")
      .eq("id", post.author_id)
      .maybeSingle<Author>();
    author = data ?? null;
  } catch {}

  let currentUserId: string | null = null;
  let userLiked = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;
    if (currentUserId) {
      const { data: like } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .maybeSingle();
      userLiked = !!like;
    }
  } catch {}

  let comments: Comment[] = [];
  try {
    const { data: commentsData } = await supabase
      .from("post_comments")
      .select("id, content, created_at, parent_id, status, user_id")
      .eq("post_id", post.id)
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .limit(100);

    if (commentsData && commentsData.length > 0) {
      const userIds = Array.from(new Set(commentsData.map((c: { user_id: string }) => c.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      const profileMap = Object.fromEntries(
        ((profiles as { id: string; display_name: string | null; avatar_url: string | null }[] | null) ?? []).map(
          (p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]
        )
      );
      comments = commentsData.map((c) => ({
        id: c.id,
        content: c.content,
        author: profileMap[c.user_id] ?? null,
        created_at: c.created_at,
        parent_id: c.parent_id,
        status: c.status,
      }));
    }
  } catch {}

  let relatedPosts: Array<{
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    reading_time: number | null;
    likes_count: number;
    comments_count: number;
  }> = [];
  try {
    const { data } = await supabase
      .from("user_posts")
      .select("id, slug, title, cover_url, reading_time, likes_count, comments_count")
      .eq("status", "published")
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3);
    relatedPosts = (data as typeof relatedPosts) ?? [];
  } catch {}

  const shareUrl = `${getSiteUrl()}/blog/${post.slug}`;
  const isAuthenticated = !!currentUserId;

  return (
    <article className="flex flex-col flex-1">
      {post.cover_url && (
        <div className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <div className="aspect-[21/9] max-h-[480px] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_url} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      )}

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
                <span key={t} className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
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
            {author && (
              <div className="flex items-center gap-2">
                {author.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    {(author.display_name ?? "?").charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {author.display_name ?? "عضو"}
                  </p>
                  {author.bio && (
                    <p className="line-clamp-1 text-xs text-zinc-500">{author.bio}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col items-end gap-1 ms-auto text-end">
              <div className="flex items-center gap-4 text-xs">
                {post.published_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.published_at)}
                  </span>
                )}
                {post.reading_time && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {post.reading_time} د
                  </span>
                )}
              </div>
              <ShareButtons url={shareUrl} title={post.title} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
        <div className="prose prose-zinc max-w-none text-lg leading-relaxed dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:my-4 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-li:my-2 prose-img:rounded-2xl">
          <ReactMarkdown>{post.body ?? ""}</ReactMarkdown>
        </div>

        <div className="mt-8 flex items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <LikeButton
            postId={post.id}
            initialLikes={post.likes_count}
            initialLiked={userLiked}
            isAuthenticated={isAuthenticated}
          />
          <a
            href="#comments"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </a>
        </div>

        <div id="comments" className="mt-10">
          <CommentsSection
            postId={post.id}
            initialComments={comments}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            مشاركات مشابهة
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
                  <img src={r.cover_url} alt="" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/10] w-full" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(6,182,212,0.10))" }} />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {r.title}
                  </h3>
                  <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-zinc-500">
                    {r.reading_time && <span>{r.reading_time} د</span>}
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {r.likes_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {r.comments_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">
              <ArrowRight className="h-4 w-4 rotate-180" />
              كل المشاركات
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}

// ============================================
// BlogPostView — renders blog_posts (Content Engine)
// Renders body_html (server-rendered) when available, falls back to
// client-side ReactMarkdown over body_markdown.
// ============================================
async function BlogPostView({ post }: { post: BlogPost }) {
  const supabase = await createClient();
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const typeMeta = TYPE_META[post.type] ?? TYPE_META.blog_post;
  const TypeIcon = typeMeta.icon;

  let author: { display_name: string | null; avatar_url: string | null; bio: string | null } | null = null;
  if (post.author_id && supabase) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, bio")
        .eq("id", post.author_id)
        .maybeSingle();
      author = data ?? null;
    } catch {}
  }

  let toolMap: Record<string, { name: string; slug: string }> = {};
  if (post.target_tools && post.target_tools.length > 0 && supabase) {
    try {
      const { data } = await supabase
        .from("tools")
        .select("slug, name")
        .in("slug", post.target_tools);
      toolMap = Object.fromEntries(
        ((data as { slug: string; name: string }[] | null) ?? []).map((t) => [
          t.slug,
          { name: t.name, slug: t.slug },
        ])
      );
    } catch {}
  }

  // JSON-LD Article schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image ? [post.cover_image] : undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: author
      ? { "@type": "Person", name: author.display_name ?? "AI.DY Editorial" }
      : { "@type": "Organization", name: "AI.DY" },
    publisher: {
      "@type": "Organization",
      name: process.env.NEXT_PUBLIC_SITE_NAME ?? "AI.DY",
      url: siteUrl,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    keywords: (post.seo_keywords ?? []).join(", ") || undefined,
    articleSection: typeMeta.labelAr,
    inLanguage: "ar",
  };

  const bodyHtml = post.body_html ?? null;

  return (
    <article className="flex flex-col flex-1">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {post.cover_image && (
        <div className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <div className="aspect-[21/9] max-h-[480px] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
          <nav className="mb-6 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-violet-600">الرئيسية</Link>
            <ChevronRight className="h-3 w-3 rotate-180" />
            <Link href="/blog" className="hover:text-violet-600">المدونة</Link>
            <ChevronRight className="h-3 w-3 rotate-180" />
            <span className="truncate text-zinc-700 dark:text-zinc-300">{post.title}</span>
          </nav>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              <TypeIcon className="h-3 w-3" />
              {typeMeta.label}
            </span>
            {(post.seo_keywords ?? []).slice(0, 3).map((k) => (
              <span key={k} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                #{k}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {post.excerpt}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {author && (
              <div className="flex items-center gap-2">
                {author.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    {(author.display_name ?? "?").charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {author.display_name ?? "AI.DY"}
                  </p>
                  {author.bio && (
                    <p className="line-clamp-1 text-xs text-zinc-500">{author.bio}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col items-end gap-1 ms-auto text-end">
              <div className="flex items-center gap-4 text-xs">
                {post.published_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.published_at)}
                  </span>
                )}
                {post.reading_time_minutes && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {post.reading_time_minutes} د قراءة
                  </span>
                )}
              </div>
              <ShareButtons url={postUrl} title={post.title} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
        {bodyHtml ? (
          <div
            className="prose prose-zinc max-w-none text-lg leading-relaxed dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:my-4 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-li:my-2 prose-img:rounded-2xl"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          <div className="prose prose-zinc max-w-none text-lg leading-relaxed dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:my-4 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-li:my-2 prose-img:rounded-2xl">
            <ReactMarkdown>{post.body_markdown}</ReactMarkdown>
          </div>
        )}
      </div>

      {(post.target_tools?.length || post.target_categories?.length) ? (
        <section className="mx-auto w-full max-w-3xl px-6 pb-12">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
            {(post.target_tools?.length ?? 0) > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  أدوات مذكورة في هذا {typeMeta.labelAr}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(post.target_tools ?? []).map((slug) => {
                    const tool = toolMap[slug];
                    return (
                      <Link
                        key={slug}
                        href={`/tools/${slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:text-violet-300"
                      >
                        {tool?.name ?? slug}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {(post.target_categories?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  التصنيفات
                </p>
                <div className="flex flex-wrap gap-2">
                  {(post.target_categories ?? []).map((slug) => (
                    <Link
                      key={slug}
                      href={`/categories/${slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:text-violet-300"
                    >
                      {slug}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </article>
  );
}
