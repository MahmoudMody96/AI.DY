import { cn } from "@/lib/utils";

/**
 * PricingLabel — shows a tool's monthly_price (or starting_price) with currency.
 * Distinct from PricingBadge (which is a status pill: free / freemium / paid).
 *
 * Variants:
 *  - `monthly`  (default) — shows `$${monthly}/شهر` if monthly_price is set
 *  - `starting`            — shows `يبدأ من $${starting_price}` if set
 *  - `auto`                 — picks monthly if present, else starting
 */
export function PricingLabel({
  monthly,
  starting,
  variant = "auto",
  className,
}: {
  monthly?: number | null;
  starting?: number | null;
  variant?: "monthly" | "starting" | "auto";
  className?: string;
}) {
  let text: string | null = null;

  if (variant === "monthly") {
    if (monthly != null && monthly > 0) text = `$${monthly}/شهر`;
  } else if (variant === "starting") {
    if (starting != null && starting > 0) text = `يبدأ من $${starting}`;
  } else {
    // auto: prefer monthly, fall back to starting
    if (monthly != null && monthly > 0) text = `$${monthly}/شهر`;
    else if (starting != null && starting > 0) text = `يبدأ من $${starting}`;
  }

  if (!text) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>—</span>
    );
  }

  return (
    <span className={cn("text-sm font-semibold text-foreground", className)}>
      {text}
    </span>
  );
}
