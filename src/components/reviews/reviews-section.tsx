// ============================================
// AI.DY — ReviewsSection (Server Component)
// Reads auth state, then either shows the form (logged in) or
// a CTA to /login (logged out), plus the reviews list below.
// ============================================

import Link from "next/link";
import { Star } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { createClient } from "@/lib/supabase/server";

export async function ReviewsSection({
  toolId,
  ratingAvg,
  ratingCount,
}: {
  toolId: string;
  ratingAvg: number | null;
  ratingCount: number | null;
}) {
  const supabase = await createClient();
  let user: { id: string } | null = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // If logged in, also check if the user already reviewed this tool —
  // if so, the form would 409, so we just show their review info instead.
  let existingReview: { id: string; rating: number; title: string | null; body: string; created_at: string } | null =
    null;
  if (user && supabase) {
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, title, body, created_at")
      .eq("tool_id", toolId)
      .eq("user_id", user.id)
      .eq("status", "published")
      .maybeSingle();
    existingReview = data;
  }

  return (
    <section className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header: average rating + count */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">التقييمات والمراجعات</h2>
            <div className="mt-2 flex items-center gap-3 text-sm">
              {ratingAvg != null && ratingAvg > 0 ? (
                <>
                  <RatingStars rating={ratingAvg} showCount={false} />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {ratingAvg.toFixed(1)} من 5
                  </span>
                  <span className="text-zinc-400">·</span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {ratingCount ?? 0} تقييم
                  </span>
                </>
              ) : (
                <span className="text-zinc-600 dark:text-zinc-400">
                  لا توجد تقييمات بعد
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form (logged in, not yet reviewed) or CTA (logged out) or
            "your review" (already reviewed) */}
        <div className="mb-10">
          {user ? (
            existingReview ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
                <div className="flex items-start gap-3">
                  <Star className="mt-0.5 h-5 w-5 fill-amber-500 text-amber-500" />
                  <div className="flex-1">
                    <h3 className="text-base font-bold">تقييمك موجود بالفعل</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      لقد قمت بتقييم هذه الأداة. يمكنك تعديل تقييمك من حسابك.
                    </p>
                    <div className="mt-3">
                      <RatingStars
                        rating={existingReview.rating}
                        showCount={false}
                        className="text-sm"
                      />
                      {existingReview.title && (
                        <p className="mt-1 text-sm font-semibold">{existingReview.title}</p>
                      )}
                      <p className="mt-1 line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">
                        {existingReview.body}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ReviewForm toolId={toolId} />
            )
          ) : (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-6 dark:border-violet-900 dark:bg-violet-950/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold">شاركنا رأيك</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    سجّل دخولك لترك تقييم يساعد المستخدمين الآخرين.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild>
                    <Link href="/login">تسجيل الدخول</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/signup">إنشاء حساب</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List of recent reviews */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
            أحدث التقييمات
          </h3>
          <ReviewsList toolId={toolId} />
        </div>
      </div>
    </section>
  );
}
