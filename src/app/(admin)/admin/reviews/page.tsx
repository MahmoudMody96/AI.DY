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
  if (!admin) return <div className="text-zinc-500">Admin client unavailable</div>;

  const { data: pending } = await admin
    .from("reviews")
    .select("id, rating, title, content, pros, cons, created_at, tool:tools(name, slug), user:profiles(display_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: recent } = await admin
    .from("reviews")
    .select("id, rating, title, status, created_at, tool:tools(name, slug)")
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-zinc-500">
          {(pending ?? []).length} pending · {recent?.length ?? 0} recent
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Pending Moderation
        </h2>
        <div className="space-y-3">
          {(pending ?? []).length === 0 && (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">No pending reviews. 🎉</p>
            </div>
          )}
          {(pending ?? []).map((r) => {
            const tool = Array.isArray(r.tool) ? r.tool[0] : r.tool;
            const user = Array.isArray(r.user) ? r.user[0] : r.user;
            return (
              <div
                key={r.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {user?.display_name ?? user?.email ?? "Anonymous"}
                      </span>
                      <span className="text-zinc-400">on</span>
                      {tool ? (
                        <Link
                          href={`/admin/tools/${tool.slug ? `/admin/tools` : ""}`}
                          className="text-violet-700 hover:underline dark:text-violet-400"
                        >
                          {tool.name}
                        </Link>
                      ) : (
                        <span className="text-zinc-400">[deleted tool]</span>
                      )}
                      <span className="ml-auto text-xs text-zinc-400">{timeAgo(r.created_at)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={
                            n <= r.rating
                              ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
                              : "h-3.5 w-3.5 text-zinc-300"
                          }
                        />
                      ))}
                    </div>
                    {r.title && (
                      <p className="mt-2 text-sm font-semibold">{r.title}</p>
                    )}
                    <p className="mt-1 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                      {r.content}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <form action={moderateReview} className="flex gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      name="action"
                      value="approve"
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="submit"
                      name="action"
                      value="reject"
                      className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    >
                      Reject
                    </button>
                    <button
                      type="submit"
                      name="action"
                      value="delete"
                      className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:hover:bg-red-950/30"
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
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Recent Decisions
        </h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-2">Tool</th>
                <th className="px-4 py-2">Rating</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(recent ?? []).map((r) => {
                const tool = Array.isArray(r.tool) ? r.tool[0] : r.tool;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2">{tool?.name ?? "—"}</td>
                    <td className="px-4 py-2">{r.rating}★</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          r.status === "approved"
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-500">{timeAgo(r.created_at)}</td>
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
