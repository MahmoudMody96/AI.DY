import Link from "next/link";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn } from "@/lib/utils";

export type ToolCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  rating_avg: number | null;
  rating_count?: number | null;
  pricing_type: string | null;
  monthly_price: number | null;
  category: { name: string; icon: string | null; color: string | null } | null;
};

/**
 * ToolCard — the canonical tool card used in:
 *  - Homepage featured row
 *  - /tools index grid
 *  - /tools/[slug] related-tools
 *  - /categories/[slug] tools list
 */
export function ToolCard({ tool, className }: { tool: ToolCardData; className?: string }) {
  const isFree = tool.pricing_type === "free";

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex flex-col rounded-lg border border-border bg-card p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-warm-md",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <ToolLogoServer
          slug={tool.slug}
          name={tool.name}
          size={48}
          rounded="xl"
        />
        {tool.rating_avg != null && (
          <RatingStars
            rating={tool.rating_avg}
            count={tool.rating_count ?? 0}
            className="rounded-full bg-muted px-2 py-0.5 text-xs"
          />
        )}
      </div>

      <h3 className="text-lg font-bold text-card-foreground">{tool.name}</h3>

      {tool.tagline && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {tool.tagline}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs">
        <span className="text-muted-foreground">
          {tool.category?.name ?? "—"}
        </span>
        <span
          className={cn(
            "font-semibold",
            isFree ? "text-success" : "text-foreground"
          )}
        >
          {priceLabel(tool)}
        </span>
      </div>
    </Link>
  );
}

function priceLabel(t: ToolCardData): string {
  switch (t.pricing_type) {
    case "free":
      return "مجاني";
    case "freemium":
      return "مجاني + مدفوع";
    case "paid":
      if (t.monthly_price && t.monthly_price > 0) return `$${t.monthly_price}/شهر`;
      return "مدفوع";
    case "contact":
      return "تواصل للسعر";
    default:
      return "—";
  }
}
