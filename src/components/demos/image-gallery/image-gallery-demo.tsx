// ============================================
// AI.DY — ImageGalleryDemo (Client Component)
// ============================================
// Phase 1.4 placeholder. Renders a prompt input + a 2x2 grid of
// placeholder tiles. In Phase 2.0, this will hit an image-generation
// provider (DALL-E, Stable Diffusion, etc.) and stream the URLs back
// into the grid.
//
// Behavior today:
//   - User types a prompt → presses "توليد" → the grid swaps in
//     generated-looking placeholder cards (with the prompt overlaid)
//     after a 600ms simulated delay.
//   - The point is to give the page a *real* interactive feel so the
//     user understands "this is a live demo of a generation tool."

"use client";

import * as React from "react";
import { Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DemoShell } from "../shared/demo-shell";
import type { ImageGalleryDemoConfig, DemoProps } from "../types";

function safeParseConfig(raw: unknown): ImageGalleryDemoConfig {
  if (typeof raw === "object" && raw !== null) {
    return raw as ImageGalleryDemoConfig;
  }
  return {};
}

interface Tile {
  id: string;
  prompt: string;
  // Phase 2.0: swap with real CDN url from the provider.
  placeholderHue: number;
}

function hueFromPrompt(p: string): number {
  let h = 0;
  for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) >>> 0;
  return h % 360;
}

const DEFAULT_SAMPLES = [
  "غروب على أهرامات الجيزة بألوان باستيل",
  "مدينة مستقبلية في صحراء مصر",
  "شاي بالنعناع على طاولة خشبية",
];

export function ImageGalleryDemo({ tool }: DemoProps) {
  const config = safeParseConfig(tool.demo_config);
  const columns = Math.min(4, Math.max(1, config.columns ?? 2));
  const greeting =
    config.greeting ??
    `اكتب وصف صورة وجرّب قدرة ${tool.name} على التوليد.`;
  const samples = config.samplePrompts ?? DEFAULT_SAMPLES;

  const [prompt, setPrompt] = React.useState<string>("");
  const [tiles, setTiles] = React.useState<Tile[]>([]);
  const [pending, setPending] = React.useState<boolean>(false);

  function generate(p: string) {
    if (!p.trim() || pending) return;
    setPending(true);
    // Simulated latency. Phase 2.0 will await a real API call.
    setTimeout(() => {
      setTiles((prev) => {
        const next: Tile = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          prompt: p,
          placeholderHue: hueFromPrompt(p),
        };
        return [next, ...prev].slice(0, 4);
      });
      setPending(false);
    }, 600);
  }

  return (
    <DemoShell
      toolName={tool.name}
      toolColor={tool.color}
      subtitle="Phase 1.4 — placeholder grid (real images in Phase 2.0)"
    >
      {/* Input */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") generate(prompt);
          }}
          placeholder="اكتب وصف الصورة…"
          disabled={pending}
          className="flex-1 min-w-[200px]"
        />
        <Button
          onClick={() => generate(prompt)}
          disabled={pending || !prompt.trim()}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {pending ? "جاري التوليد…" : "توليد"}
        </Button>
      </div>

      {/* Sample chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {samples.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setPrompt(s);
              generate(s);
            }}
            disabled={pending}
            className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid */}
      {tiles.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">{greeting}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            (الصور الحقيقية هتظهر هنا في Phase 2.0)
          </p>
        </div>
      ) : (
        <div
          className={cn("grid gap-3", {
            "grid-cols-1": columns === 1,
            "grid-cols-2": columns === 2,
            "grid-cols-3": columns === 3,
            "grid-cols-4": columns === 4,
          })}
        >
          {tiles.map((t) => (
            <TileCard key={t.id} tile={t} />
          ))}
        </div>
      )}
    </DemoShell>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div
        className="relative aspect-square w-full"
        style={{
          background: `linear-gradient(135deg, hsl(${tile.placeholderHue} 70% 65%) 0%, hsl(${(tile.placeholderHue + 60) % 360} 70% 50%) 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white/80 mix-blend-overlay">
          AI
        </div>
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
          {tile.prompt}
        </p>
      </div>
    </div>
  );
}
