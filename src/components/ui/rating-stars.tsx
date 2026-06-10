import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RatingStars — star + rating value + optional count.
 * `size` controls the icon size: sm (3), md (4, default), lg (5).
 */
export function RatingStars({
  rating,
  count,
  className,
  showCount = true,
  size = "md",
}: {
  rating: number | null | undefined;
  count?: number | null;
  className?: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const value = rating ?? 0;
  const sizeClass = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      <Star className={cn(sizeClass, "fill-amber-400 text-amber-400")} aria-hidden />
      <span className="font-bold tabular-nums text-foreground">
        {value.toFixed(1)}
      </span>
      {showCount && count != null && (
        <span className="text-xs text-muted-foreground">
          ({count.toLocaleString("ar-EG")})
        </span>
      )}
    </div>
  );
}
