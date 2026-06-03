// ============================================
// AI.DY — Brand Tokens
// The single source of truth for colors, gradients,
// shadows, and motion. Used across all UI.
// ============================================

export const BRAND = {
  // Core brand colors (hex, for use in non-Tailwind contexts)
  colors: {
    primary: "#7c3aed",      // violet-600
    primaryDark: "#5b21b6",  // violet-800
    primaryLight: "#a78bfa", // violet-400
    accent: "#06b6d4",       // cyan-500
    accentDark: "#0e7490",   // cyan-700
    warm: "#f59e0b",         // amber-500 (for highlights)
  },

  // Gradient recipes (use in CSS or style attributes)
  gradients: {
    brand: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #0e7490 100%)",
    brandSoft: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)",
    hero: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.18), transparent)",
    card: "linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%)",
    cardDark: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
  },

  // Typography (Tailwind class recipes)
  type: {
    display: "font-black tracking-tight leading-[0.95]",
    h1: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]",
    h2: "text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1]",
    h3: "text-2xl sm:text-3xl font-bold tracking-tight",
    body: "text-base leading-relaxed",
    small: "text-sm text-zinc-500 dark:text-zinc-400",
    mono: "font-mono text-xs",
    eyebrow: "text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500",
  },

  // Shadows
  shadows: {
    soft: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
    card: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
    pop: "0 4px 24px -2px rgba(124, 58, 237, 0.18), 0 2px 6px rgba(0,0,0,0.04)",
    glow: "0 0 0 1px rgba(124, 58, 237, 0.2), 0 8px 32px -4px rgba(124, 58, 237, 0.25)",
  },
} as const;

// Category-specific accent colors (for visual variety)
export const CATEGORY_ACCENTS: Record<string, { from: string; to: string; emoji: string }> = {
  "ai-assistants": { from: "#7c3aed", to: "#5b21b6", emoji: "🤖" },
  writing: { from: "#0891b2", to: "#0e7490", emoji: "✍️" },
  "image-generation": { from: "#ec4899", to: "#be185d", emoji: "🎨" },
  coding: { from: "#10b981", to: "#047857", emoji: "💻" },
  video: { from: "#f59e0b", to: "#b45309", emoji: "🎬" },
  audio: { from: "#8b5cf6", to: "#6d28d9", emoji: "🎵" },
  automation: { from: "#f97316", to: "#c2410c", emoji: "⚙️" },
  search: { from: "#06b6d4", to: "#0e7490", emoji: "🔍" },
};
