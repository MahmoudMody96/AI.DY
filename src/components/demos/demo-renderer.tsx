// ============================================
// AI.DY — DemoRenderer (Server Component)
// ============================================
// Reads tool.demo_type, looks up the matching widget in the
// registry, and renders it. Renders nothing when demo_type is null —
// the tool page just won't show a demo section.
//
// We pass the *minimum* DemoTool shape into the widget so the
// component's public contract stays narrow. For Phase 1.4 every
// widget is "use client" (interactive) but the renderer itself is
// a server component so the tool page can stay mostly server-side.

import { getDemoComponent } from "./registry";
import type { DemoType, DemoTool } from "./types";

export interface DemoRendererProps {
  tool: {
    id: string;
    slug: string;
    name: string;
    name_en: string | null;
    color?: string | null;
    demo_type: DemoType | string | null;
    demo_config: unknown;
  };
  /** Whether any provider API key is configured (chat demo). */
  apiConfigured?: boolean;
}

export function DemoRenderer({ tool, apiConfigured = true }: DemoRendererProps) {
  if (!tool.demo_type) return null;

  const Component = getDemoComponent(tool.demo_type as DemoType);
  if (!Component) return null;

  // Narrow into the public DemoTool shape. `color` is optional —
  // most rows don't have it. demo_config is intentionally Json-shaped.
  const narrow: DemoTool = {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    name_en: tool.name_en,
    color: tool.color ?? null,
    demo_type: tool.demo_type as DemoType,
    demo_config: (tool.demo_config ?? {}) as never,
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-12">
      <Component tool={narrow} apiConfigured={apiConfigured} />
    </div>
  );
}
