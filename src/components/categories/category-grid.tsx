import { CategoryCard, type CategoryCardData } from "./category-card";
import { cn } from "@/lib/utils";

/**
 * CategoryGrid — responsive grid wrapper for CategoryCard lists.
 * The 1/2/3-col variant covers the /categories list and similar list pages.
 * The 2/3/4-col variant covers the homepage featured categories.
 */
export function CategoryGrid({
  categories,
  variant = "default",
  className,
}: {
  categories: CategoryCardData[];
  variant?: "default" | "featured";
  className?: string;
}) {
  if (variant === "featured") {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
          className
        )}
      >
        {categories.map((cat) => (
          <CategoryCard key={cat.slug} category={cat} variant="featured" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {categories.map((cat) => (
        <CategoryCard key={cat.slug} category={cat} />
      ))}
    </div>
  );
}
