// ============================================
// AI.DY — TtsDemo (Client Component)
// ============================================
// Phase 1.4 placeholder. Renders a textarea + a "Speak" button. In
// Phase 2.0, "Speak" will call /api/demos/tts → a TTS provider
// (ElevenLabs / OpenAI TTS) → return an audio blob. Today the button
// surfaces a friendly "Coming soon" notice so the user understands
// the widget exists but the real audio isn't wired up yet.

"use client";

import * as React from "react";
import { Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoShell } from "../shared/demo-shell";
import type { TtsDemoConfig, DemoProps } from "../types";

function safeParseConfig(raw: unknown): TtsDemoConfig {
  if (typeof raw === "object" && raw !== null) {
    return raw as TtsDemoConfig;
  }
  return {};
}

const SAMPLE_ARABIC =
  "السلام عليكم! أنا مساعد صوتي من AI.DY. جرّبني بتحويل أي نص لصوت طبيعي.";

export function TtsDemo({ tool }: DemoProps) {
  const config = safeParseConfig(tool.demo_config);
  const greeting =
    config.greeting ??
    `اكتب جملة قصيرة واضغط "تشغيل" عشان تسمع صوت ${tool.name}.`;
  const defaultVoice = config.voice ?? "default";
  const defaultLanguage = config.language ?? "ar-EG";

  const [text, setText] = React.useState<string>(SAMPLE_ARABIC);
  const [voice, setVoice] = React.useState<string>(defaultVoice);
  const [language, setLanguage] = React.useState<string>(defaultLanguage);

  return (
    <DemoShell
      toolName={tool.name}
      toolColor={tool.color}
      subtitle={`Voice: ${voice} · ${language}`}
    >
      <p className="mb-3 text-sm text-muted-foreground">{greeting}</p>

      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        النص
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={500}
        placeholder="اكتب النص هنا…"
        className="mb-3 flex w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground transition placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
      />

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            الصوت
          </label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="default">افتراضي</option>
            <option value="male-ar">ذكر عربي</option>
            <option value="female-ar">أنثى عربية</option>
            <option value="male-en">Male English</option>
            <option value="female-en">Female English</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            اللغة
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="ar-EG">العربية (مصر)</option>
            <option value="ar-SA">العربية (سعودية)</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
          </select>
        </div>
      </div>

      <Button disabled className="w-full" size="lg">
        <Volume2 className="h-4 w-4" />
        تشغيل الصوت
      </Button>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          ميزة تحويل النص لصوت (TTS) هتتفعل في <strong>Phase 2.0</strong>. لحد
          ما تتفعل، جرّب الأداة الأصلية من الموقع الرسمي.
        </p>
      </div>
    </DemoShell>
  );
}
