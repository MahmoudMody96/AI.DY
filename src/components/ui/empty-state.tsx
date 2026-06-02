import { SearchX } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700",
        className
      )}
    >
      <SearchX className="mx-auto h-10 w-10 text-zinc-400" />
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {description && <p className="mt-2 text-sm text-zinc-500">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-block text-sm font-semibold text-violet-600 hover:text-violet-700"
        >
          {action.label} ←
        </Link>
      )}
    </div>
  );
}
