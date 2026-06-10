import { cn } from "@/lib/utils";

/**
 * LoadingSkeleton — flexible skeleton placeholder.
 *
 * Variants:
 *  - `card`   — mimics a ToolCard / CategoryCard (logo + title + 2 lines + footer)
 *  - `list`   — mimics a list row (avatar + 2 lines)
 *  - `text`   — single text line (default — uses `lines` for count)
 *  - `custom` — caller provides the children
 */
export function LoadingSkeleton({
  variant = "text",
  lines = 1,
  className,
  children,
}: {
  variant?: "card" | "list" | "text" | "custom";
  lines?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  if (variant === "custom") {
    return <div className={cn("animate-pulse", className)}>{children}</div>;
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-border bg-card p-5",
          className
        )}
        aria-busy="true"
      >
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-2 h-px w-full bg-muted" />
        <div className="flex justify-between">
          <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-card p-3",
          className
        )}
        aria-busy="true"
      >
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  // text (default)
  return (
    <div className={cn("space-y-2", className)} aria-busy="true">
      {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
        <div
          key={i}
          className="h-3 w-full animate-pulse rounded bg-muted"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
}
