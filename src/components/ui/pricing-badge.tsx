import { Badge } from "@/components/ui/badge";

/**
 * PricingBadge — status pill for a tool's pricing model.
 * Distinct from `PricingLabel` (which shows the actual price text).
 */
export function PricingBadge({
  type,
  monthly,
}: {
  type: string | null;
  monthly: number | null;
}) {
  const label = (() => {
    if (type === "free") return "مجاني";
    if (type === "freemium") return "مجاني + مدفوع";
    if (type === "paid" && monthly != null) return `${monthly}$/شهر`;
    if (type === "paid") return "مدفوع";
    return "—";
  })();

  const variant = (() => {
    if (type === "free") return "success" as const;
    if (type === "freemium") return "info" as const;
    if (type === "paid") return "warning" as const;
    return "secondary" as const;
  })();

  return <Badge variant={variant}>{label}</Badge>;
}
