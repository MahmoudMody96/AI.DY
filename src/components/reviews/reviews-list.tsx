// ============================================
// AI.DY — ReviewsList (Server Component)
// Renders up to 10 most recent published reviews for a tool.
// ============================================

import { Star } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import { createClient } from "@/lib/supabase/server";

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
  user:
    | { id: string; display_name: string | null; avatar_url: string | null }
    | { id: string; display_name: string | null; avatar_url: string | null }[]
    | null;
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function userOf(
  user: ReviewRow["user"]
): { id: string; display_name: string | null; avatar_url: string | null } | null {
  if (!user) return null;
  if (Array.isArray(user)) return user[0] ?? null;
  return user;
}

export async function ReviewsList({ toolId }: { toolId: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `id, rating, title, body, created_at,
      user:profiles(id, display_name, avatar_url)`
    )
    .eq("tool_id", toolId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    // Soft-fail — don't break the tool page if reviews can't load.
    if (process.env.NODE_ENV !== "production") {
      console.error("[reviews] fetch failed:", error.message);
    }
    return null;
  }

  const reviews = (data as unknown as ReviewRow[] | null) ?? [];

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          لا توجد تقييمات بعد. كن أول من يشارك تجربته!
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => {
        const u = userOf(r.user);
        const displayName = u?.display_name ?? "مستخدم";
        const initials = displayName
          .split(" ")
          .map((p) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <li
            key={r.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start gap-3">
              {/* Avatar (initials or image) */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
                {u?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.avatar_url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials || "؟"}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{displayName}</span>
                  <RatingStars rating={r.rating} showCount={false} className="text-xs" />
                  <span className="text-xs text-zinc-500">{timeAgo(r.created_at)}</span>
                </div>
                {r.title && (
                  <h4 className="mt-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {r.title}
                  </h4>
                )}
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                  {r.body}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
