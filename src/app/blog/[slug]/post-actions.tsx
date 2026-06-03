"use client";

import { useState, useTransition } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";

interface PostActionsProps {
  postId: string;
  initialLikes: number;
  initialComments: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
}

export function LikeButton({
  postId,
  initialLikes,
  initialLiked,
  isAuthenticated,
}: Pick<PostActionsProps, "postId" | "initialLikes" | "initialLiked" | "isAuthenticated">) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [isPending, startTransition] = useTransition();

  const handleToggle = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }

    // Optimistic update
    const prevLiked = liked;
    const prevLikes = likes;
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/user/posts/${postId}/like`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("like failed");
        const data = await res.json();
        setLiked(data.liked);
        setLikes(data.likes_count);
      } catch {
        // Rollback optimistic update
        setLiked(prevLiked);
        setLikes(prevLikes);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
        liked
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
      aria-pressed={liked}
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      <span>{likes}</span>
    </button>
  );
}

interface Comment {
  id: string;
  content: string;
  author: { display_name: string | null; avatar_url: string | null } | null;
  created_at: string;
  parent_id: string | null;
  status: string;
}

interface CommentsSectionProps {
  postId: string;
  initialComments: Comment[];
  isAuthenticated: boolean;
}

export function CommentsSection({
  postId,
  initialComments,
  isAuthenticated,
}: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    if (!text.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post comment");
      }
      const data = await res.json();
      setComments([...comments, data.comment]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
        <MessageCircle className="h-5 w-5" />
        التعليقات ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isAuthenticated ? "اكتب تعليقاً..." : "سجّل دخولك للتعليق"}
          disabled={!isAuthenticated || submitting}
          rows={3}
          maxLength={4000}
          className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {error && (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">{text.length} / 4000</span>
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "جاري النشر..." : "نشر"}
          </button>
        </div>
      </form>

      <ul className="space-y-4">
        {comments.length === 0 ? (
          <li className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
            لا توجد تعليقات بعد — كن أول من يعلّق
          </li>
        ) : (
          comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                {c.author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.author.avatar_url}
                    alt=""
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    {(c.author?.display_name ?? "?").charAt(0)}
                  </div>
                )}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {c.author?.display_name ?? "عضو"}
                </span>
                <span>·</span>
                <span>{new Date(c.created_at).toLocaleDateString("ar-EG")}</span>
                {c.status === "pending" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    قيد المراجعة
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                {c.content}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
