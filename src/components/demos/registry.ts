// ============================================
// AI.DY — Demo registry
// ============================================
// Maps `demo_type` → React component. The DemoRenderer reads this
// map to instantiate the right widget for a given tool.
//
// To add a new demo type:
//   1. Add the type to `DemoType` in types.ts
//   2. Add a CHECK-constraint value in 102_demo_type.sql
//   3. Build the widget in <kind>/<kind>-demo.tsx
//   4. Add a row to DEMO_REGISTRY below

import type { ComponentType } from "react";
import type { DemoType, DemoProps } from "./types";
import { ChatDemo } from "./chat/chat-demo";
import { ImageGalleryDemo } from "./image-gallery/image-gallery-demo";
import { TtsDemo } from "./tts/tts-demo";
import { CodeSandboxDemo } from "./code-sandbox/code-sandbox-demo";
import { TemplateFormDemo } from "./template-form/template-form-demo";

/**
 * The registry. The map's TypeScript type is locked to the DemoType
 * union so adding a new type forces a corresponding registry entry.
 */
export const DEMO_REGISTRY: {
  [K in DemoType]: ComponentType<DemoProps>;
} = {
  chat: ChatDemo,
  "image-gallery": ImageGalleryDemo,
  tts: TtsDemo,
  "code-sandbox": CodeSandboxDemo,
  "template-form": TemplateFormDemo,
};

/**
 * Helper for the DemoRenderer. Returns null if the demo_type is
 * unrecognised so the caller can render a "coming soon" fallback.
 */
export function getDemoComponent(
  type: DemoType | null
): ComponentType<DemoProps> | null {
  if (!type) return null;
  return DEMO_REGISTRY[type] ?? null;
}
