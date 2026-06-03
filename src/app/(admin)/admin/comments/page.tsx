import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, X, Trash2, MessageCircle, Eye } from "lucide-react";
import { setCommentStatus, deleteComment } from "./actions";

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}

const STATUS_COLOR = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  spam: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
} as const;

export default async function AdminCommentsPage() {
  const admin = await createClient();
  if (!admin) return <div className="text-zinc-500">Admin client unavailable</div>;

  const { data: comments } = await admin
    .from("post_comments")
    .select("id, content, status, post_id, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const list = comments ?? [];

  // Get author + post context
  const userIds = Array.from(new Set(list.map((c) => c.user_id)));
  const postIds = Array.from(new Set(list.map((c) => c.post_id)));
  const userMap: Record<string, string> = {};
  const postMap: Record<string, { title: string; slug: string }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    ((profiles as { id: string; display_name: string | null }[] | null) ?? []).forEach((p) => {
      userMap[p.id] = p.display_name ?? "—";
    });
  }
  if (postIds.length > 0) {
    const { data: posts } = await admin
      .from("user_posts")
      .select("id, title, slug")
      .in("id", postIds);
    ((posts as { id: string; title: string; slug: string }[] | null) ?? []).forEach((p) => {
      postMap[p.id] = { title: p.title, slug: p.slug };
    });
  }

  const counts = list.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comments</h1>
          <p className="text-sm text-zinc-500">
            {list.length} total · {counts.pending ?? 0} pending · {counts.approved ?? 0} approved · {counts.rejected ?? 0} rejected
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-4 py-2.5">Content</th>
              <th className="px-4 py-2.5">Author</th>
              <th className="px-4 py-2.5">Post</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Created</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  <MessageCircle className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                  لا توجد تعليقات بعد
                </td>
              </tr>
            )}
            {list.map((c) => {
              const status = c.status as keyof typeof STATUS_COLOR;
              const post = postMap[c.post_id];
              return (
                <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-2.5">
                    <p className="line-clamp-2 max-w-md text-zinc-800 dark:text-zinc-200">
                      {c.content}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {userMap[c.user_id] ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {post ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="line-clamp-1 max-w-xs text-violet-700 hover:underline dark:text-violet-400"
                      >
                        {post.title}
                      </Link>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status] ?? STATUS_COLOR.pending}`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{relativeTime(c.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {c.status !== "approved" && (
                        <form action={setCommentStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="status" value="approved" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                        </form>
                      )}
                      {c.status !== "rejected" && (
                        <form action={setCommentStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </button>
                        </form>
                      )}
                      {c.status !== "spam" && (
                        <form action={setCommentStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="status" value="spam" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            <Eye className="h-3 w-3" />
                            Spam
                          </button>
                        </form>
                      )}
                      <form action={deleteComment}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          onClick={(e) => {
                            if (!confirm("Delete this comment permanently?")) e.preventDefault();
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
