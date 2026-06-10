import { SearchX } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * EmptyState — themed empty-state card.
 * Optional `icon`, `action`, and `children` slots for flexible composition.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center",
        className
      )}
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center text-muted-foreground">
        {icon ?? <SearchX className="h-10 w-10" />}
      </div>
      <p className="mt-4 text-lg font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
        >
          {action.label} ←
        </Link>
      )}
      {children}
    </div>
  );
}
