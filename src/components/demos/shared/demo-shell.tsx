// ============================================
// AI.DY — DemoShell (Server Component)
// ============================================
// A consistent visual frame for every demo widget. Renders a header
// (tool name + "Demo تجريبي" badge) and a footer ("نتيجة تجريبية
// — مش من الخدمة الحقيقية"). Children render in the middle.
//
// Server Component: no client-side state. The widget itself manages
// its own state and lives below the shell.

import * as React from "react";
import { Sparkles, FlaskConical } from "lucide-react";

export interface DemoShellProps {
  toolName: string;
  toolColor?: string | null;
  /** Optional subtitle under the title — e.g. "Model: gpt-3.5-turbo". */
  subtitle?: string;
  /** Hide the default header (e.g. if the widget renders its own). */
  hideHeader?: boolean;
  /** Hide the default footer disclaimer. */
  hideFooter?: boolean;
  children: React.ReactNode;
}

export function DemoShell({
  toolName,
  toolColor,
  subtitle,
  hideHeader = false,
  hideFooter = false,
  children,
}: DemoShellProps) {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm"
      // Tinted left border using the tool's brand color (if any).
      style={
        toolColor
          ? ({ borderLeftColor: toolColor, borderLeftWidth: "4px" } as React.CSSProperties)
          : undefined
      }
    >
      {!hideHeader && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              <FlaskConical className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold leading-tight">
                  جرّب {toolName}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  <Sparkles className="h-3 w-3" />
                  Demo تجريبي
                </span>
              </div>
              {subtitle && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="p-6">{children}</div>

      {!hideFooter && (
        <footer className="border-t border-border bg-muted/20 px-6 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            نتيجة تجريبية — مش من الخدمة الحقيقية. للنتائج الكاملة، توجه لموقع الأداة.
          </p>
        </footer>
      )}
    </section>
  );
}
