"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Interactive 1-5 star picker.
 *
 * - Reads `value` (1..5) and calls `onChange` with the new value.
 * - Hover state previews the rating before commit.
 * - Keyboard accessible: Tab to focus the group, Arrow keys to
 *   change rating, Enter/Space to commit (a hidden <input type="radio">
 *   per star handles this).
 */
export function RatingStarsInput({
  value,
  onChange,
  name,
  disabled = false,
  className,
  size = "md",
  required = false,
}: {
  value: number;
  onChange: (v: number) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  required?: boolean;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const groupId = React.useId();
  const display = hover ?? value;

  const sizeClass = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  }[size];

  return (
    <div
      role="radiogroup"
      aria-label="التقييم"
      className={cn("inline-flex items-center gap-1", className)}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const isActive = n <= display;
        return (
          <label
            key={n}
            className={cn(
              "cursor-pointer rounded p-0.5 transition-transform",
              disabled && "cursor-not-allowed opacity-60",
              !disabled && "hover:scale-110"
            )}
            onMouseEnter={() => !disabled && setHover(n)}
          >
            <input
              type="radio"
              name={name ?? `rating-${groupId}`}
              value={n}
              checked={value === n}
              required={required}
              disabled={disabled}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={`${n} نجوم`}
            />
            <Star
              className={cn(
                sizeClass,
                "transition-colors",
                isActive
                  ? "fill-amber-400 text-amber-400"
                  : "text-zinc-300 dark:text-zinc-700"
              )}
              aria-hidden
            />
          </label>
        );
      })}
    </div>
  );
}
