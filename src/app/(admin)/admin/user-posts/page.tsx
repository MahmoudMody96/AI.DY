import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Flag, Archive, X, Eye, Heart, MessageCircle, Trash2 } from "lucide-react";
import { setUserPostStatus, deleteUserPost } from "./actions";
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

export default async function AdminUserPostsPage() {
  const admin = await createClient();
  if (!admin) return <div className="text-muted-foreground">Admin client unavailable</div>;

  const { data: posts } = await admin
    .from("user_posts")
    .select("id, title, slug, status, likes_count, comments_count, published_at, updated_at, author_id")
    .order("updated_at", { ascending: false })
    .limit(200);
  const list = posts ?? [];

  // Get author names
  const authorIds = Array.from(new Set(list.map((p) => p.author_id)));
  const authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);
    ((profiles as { id: string; display_name: string | null }[] | null) ?? []).forEach((p) => {
      authorMap[p.id] = p.display_name ?? "—";
    });
  }

  const counts = list.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Posts</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} total · {counts.published ?? 0} published · {counts.flagged ?? 0} flagged · {counts.draft ?? 0} drafts
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Author</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Stats</th>
              <th className="px-4 py-2.5">Updated</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  لا توجد مشاركات بعد — الأعضاء يقدروا ينشروا من /blog
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-muted/50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="font-medium text-primary hover:underline"
                  >
                    {p.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">/blog/{p.slug}</div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {authorMap[p.author_id] ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge value={p.status} />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {p.likes_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {p.comments_count}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{relativeTime(p.updated_at)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    {p.status !== "published" && (
                      <form action={setUserPostStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value="published" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Publish
                        </Button>
                      </form>
                    )}
                    {p.status !== "flagged" && p.status !== "rejected" && (
                      <form action={setUserPostStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value="flagged" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                        >
                          <Flag className="h-3 w-3" />
                          Flag
                        </Button>
                      </form>
                    )}
                    {p.status === "flagged" && (
                      <form action={setUserPostStatus}>
                        <input type="hidden" name="id" value={p.id} />
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
                    {p.status !== "archived" && (
                      <form action={setUserPostStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value="archived" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="border-border bg-muted text-foreground hover:bg-muted/80"
                        >
                          <Archive className="h-3 w-3" />
                          Archive
                        </Button>
                      </form>
                    )}
                    <ConfirmFormSubmit
                      formAction={deleteUserPost}
                      id={p.id}
                      message="Delete this post permanently?"
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
