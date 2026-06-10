import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, X, AlertCircle, Eye, Archive, Flag, HelpCircle, KeyRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * StatusBadge — status pill used in admin tables (tools, posts, reviews, comments).
 *
 * `tone` decides the color (semantic):
 *   - success  (green)  — published / active / approved
 *   - warning  (amber)  — draft / pending / flagged
 *   - danger   (rose)   — rejected / deleted / error
 *   - info     (blue)
 *   - muted    (slate)  — inactive / archived / unknown
 *
 * When `value` is one of the well-known statuses (published/draft/pending/...),
 * the leading icon is auto-picked. For custom labels (e.g. "Featured"), pass
 * `value=""` (empty) and `withIcon={false}` to skip the icon entirely.
 */
export type StatusTone = "success" | "warning" | "danger" | "muted" | "info";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  muted: "bg-muted text-muted-foreground",
};

const ICON_MAP: Record<string, LucideIcon> = {
  published: CheckCircle2,
  approved: CheckCircle2,
  active: CheckCircle2,
  draft: Eye,
  pending: Clock,
  flagged: Flag,
  archived: Archive,
  rejected: X,
  revoked: X,
  inactive: X,
  spam: AlertCircle,
};

function pickToneAuto(value: string): StatusTone {
  if (["published", "approved", "active"].includes(value)) return "success";
  if (["draft", "pending", "flagged"].includes(value)) return "warning";
  if (["rejected", "deleted", "revoked", "spam"].includes(value)) return "danger";
  return "muted";
}

export interface StatusBadgeProps {
  /** The status value (e.g. "published", "draft"). Pass "" to skip the auto-icon. */
  value: string;
  /** Visual tone. Pass "auto" to derive from `value`. */
  tone?: StatusTone | "auto";
  /** Show the leading icon. Defaults to true. Skipped automatically when `value` is empty. */
  withIcon?: boolean;
  className?: string;
  /** Label override. If omitted, the raw `value` is shown. */
  label?: string;
}

export function StatusBadge({
  value,
  tone = "auto",
  withIcon = true,
  className,
  label,
}: StatusBadgeProps) {
  const resolvedTone: StatusTone = tone === "auto" ? pickToneAuto(value) : tone;
  const showIcon = withIcon && !!value && value in ICON_MAP;
  const Icon: LucideIcon | null = showIcon ? ICON_MAP[value] : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[resolvedTone],
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label ?? value}
    </span>
  );
}
