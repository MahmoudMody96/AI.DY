import Link from "next/link";
import { Star } from "lucide-react";
import { ToolLogoServer } from "@/components/brand/tool-logo-server";

type Tool = {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  tagline: string | null;
  website_url: string | null;
  pricing_type: string | null;
  monthly_price: number | null;
  rating_avg: number | null;
  category: { id: string; name: string; slug: string; icon: string | null; color: string | null } | null;
};

function pricingLabel(type: string | null, monthly: number | null): string {
  if (type === "free") return "مجاني";
  if (type === "freemium") return "مجاني + مدفوع";
  if (type === "paid" && monthly != null) return `${monthly}$/شهر`;
  if (type === "paid") return "مدفوع";
  return "—";
}

export function ToolGrid({ tools }: { tools: Tool[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <Link
          key={tool.id}
          href={`/tools/${tool.slug}`}
          className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div className="mb-4 flex items-start justify-between">
            <ToolLogoServer slug={tool.slug} name={tool.name} size={48} rounded="xl" />
            {tool.rating_avg != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-800">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {tool.rating_avg.toFixed(1)}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {tool.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {tool.tagline}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-xs dark:border-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-400">
              {tool.category?.name ?? "—"}
            </span>
            <span
              className={
                tool.pricing_type === "free"
                  ? "font-semibold text-emerald-600 dark:text-emerald-400"
                  : "font-semibold text-zinc-700 dark:text-zinc-300"
              }
            >
              {pricingLabel(tool.pricing_type, tool.monthly_price)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
