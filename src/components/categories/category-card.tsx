import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, string> = {
  Bot: "🤖",
  PenTool: "✍️",
  ImageIcon: "🎨",
  Code: "💻",
  Video: "🎬",
  Music: "🎵",
  Workflow: "⚙️",
  Search: "🔍",
};

function categoryEmoji(icon: string | null | undefined): string {
  if (!icon) return "✨";
  return CATEGORY_ICONS[icon] ?? "✨";
}

export type CategoryCardData = {
  slug: string;
  name: string;
  name_en?: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
};

/**
 * CategoryCard — the canonical category card.
 *
 * Variants:
 *  - `featured` — homepage / index header cards (2x2 grid, hover translate, gradient overlay)
 *  - `default`  — /categories list cards (horizontal, big icon left, copy right)
 *  - `compact`  — inline chip cards (icon + name, used in sidebars / related lists)
 */
export function CategoryCard({
  category,
  variant = "default",
  className,
}: {
  category: CategoryCardData;
  variant?: "featured" | "default" | "compact";
  className?: string;
}) {
  const href = `/categories/${category.slug}`;
  const tint = category.color ?? "#7c3aed";

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex flex-col items-center gap-2 rounded-md border border-border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:shadow-warm-sm",
          className
        )}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md text-xl"
          style={{ backgroundColor: `${tint}1A` }}
        >
          {categoryEmoji(category.icon)}
        </div>
        <span className="text-xs font-semibold text-card-foreground">
          {category.name}
        </span>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        href={href}
        className={cn(
          "group relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-warm-md",
          className
        )}
      >
        <div
          className="absolute inset-0 -z-10 opacity-0 transition group-hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, ${tint}10, ${tint}05)`,
          }}
        />
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-md text-2xl"
          style={{ backgroundColor: `${tint}15` }}
        >
          {categoryEmoji(category.icon)}
        </div>
        <h3 className="text-base font-bold text-card-foreground">{category.name}</h3>
        {category.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {category.description}
          </p>
        )}
      </Link>
    );
  }

  // default — horizontal, big icon left
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-4 rounded-lg border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-warm-md",
        className
      )}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-3xl"
        style={{ backgroundColor: `${tint}20` }}
      >
        {categoryEmoji(category.icon)}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-card-foreground">{category.name}</h3>
        {category.name_en && (
          <p className="text-xs text-muted-foreground">{category.name_en}</p>
        )}
        {category.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
}
