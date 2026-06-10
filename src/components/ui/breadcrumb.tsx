import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumb — RTL-aware page navigation trail.
 * Used at the top of /tools, /tools/[slug], /categories, /categories/[slug].
 */
export function Breadcrumb({
  items,
  separator = "/",
  className,
}: {
  items: Crumb[];
  separator?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground", className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-x-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "font-medium text-foreground")}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronLeft
                aria-hidden
                className="h-3.5 w-3.5 rtl:rotate-180 text-muted-foreground/60"
              />
            )}
            {!isLast && separator !== "/" && (
              <span className="text-muted-foreground/60">{separator}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
