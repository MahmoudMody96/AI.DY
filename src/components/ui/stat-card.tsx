import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StatCard — single-stat tile used in the admin dashboard and similar.
 * When `href` is provided the card becomes a clickable link.
 */
export function StatCard({
  label,
  value,
  href,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  href?: string;
  hint?: string;
  className?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {href && (
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "group rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20",
          className
        )}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      {inner}
    </div>
  );
}
