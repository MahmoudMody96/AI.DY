"use client";

// ============================================
// AI.DY — Tool Logo
// Renders the OFFICIAL brand mark for each AI tool
// using the simple-icons pack, recoloured with the
// brand's primary colour. Falls back to a clean
// monogram (initial in a coloured rounded square)
// for tools we don't have a brand icon for.
// ============================================

import * as si from "simple-icons";
import { cn } from "@/lib/utils";

type SimpleIcon = { path: string; hex: string; title: string };

const ICON_MAP: Record<string, keyof typeof si | "__FALLBACK__"> = {
  // AI assistants
  chatgpt: "__FALLBACK__", // OpenAI not in simple-icons
  claude: "siAnthropic",
  gemini: "siGooglegemini",
  "microsoft-copilot": "__FALLBACK__", // Microsoft not in simple-icons
  deepseek: "siDeepseek",
  jasper: "__FALLBACK__",
  "copy-ai": "__FALLBACK__",
  writesonic: "__FALLBACK__",
  "notion-ai": "siNotion",
  // Image
  midjourney: "__FALLBACK__",
  "dall-e-3": "__FALLBACK__", // OpenAI
  "leonardo-ai": "__FALLBACK__",
  ideogram: "__FALLBACK__",
  // Code
  "github-copilot": "siGithub",
  cursor: "__FALLBACK__",
  "replit-ai": "siReplit",
  // Video
  runway: "__FALLBACK__",
  pika: "__FALLBACK__",
  synthesia: "__FALLBACK__",
  // Audio
  elevenlabs: "__FALLBACK__",
  "murf-ai": "__FALLBACK__",
  suno: "__FALLBACK__",
  // Automation
  zapier: "siZapier",
  make: "siMake",
  n8n: "siN8n",
  // Search
  perplexity: "siPerplexity",
  "you-com": "__FALLBACK__",
  andi: "__FALLBACK__",
};

// Brand colours (overrides simple-icons default black).
// These are the actual brand primary colours as published
// on each company's website / brand guidelines.
const BRAND_COLORS: Record<string, string> = {
  chatgpt: "#10A37F",
  claude: "#D97757",
  gemini: "#4285F4",
  "microsoft-copilot": "#0078D4",
  deepseek: "#1A56DB",
  jasper: "#5C2BD9",
  "copy-ai": "#3E55E2",
  writesonic: "#7C3AED",
  "notion-ai": "#000000",
  midjourney: "#000000",
  "dall-e-3": "#10A37F",
  "leonardo-ai": "#FF6B35",
  ideogram: "#5B47FB",
  "github-copilot": "#000000",
  cursor: "#000000",
  "replit-ai": "#F26207",
  runway: "#000000",
  pika: "#FF6E6E",
  synthesia: "#0091FF",
  elevenlabs: "#000000",
  "murf-ai": "#1E90FF",
  suno: "#000000",
  zapier: "#FF4A00",
  make: "#6D00CC",
  n8n: "#EA4B71",
  perplexity: "#1FB8CD",
  "you-com": "#7C3AED",
  andi: "#7C3AED",
};

// Display name overrides when simple-icons title isn't ideal
const NAME_OVERRIDES: Record<string, string> = {
  "notion-ai": "Notion",
  "dall-e-3": "OpenAI",
  midjourney: "Midjourney",
  "github-copilot": "GitHub",
  cursor: "Cursor",
  runway: "Runway",
  suno: "Suno",
  elevenlabs: "ElevenLabs",
  "leonardo-ai": "Leonardo.AI",
  "murf-ai": "Murf AI",
  "replit-ai": "Replit",
  "copy-ai": "Copy.ai",
  "pika": "Pika",
  "you-com": "You.com",
  "microsoft-copilot": "Microsoft",
};

function getIcon(slug: string): SimpleIcon | null {
  const key = ICON_MAP[slug];
  if (!key || key === "__FALLBACK__") return null;
  const icon = si[key] as unknown as SimpleIcon | undefined;
  return icon ?? null;
}

function getColor(slug: string): string {
  return BRAND_COLORS[slug] ?? "#7c3aed";
}

function getName(slug: string, fallback: string): string {
  return NAME_OVERRIDES[slug] ?? fallback;
}

function initial(s: string): string {
  // First letter, uppercased, ASCII fallback
  const first = s.charAt(0);
  if (/[a-zA-Z0-9]/.test(first)) return first.toUpperCase();
  return "?";
}

export function ToolLogo({
  slug,
  name,
  size = 40,
  className,
  rounded = "xl",
  showName = false,
}: {
  slug: string;
  name: string;
  size?: number;
  className?: string;
  rounded?: "lg" | "xl" | "2xl" | "full";
  showName?: boolean;
}) {
  const icon = getIcon(slug);
  const color = getColor(slug);
  const displayName = getName(slug, name);
  const isFallback = !icon;

  const radiusClass = {
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-3",
        showName && name ? "shrink-0" : "shrink-0",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden",
          radiusClass
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: isFallback ? color : "#ffffff",
          border: isFallback ? "none" : "1px solid rgba(0,0,0,0.06)",
        }}
        aria-label={displayName}
      >
        {icon ? (
          <svg
            role="img"
            viewBox="0 0 24 24"
            width={Math.round(size * 0.6)}
            height={Math.round(size * 0.6)}
            fill={color}
            xmlns="http://www.w3.org/2000/svg"
            aria-label={icon.title}
          >
            <path d={icon.path} />
          </svg>
        ) : (
          <span
            className="font-black text-white"
            style={{ fontSize: Math.round(size * 0.42) }}
          >
            {initial(displayName)}
          </span>
        )}
      </span>
      {showName && (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {displayName}
        </span>
      )}
    </span>
  );
}
