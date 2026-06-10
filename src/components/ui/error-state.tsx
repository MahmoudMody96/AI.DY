"use client";

import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ErrorState — error placeholder with icon, message, and optional retry button.
 * Use this for failed data loads, 5xx states, etc.
 */
export function ErrorState({
  title = "حدث خطأ",
  message = "لم نتمكن من تحميل البيانات. حاول مرة أخرى.",
  onRetry,
  retryLabel = "إعادة المحاولة",
  icon,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center",
        className
      )}
      role="alert"
    >
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center text-destructive">
        {icon ?? <AlertOctagon className="h-10 w-10" />}
      </div>
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
