// ============================================
// AI.DY — CodeSandboxDemo (Client Component)
// ============================================
// Phase 1.4 placeholder. A small editor + "Run" button. In Phase 1.4
// we render the code output via a sandboxed <iframe srcdoc>. The
// iframe has no network access, no cookies, no parent DOM access, and
// is a separate origin-less document. This is enough to demonstrate
// "live execution" for HTML / CSS / JS examples without exposing
// the host site to the user's code.
//
// Phase 2.0 will swap the iframe for a real WASM/Worker sandbox
// (Pyodide, QuickJS, …) supporting Python / TS.

"use client";

import * as React from "react";
import { Play, RotateCcw, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoShell } from "../shared/demo-shell";
import type { CodeSandboxDemoConfig, DemoProps } from "../types";

function safeParseConfig(raw: unknown): CodeSandboxDemoConfig {
  if (typeof raw === "object" && raw !== null) {
    return raw as CodeSandboxDemoConfig;
  }
  return {};
}

const DEFAULT_CODE = `<!-- Hello world! -->
<div class="card">
  <h1>مرحباً من Sandbox 👋</h1>
  <p>عدّل الكود واضغط Run.</p>
  <button onclick="alert('Hi!')">اضغطني</button>
</div>

<style>
  body { font-family: system-ui; padding: 24px;
         background: #f8fafc; }
  .card { background: white; padding: 24px; border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  h1 { color: #7c3aed; margin: 0 0 8px; }
  button { background: #7c3aed; color: white; border: 0;
           padding: 8px 16px; border-radius: 8px;
           cursor: pointer; }
</style>`;

export function CodeSandboxDemo({ tool }: DemoProps) {
  const config = safeParseConfig(tool.demo_config);
  const greeting =
    config.greeting ??
    `محرر بسيط — عدّل الكود HTML/JS وشوف النتيجة في الـ preview.`;
  const language = config.language ?? "html";
  const initialCode = config.defaultCode ?? DEFAULT_CODE;

  const [code, setCode] = React.useState<string>(initialCode);
  const [out, setOut] = React.useState<string>(initialCode);

  function run() {
    setOut(code);
  }

  function reset() {
    setCode(initialCode);
    setOut(initialCode);
  }

  return (
    <DemoShell
      toolName={tool.name}
      toolColor={tool.color}
      subtitle={`Language: ${language} · Sandboxed iframe`}
    >
      <p className="mb-3 text-sm text-muted-foreground">{greeting}</p>

      <div className="mb-2 flex items-center gap-2">
        <Code2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Editor
        </span>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        spellCheck={false}
        className={cn(
          "mb-3 w-full resize-y rounded-lg border border-input bg-zinc-950 px-4 py-3 font-mono text-xs text-zinc-100",
          "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        )}
        style={{ direction: "ltr", textAlign: "left" }}
      />

      <div className="mb-2 flex items-center gap-2">
        <Button onClick={run} size="sm">
          <Play className="h-3.5 w-3.5" />
          Run
        </Button>
        <Button onClick={reset} variant="outline" size="sm">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Output
      </div>
      <iframe
        title={`${tool.name} sandbox`}
        srcDoc={out}
        sandbox="allow-scripts"
        className="h-[280px] w-full rounded-lg border border-border bg-white"
      />
      <p className="mt-2 text-[11px] text-muted-foreground">
        الـ iframe في وضع sandbox — مفيش network access أو cookies أو وصول للـ
        parent DOM. (تجريب آمن — Phase 2.0 هيضيف Python / TS عبر Pyodide).
      </p>
    </DemoShell>
  );
}
