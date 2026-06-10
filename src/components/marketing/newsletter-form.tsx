// ============================================
// AI.DY — Newsletter Form (client component)
// ============================================
// Drop into footer or any marketing section. Handles:
//   - Email validation
//   - POST /api/newsletter/subscribe
//   - Success / error / already-subscribed states
//   - Optional `source` prop for analytics tagging
// ============================================

"use client";

import { useState } from "react";
import { Mail, Check, AlertCircle, Loader2 } from "lucide-react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function NewsletterForm({
  source = "footer",
  className,
}: {
  source?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (res.ok && json.ok) {
        setStatus({
          kind: "success",
          message: json.message ?? "تم الاشتراك بنجاح",
        });
        setEmail("");
      } else {
        setStatus({
          kind: "error",
          message: json.error ?? json.message ?? "حصل خطأ، حاول مرة تانية",
        });
      }
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "تعذّر إرسال الطلب، حاول تاني",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={className}
      data-newsletter-form
      data-source={source}
      noValidate
    >
      <label
        htmlFor="newsletter-email"
        className="mb-2 block text-sm font-semibold text-foreground"
      >
        <Mail className="ms-1 inline h-4 w-4" />
        اشترك في النشرة الأسبوعية
      </label>
      <p className="mb-3 text-xs text-muted-foreground">
        أحدث أدوات AI ومقارنات أسبوعية — مرة واحدة، يوم الخميس.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status.kind === "error" || status.kind === "success") {
              setStatus({ kind: "idle" });
            }
          }}
          placeholder="your@email.com"
          autoComplete="email"
          disabled={status.kind === "submitting"}
          className="h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
          dir="ltr"
        />
        <button
          type="submit"
          disabled={status.kind === "submitting" || email.trim().length === 0}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status.kind === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الإرسال…
            </>
          ) : (
            "اشترك"
          )}
        </button>
      </div>

      {status.kind === "success" && (
        <p
          className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"
          role="status"
        >
          <Check className="h-4 w-4" />
          {status.message}
        </p>
      )}
      {status.kind === "error" && (
        <p
          className="mt-3 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          {status.message}
        </p>
      )}
    </form>
  );
}
