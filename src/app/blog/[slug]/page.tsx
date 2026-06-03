import Link from "next/link";
import { notFound } from "next/navigation";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";
import { ShareButtons } from "./share-buttons";
import { LikeButton, CommentsSection } from "./post-actions";

type Params = { slug: string };

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
    return { title: "مشاركة", alternates: { canonical: `/blog/${slug}` } };
  }
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  // Get the post
  const { data: post, error } = await supabase
    .from("user_posts")
    .select(
      "id, slug, title, excerpt, body, cover_url, tags, reading_time, published_at, author_id, likes_count, comments_count"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<UserPost>();
  if (error || !post) notFound();

  // Get the author
  let author: Author | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio")
      .eq("id", post.author_id)
      .maybeSingle<Author>();
    author = data ?? null;
  } catch {
    // Best-effort
  }

  // Get the current user (to determine if they liked, and for auth)
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
  } catch {
    // Best-effort
  }

  // Get comments
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
  } catch {
    // Best-effort
  }

  // Get related posts (same category, exclude current)
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
  } catch {
    // Best-effort
  }

  const shareUrl = `${getSiteUrl()}/blog/${post.slug}`;
  const isAuthenticated = !!currentUserId;

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

          {/* Author + meta + share */}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {author && (
              <div className="flex items-center gap-2">
                {author.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={author.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
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

      {/* ===== Content ===== */}
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
        <div className="prose prose-zinc max-w-none text-lg leading-relaxed dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:my-4 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-li:my-2 prose-img:rounded-2xl">
          <ReactMarkdown>{post.body ?? ""}</ReactMarkdown>
        </div>

        {/* ===== Actions (Like + Comment count) ===== */}
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

        {/* ===== Comments ===== */}
        <div id="comments" className="mt-10">
          <CommentsSection
            postId={post.id}
            initialComments={comments}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>

      {/* ===== Related Posts ===== */}
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
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              كل المشاركات
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
