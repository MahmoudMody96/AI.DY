import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type UseCaseCardData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  tool_count?: number;
};

const ICON_EMOJI: Record<string, string> = {
  PenTool: "✍️",
  ImageIcon: "🎨",
  Bot: "🤖",
  Code: "💻",
  Headphones: "🎧",
  Search: "🔍",
  BookOpen: "📚",
  Phone: "📞",
  BarChart3: "📊",
  Globe: "🌐",
  Briefcase: "💼",
  Megaphone: "📣",
};

/**
 * UseCaseCard — clickable card used on the /use-cases index grid.
 * Shows the use case icon, title, a 2-line description, and a
 * tool count badge (when provided).
 */
export function UseCaseCard({
  useCase,
  className,
}: {
  useCase: UseCaseCardData;
  className?: string;
}) {
  const emoji = useCase.icon ? ICON_EMOJI[useCase.icon] ?? "✨" : "✨";

  return (
    <Link
      href={`/use-cases/${useCase.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      {/* Decorative gradient blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent blur-2xl transition group-hover:from-violet-500/20"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 text-2xl"
          aria-hidden
        >
          {emoji}
        </div>
        {typeof useCase.tool_count === "number" && useCase.tool_count > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            {useCase.tool_count} أداة
          </span>
        )}
      </div>

      <h3 className="relative mt-5 text-xl font-black text-card-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">
        {useCase.title}
      </h3>

      <p className="relative mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {useCase.description}
      </p>

      <div className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400">
        <span>اكتشف الأدوات</span>
        <ArrowRight className="h-4 w-4 rotate-180 transition group-hover:-translate-x-0.5" />
      </div>
    </Link>
  );
}
