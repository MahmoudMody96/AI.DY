import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, X, Trash2, MessageCircle, Eye } from "lucide-react";
import { setCommentStatus, deleteComment } from "./actions";
import { ConfirmFormSubmit } from "../_components/confirm-form-submit";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

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

export default async function AdminCommentsPage() {
  const admin = await createClient();
  if (!admin) return <div className="text-muted-foreground">Admin client unavailable</div>;

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

  const TONE_BY_STATUS: Record<string, "success" | "warning" | "danger" | "muted"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    spam: "muted",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comments</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} total · {counts.pending ?? 0} pending · {counts.approved ?? 0} approved · {counts.rejected ?? 0} rejected
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Content</th>
              <th className="px-4 py-2.5">Author</th>
              <th className="px-4 py-2.5">Post</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Created</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                  لا توجد تعليقات بعد
                </td>
              </tr>
            )}
            {list.map((c) => {
              const status = c.status as keyof typeof TONE_BY_STATUS;
              const post = postMap[c.post_id];
              return (
                <tr key={c.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <p className="line-clamp-2 max-w-md text-foreground/90">
                      {c.content}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {userMap[c.user_id] ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {post ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="line-clamp-1 max-w-xs text-primary hover:underline"
                      >
                        {post.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge value={status} tone={TONE_BY_STATUS[status] ?? "warning"} />
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{relativeTime(c.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {c.status !== "approved" && (
                        <form action={setCommentStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="status" value="approved" />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </Button>
                        </form>
                      )}
                      {c.status !== "rejected" && (
                        <form action={setCommentStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </Button>
                        </form>
                      )}
                      {c.status !== "spam" && (
                        <form action={setCommentStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="status" value="spam" />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="border-border bg-muted text-foreground hover:bg-muted/80"
                          >
                            <Eye className="h-3 w-3" />
                            Spam
                          </Button>
                        </form>
                      )}
                      <ConfirmFormSubmit
                        formAction={deleteComment}
                        id={c.id}
                        message="Delete this comment permanently?"
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border border-rose-200 bg-background px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50",
                          "dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        )}
                      >
                        <Trash2 className="h-3 w-3" />
                      </ConfirmFormSubmit>
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
