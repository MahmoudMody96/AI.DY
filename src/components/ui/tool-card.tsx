// Re-export — the canonical implementation lives in `@/components/tools/tool-card`
// to keep tool-related primitives in one folder. Kept here for backward
// compatibility with any import that still uses `@/components/ui/tool-card`.
export { ToolCard, type ToolCardData } from "@/components/tools/tool-card";
