import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { moderateReview } from "./actions";

function timeAgo(iso: string | null | undefined): string {
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

export default async function AdminReviewsPage() {
  const admin = await createClient();
  if (!admin) return <div className="text-muted-foreground">Admin client unavailable</div>;

  // New schema: reviews are direct-publish (no moderation queue).
  // We still surface a flag for hidden/flagged reviews if any exist.
  const { data: flagged } = await admin
    .from("reviews")
    .select("id, rating, title, body, status, created_at, tool:tools(name, slug), user:profiles(display_name, email)")
    .neq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: recent } = await admin
    .from("reviews")
    .select("id, rating, title, status, created_at, tool:tools(name, slug)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          {(flagged ?? []).length} flagged/hidden · {recent?.length ?? 0} recent published
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Flagged / Hidden
        </h2>
        <div className="space-y-3">
          {(flagged ?? []).length === 0 && (
            <div className="rounded-lg border border-dashed border-input bg-background p-8 text-center border-input bg-card">
              <p className="text-sm text-muted-foreground">No flagged reviews. 🎉</p>
            </div>
          )}
          {(flagged ?? []).map((r) => {
            const tool = Array.isArray(r.tool) ? r.tool[0] : r.tool;
            const user = Array.isArray(r.user) ? r.user[0] : r.user;
            return (
              <div
                key={r.id}
                className="rounded-lg border border-input bg-background p-4 border-input bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {user?.display_name ?? user?.email ?? "Anonymous"}
                      </span>
                      <span className="text-muted-foreground">on</span>
                      {tool ? (
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="text-violet-700 hover:underline dark:text-violet-400"
                        >
                          {tool.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">[deleted tool]</span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={
                            n <= r.rating
                              ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
                              : "h-3.5 w-3.5 text-muted-foreground/60"
                          }
                        />
                      ))}
                    </div>
                    {r.title && (
                      <p className="mt-2 text-sm font-semibold">{r.title}</p>
                    )}
                    <p className="mt-1 whitespace-pre-line text-sm text-foreground dark:text-muted-foreground/60">
                      {r.body}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-input pt-3 border-input">
                  <form action={moderateReview} className="flex gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      name="action"
                      value="publish"
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Publish
                    </button>
                    <button
                      type="submit"
                      name="action"
                      value="delete"
                      className="rounded-md border border-red-200 bg-background px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 bg-card dark:hover:bg-red-950/30"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Published
        </h2>
        <div className="overflow-hidden rounded-lg border border-input bg-background border-input bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-input bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground border-input bg-muted/50">
              <tr>
                <th className="px-4 py-2">Tool</th>
                <th className="px-4 py-2">Rating</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border divide-border">
              {(recent ?? []).map((r) => {
                const tool = Array.isArray(r.tool) ? r.tool[0] : r.tool;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2">{tool?.name ?? "—"}</td>
                    <td className="px-4 py-2">{r.rating}★</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{timeAgo(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
