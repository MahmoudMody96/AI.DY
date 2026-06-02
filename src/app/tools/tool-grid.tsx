import Link from "next/link";

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

function pricingLabel(type: string | null, monthly: number | null): string {
  if (type === "free") return "مجاني";
  if (type === "freemium") return "مجاني + مدفوع";
  if (type === "paid" && monthly != null) return `${monthly}$/شهر`;
  if (type === "paid") return "مدفوع";
  return "—";
}

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

export function ToolGrid({ tools }: { tools: Tool[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <Link
          key={tool.id}
          href={`/tools/${tool.slug}`}
          className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4 flex items-start justify-between">
            <div
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-xl font-bold text-white"
              style={{ backgroundColor: tool.category?.color ?? "#7c3aed" }}
            >
              {tool.category?.icon && CATEGORY_ICONS[tool.category.icon]
                ? CATEGORY_ICONS[tool.category.icon]
                : getInitials(tool.name)}
            </div>
            {tool.rating_avg != null && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                ⭐ {tool.rating_avg.toFixed(1)}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {tool.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {tool.tagline}
          </p>
          <div className="mt-auto flex items-center justify-between pt-5 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">
              {tool.category?.name ?? "—"}
            </span>
            <span className="font-semibold text-violet-600 dark:text-violet-400">
              {pricingLabel(tool.pricing_type, tool.monthly_price)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
