import { ToolCard, type ToolCardData } from "./tool-card";
import { cn } from "@/lib/utils";

/**
 * ToolGrid — responsive grid wrapper for ToolCard lists.
 * Used on /tools, /categories/[slug], /tools/[slug] (related), and the homepage.
 */
export function ToolGrid({
  tools,
  className,
  emptyMessage,
}: {
  tools: ToolCardData[];
  className?: string;
  emptyMessage?: string;
}) {
  if (tools.length === 0 && emptyMessage) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/40 p-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
