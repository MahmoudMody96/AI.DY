import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Container — max-w-6xl wrapper with standard horizontal padding.
 * The single source of truth for page section widths.
 *
 * Variants:
 *  - `default` (max-w-6xl) — primary content width (homepage, blogs, categories)
 *  - `wide`    (max-w-7xl) — wider views (tools index with sidebar)
 *  - `narrow`  (max-w-4xl) — focused reading (article bodies, forms)
 */
const sizeMap = {
  default: "max-w-6xl",
  wide: "max-w-7xl",
  narrow: "max-w-4xl",
} as const;

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeMap;
  /** When true, removes the horizontal padding (use with sections that need edge-to-edge layout). */
  flush?: boolean;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "default", flush = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full",
        sizeMap[size],
        !flush && "px-6",
        className
      )}
      {...props}
    />
  )
);
Container.displayName = "Container";
