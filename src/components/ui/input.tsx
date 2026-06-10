import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input — themed text input. Uses `bg-background` + `border-input` so dark mode
 * flips automatically via the project's theme tokens.
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-surface-elevated px-4 py-2 text-sm text-foreground transition",
        "placeholder:text-muted-foreground",
        "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
