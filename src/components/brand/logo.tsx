// ============================================
// AI.DY — Brand Logo
// The "A" mark: two converging strokes with a
// glowing dot that represents the AI's intelligence core.
// Works at any size, in dark/light mode, and on
// any background (use mark-only or wordmark-only
// variants when space is tight).
// ============================================

import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
type LogoMode = "full" | "mark" | "wordmark";

const SIZE_MAP: Record<LogoSize, { mark: number; text: string; gap: string }> = {
  xs: { mark: 16, text: "text-xs", gap: "gap-1.5" },
  sm: { mark: 20, text: "text-sm", gap: "gap-2" },
  md: { mark: 28, text: "text-lg", gap: "gap-2.5" },
  lg: { mark: 40, text: "text-2xl", gap: "gap-3" },
  xl: { mark: 56, text: "text-4xl", gap: "gap-3.5" },
};

export function Logo({
  size = "md",
  mode = "full",
  className,
  href,
  invert = false,
}: {
  size?: LogoSize;
  mode?: LogoMode;
  className?: string;
  href?: string;
  invert?: boolean;
}) {
  const cfg = SIZE_MAP[size];
  const mark = (
    <LogoMark size={cfg.mark} invert={invert} />
  );
  const word = (
    <span
      className={cn(
        "font-black tracking-tight leading-none",
        cfg.text,
        invert ? "text-zinc-950" : "text-zinc-900 dark:text-zinc-50"
      )}
    >
      AI<span className="text-violet-600 dark:text-violet-400">.</span>DY
    </span>
  );

  const content = (
    <span className={cn("inline-flex items-center", cfg.gap, className)}>
      {mode !== "wordmark" && mark}
      {mode !== "mark" && word}
    </span>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {content}
      </a>
    );
  }
  return content;
}

export function LogoMark({
  size = 32,
  invert = false,
  className,
}: {
  size?: number;
  invert?: boolean;
  className?: string;
}) {
  // The mark: a stylized "A" formed by two converging strokes.
  // The glowing dot is the AI's intelligence core.
  const stroke = invert ? "#0a0a0a" : "#ffffff";
  const fill = invert ? "#0a0a0a" : "#ffffff";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="AI.DY"
    >
      <defs>
        <linearGradient id="aidy-mark-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="60%" stopColor="#5b21b6" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="aidy-mark-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect x="0" y="0" width="32" height="32" rx="8" fill="url(#aidy-mark-bg)" />
      {/* The "A" shape — two converging strokes with crossbar */}
      <path
        d="M16 7 L23 24 L19.5 24 L18 20.5 L14 20.5 L12.5 24 L9 24 Z M14.7 18.3 L17.3 18.3 L16 14.8 Z"
        fill={fill}
        fillOpacity="0.96"
      />
      {/* The AI core — a glowing cyan dot inside the A's apex */}
      <circle cx="16" cy="11" r="2.2" fill="url(#aidy-mark-glow)" />
    </svg>
  );
}

export function Wordmark({
  size = "md",
  invert = false,
  className,
}: {
  size?: LogoSize;
  invert?: boolean;
  className?: string;
}) {
  const cfg = SIZE_MAP[size];
  return (
    <span
      className={cn(
        "font-black tracking-tight leading-none",
        cfg.text,
        invert ? "text-zinc-950" : "text-zinc-900 dark:text-zinc-50",
        className
      )}
    >
      AI<span className="text-violet-600 dark:text-violet-400">.</span>DY
    </span>
  );
}
