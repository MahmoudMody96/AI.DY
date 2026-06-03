import Link from "next/link";
import { Star } from "lucide-react";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";
import { cn } from "@/lib/utils";

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

function priceLabel(t: Tool): string {
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

export function ToolCard({ tool, className }: { tool: Tool; className?: string }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <ToolLogoServer slug={tool.slug} name={tool.name} size={48} rounded="xl" />
        {tool.rating_avg != null && (
          <div className="flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-800">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{tool.rating_avg.toFixed(1)}</span>
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{tool.name}</h3>
      {tool.tagline && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {tool.tagline}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-xs dark:border-zinc-800">
        <span className="text-zinc-500 dark:text-zinc-400">{tool.category?.name ?? "—"}</span>
        <span
          className={cn(
            "font-semibold",
            tool.pricing_type === "free"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-zinc-700 dark:text-zinc-300"
          )}
        >
          {priceLabel(tool)}
        </span>
      </div>
    </Link>
  );
}
