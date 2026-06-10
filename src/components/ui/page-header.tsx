import { cn } from "@/lib/utils";

/**
 * PageHeader — title + optional subtitle + optional action slot, used in
 * standalone page sections and the admin top area.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
  className,
}: {
  title: string;
  subtitle?: string | React.ReactNode;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && (
          <p className="eyebrow mb-2">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
