// ============================================
// AI.DY — RateLimitNotice
// ============================================
// A small inline notice displayed inside a demo widget when the
// server returns 429. Keeps the same look across the 5 widget kinds
// so the user knows exactly what hit them.

import * as React from "react";
import { AlertCircle, Timer } from "lucide-react";

export interface RateLimitNoticeProps {
  /** Seconds until the next request is allowed (optional). */
  retryAfter?: number | null;
  className?: string;
}

export function RateLimitNotice({ retryAfter, className }: RateLimitNoticeProps) {
  return (
    <div
      role="status"
      className={
        "flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300 " +
        (className ?? "")
      }
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">وصلت للحد الأقصى من الطلبات</p>
        <p className="mt-0.5 text-xs">
          {retryAfter
            ? `حاول مرة ثانية بعد ${retryAfter} ثانية.`
            : "حاول مرة ثانية بعد دقيقة."}
        </p>
      </div>
      {retryAfter ? (
        <span className="inline-flex items-center gap-1 text-xs font-mono">
          <Timer className="h-3 w-3" />
          {retryAfter}s
        </span>
      ) : null}
    </div>
  );
}
