import Link from "next/link";
import { RatingStars } from "@/components/ui/rating-stars";
import { PricingBadge } from "@/components/ui/pricing-badge";
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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Tool = {
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

export function ToolCard({ tool, className }: { tool: Tool; className?: string }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-xl font-bold text-white"
          style={{ backgroundColor: tool.category?.color ?? "#7c3aed" }}
        >
          {/* Icon or fallback to first-letter avatar */}
          {tool.category?.icon && CATEGORY_ICONS[tool.category.icon] ? (
            <span aria-hidden>{CATEGORY_ICONS[tool.category.icon]}</span>
          ) : (
            <span aria-hidden>{getInitials(tool.name)}</span>
          )}
        </div>
        {tool.rating_avg != null && (
          <RatingStars rating={tool.rating_avg} count={tool.rating_count} showCount={false} />
        )}
      </div>
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{tool.name}</h3>
      {tool.tagline && (
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{tool.tagline}</p>
      )}
      <div className="mt-auto flex items-center justify-between pt-5 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">{tool.category?.name ?? "—"}</span>
        <PricingBadge type={tool.pricing_type} monthly={tool.monthly_price} />
      </div>
    </Link>
  );
}
