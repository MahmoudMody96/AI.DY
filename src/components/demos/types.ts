// ============================================
// AI.DY — Demo framework types
// ============================================
// Shared type definitions for the live demo widget framework. The
// framework is open-ended: every Tool in the catalog can opt-in to
// showing an interactive widget on its detail page by setting
// `demo_type` and `demo_config` on the tools row.
//
// Adding a new demo type means:
//   1. Extend the `DemoType` union below.
//   2. Add a matching `tools_demo_type_check` value in the migration.
//   3. Implement a component in src/components/demos/<kind>/<kind>-demo.tsx
//   4. Register it in `registry.ts`.
//
// The union is mirrored by the SQL CHECK constraint on
// public.tools.demo_type (see 102_demo_type.sql).

import type { Json } from "@/types/database.types";

/**
 * The five supported demo widget kinds. Matches the SQL CHECK constraint
 * on public.tools.demo_type in 102_demo_type.sql.
 */
export type DemoType =
  | "chat"
  | "image-gallery"
  | "tts"
  | "code-sandbox"
  | "template-form";

/**
 * The minimum Tool shape every demo component needs. Server Component
 * pages can pass the full tools row — the demo widgets only read a
 * handful of fields, so we narrow the public contract here.
 *
 * `demo_config` is intentionally typed as `Json` (loose) because the
 * shape varies by demo_type. Each widget reads it with its own
 * `parseDemoConfig` helper to extract a narrow, well-typed config.
 */
export interface DemoTool {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  /** Optional brand color for tinting the shell (hex or theme token). */
  color?: string | null;
  demo_type: DemoType | null;
  demo_config: Json;
}

/**
 * Common props every demo widget component receives. The widget decides
 * whether to use `tool.color`, what labels to render, etc.
 */
export interface DemoProps {
  tool: DemoTool;
  /** Whether at least one provider API key is configured (chat demo). */
  apiConfigured?: boolean;
}

// ---------- Chat demo config ----------

/**
 * `chat` — bubble list with provider proxy. The server route at
 * `/api/demos/chat` reads this and dispatches to OpenAI / Anthropic /
 * Gemini based on `model`.
 */
export interface ChatDemoConfig {
  /** Provider-specific model id, e.g. `gpt-3.5-turbo`, `claude-3-haiku-20240307`. */
  model?: string;
  /** System prompt — usually localized (Arabic / English). */
  systemPrompt?: string;
  /** Max tokens for the completion. Default 300. */
  maxTokens?: number;
  /** Optional temperature (0-2). Default 0.7. */
  temperature?: number;
  /** Per-minute request cap, 1-60. Default 10. */
  rateLimit?: number;
  /** Placeholder text in the message input. */
  placeholder?: string;
  /** Optional greeting shown in the empty state. */
  greeting?: string;
}

export function isChatDemoConfig(value: unknown): value is ChatDemoConfig {
  return typeof value === "object" && value !== null;
}

// ---------- Image gallery demo config ----------

export interface ImageGalleryDemoConfig {
  /** Grid columns (1-4). Default 2. */
  columns?: number;
  /** Sample prompts to prefill the input as suggestions. */
  samplePrompts?: string[];
  greeting?: string;
}

// ---------- TTS demo config ----------

export interface TtsDemoConfig {
  /** Default voice id. */
  voice?: string;
  /** Default language tag (e.g. `ar-EG`, `en-US`). */
  language?: string;
  greeting?: string;
}

// ---------- Code sandbox demo config ----------

export interface CodeSandboxDemoConfig {
  /** Default code shown in the editor. */
  defaultCode?: string;
  /** Language tag — used for syntax highlighting label. */
  language?: string;
  greeting?: string;
}

// ---------- Template form demo config ----------

export type TemplateFieldType = "text" | "textarea" | "select" | "number";

export interface TemplateField {
  name: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface TemplateFormDemoConfig {
  title?: string;
  description?: string;
  submitLabel?: string;
  /** Server route to POST the form to. */
  endpoint?: string;
  fields: TemplateField[];
  greeting?: string;
}
