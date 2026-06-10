import { UseCaseCard, type UseCaseCardData } from "./use-case-card";
import { cn } from "@/lib/utils";

/**
 * UseCaseGrid — responsive 1/2/3-column grid wrapper for the
 * /use-cases index. Mirrors the ToolGrid layout so the visual rhythm
 * stays consistent across the app.
 */
export function UseCaseGrid({
  useCases,
  className,
  emptyMessage,
}: {
  useCases: UseCaseCardData[];
  className?: string;
  emptyMessage?: string;
}) {
  if (useCases.length === 0 && emptyMessage) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
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
      {useCases.map((uc) => (
        <UseCaseCard key={uc.id} useCase={uc} />
      ))}
    </div>
  );
}
