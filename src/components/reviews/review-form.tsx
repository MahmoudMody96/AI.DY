"use client";

// ============================================
// AI.DY — ReviewForm (Client Component)
// Renders on /tools/[slug]. Submitting posts to /api/reviews.
// ============================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RatingStarsInput } from "@/components/ui/rating-stars-input";

const MIN_BODY = 10;
const MAX_BODY = 2000;
const MAX_TITLE = 120;

type ApiError = { error?: string; issues?: Array<{ path: (string | number)[]; message: string }> };

export function ReviewForm({ toolId }: { toolId: string }) {
  const router = useRouter();
  const [rating, setRating] = React.useState<number>(0);
  const [title, setTitle] = React.useState<string>("");
  const [body, setBody] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);

  const bodyLen = body.trim().length;
  const bodyValid = bodyLen >= MIN_BODY && bodyLen <= MAX_BODY;
  const titleValid = title.length <= MAX_TITLE;
  const ratingValid = rating >= 1 && rating <= 5;
  const canSubmit = ratingValid && bodyValid && titleValid && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_id: toolId,
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ApiError;
        if (data.issues && data.issues.length > 0) {
          setError(data.issues.map((i) => i.message).join("، "));
        } else {
          setError(data.error ?? "تعذر إرسال التقييم، حاول مرة أخرى");
        }
        setSubmitting(false);
        return;
      }

      // Success — reset form and let the server-rendered list refresh.
      setSuccess(true);
      setRating(0);
      setTitle("");
      setBody("");
      setSubmitting(false);
      router.refresh();
    } catch (err) {
      console.error("[review] submit failed:", err);
      setError("حدث خطأ في الاتصال، حاول مرة أخرى");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30"
    >
      <h3 className="text-lg font-bold tracking-tight">اكتب تقييمك</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        شاركنا رأيك الصريح — تقييمك يساعد المستخدمين الآخرين.
      </p>

      {/* Rating */}
      <div className="mt-5 space-y-2">
        <Label htmlFor="review-rating">
          التقييم <span className="text-red-600">*</span>
        </Label>
        <div className="flex items-center gap-3">
          <RatingStarsInput
            value={rating}
            onChange={setRating}
            size="lg"
            required
            name="review-rating"
          />
          <span className="text-sm text-zinc-500">
            {rating === 0 ? "اختر من 1 إلى 5" : `${rating} من 5`}
          </span>
        </div>
      </div>

      {/* Title (optional) */}
      <div className="mt-5 space-y-2">
        <Label htmlFor="review-title">عنوان مختصر (اختياري)</Label>
        <Input
          id="review-title"
          name="title"
          type="text"
          maxLength={MAX_TITLE}
          placeholder="ملخص تجربتك في سطر واحد"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
        />
        <p className="text-xs text-zinc-500">
          {title.length} / {MAX_TITLE}
        </p>
      </div>

      {/* Body */}
      <div className="mt-5 space-y-2">
        <Label htmlFor="review-body">
          التقييم <span className="text-red-600">*</span>
        </Label>
        <textarea
          id="review-body"
          name="body"
          rows={5}
          required
          minLength={MIN_BODY}
          maxLength={MAX_BODY}
          placeholder="ما الذي أعجبك؟ ما الذي يمكن تحسينه؟ (10-2000 حرف)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={submitting}
          className="flex w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 transition placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-violet-900"
        />
        <p
          className={
            bodyLen > 0 && !bodyValid
              ? "text-xs text-red-600"
              : "text-xs text-zinc-500"
          }
        >
          {bodyLen} / {MAX_BODY} حرف {bodyValid ? "" : `(الحد الأدنى ${MIN_BODY})`}
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && !error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
          تم نشر تقييمك. شكراً لمشاركتك!
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "جاري النشر..." : "نشر التقييم"}
        </Button>
      </div>
    </form>
  );
}
