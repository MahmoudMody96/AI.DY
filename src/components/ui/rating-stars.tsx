import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  count,
  className,
  showCount = true,
}: {
  rating: number | null | undefined;
  count?: number | null;
  className?: string;
  showCount?: boolean;
}) {
  const value = rating ?? 0;
  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-bold tabular-nums">{value.toFixed(1)}</span>
      {showCount && count != null && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">({count.toLocaleString("ar-EG")})</span>
      )}
    </div>
  );
}
