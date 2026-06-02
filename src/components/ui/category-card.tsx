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

type Category = {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
};

export function CategoryCard({
  category,
  variant = "default",
  className,
}: {
  category: Category;
  variant?: "default" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <Link
        href={`/categories/${category.slug}`}
        className={cn(
          "group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900",
          className
        )}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: `${category.color ?? "#7c3aed"}1A` }}
        >
          {categoryEmoji(category.icon)}
        </div>
        <h3 className="text-center font-bold text-zinc-900 dark:text-zinc-50">{category.name}</h3>
      </Link>
    );
  }

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
        style={{ backgroundColor: `${category.color ?? "#7c3aed"}20` }}
      >
        {categoryEmoji(category.icon)}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{category.name}</h3>
        {category.description && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
}
