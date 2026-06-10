// ============================================
// AI.DY — ChatDemo (Client Component)
// ============================================
// The only demo widget that talks to a backend in Phase 1.4. Posts
// { tool_slug, message } to /api/demos/chat and renders the reply
// in a bubble list. Supports Enter to send, Shift+Enter for newline,
// auto-scroll to latest, and a clear button.

"use client";

import * as React from "react";
import { Send, Trash2, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoShell } from "../shared/demo-shell";
import { RateLimitNotice } from "../shared/rate-limit-notice";
import type { ChatDemoConfig, DemoProps } from "../types";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  pending?: boolean;
  error?: boolean;
}

type ChatApiError = {
  error?: string;
  retryAfter?: number;
};

const MAX_MESSAGE = 1000;

function genId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeParseConfig(raw: unknown): ChatDemoConfig {
  if (typeof raw === "object" && raw !== null) {
    return raw as ChatDemoConfig;
  }
  return {};
}

export function ChatDemo({ tool, apiConfigured = true }: DemoProps) {
  const config = React.useMemo<ChatDemoConfig>(
    () => safeParseConfig(tool.demo_config),
    [tool.demo_config]
  );
  const greeting =
    config.greeting ?? `مرحباً! أنا ${tool.name}. اكتب رسالتك وجرّبني.`;
  const placeholder = config.placeholder ?? "اكتب رسالتك هنا…";
  const modelLabel = config.model ? `Model: ${config.model}` : undefined;

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState<string>("");
  const [pending, setPending] = React.useState<boolean>(false);
  const [rateLimited, setRateLimited] = React.useState<{
    retryAfter: number | null;
  } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom on every new message.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, pending]);

  // Clear any rate-limit notice after the cooldown.
  React.useEffect(() => {
    if (!rateLimited?.retryAfter) return;
    const t = setTimeout(() => setRateLimited(null), rateLimited.retryAfter * 1000);
    return () => clearTimeout(t);
  }, [rateLimited]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    if (text.length > MAX_MESSAGE) return;

    const userMsg: Message = { id: genId(), role: "user", content: text };
    const assistantId = genId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", pending: true },
    ]);
    setInput("");
    setPending(true);
    setRateLimited(null);

    try {
      const res = await fetch("/api/demos/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_slug: tool.slug, message: text }),
      });

      if (res.status === 429) {
        const data = (await res.json().catch(() => ({}))) as ChatApiError;
        setRateLimited({ retryAfter: data.retryAfter ?? 60 });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "⏱️ وصلت للحد الأقصى من الطلبات. حاول بعد شوية.",
                  pending: false,
                  error: true,
                }
              : m
          )
        );
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ChatApiError;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: data.error ?? "حدث خطأ، حاول مرة أخرى.",
                  pending: false,
                  error: true,
                }
              : m
          )
        );
        return;
      }

      const data = (await res.json()) as { reply?: string };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: data.reply ?? "", pending: false }
            : m
        )
      );
    } catch (err) {
      console.error("[chat-demo] send failed:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "تعذر الاتصال بالخادم. حاول مرة أخرى.",
                pending: false,
                error: true,
              }
            : m
        )
      );
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function clearChat() {
    setMessages([]);
    setRateLimited(null);
  }

  return (
    <DemoShell toolName={tool.name} toolColor={tool.color} subtitle={modelLabel}>
      {!apiConfigured && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
          ℹ️ الـ API key مش متضبوطللسيرفر. هتشوف رد تجريبي ثابت لحد ما الـ
          owner يضيف المفاتيح.
        </div>
      )}

      {rateLimited && (
        <div className="mb-4">
          <RateLimitNotice retryAfter={rateLimited.retryAfter} />
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mb-4 max-h-[420px] min-h-[260px] space-y-3 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-4"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              <Bot className="h-5 w-5" />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">{greeting}</p>
          </div>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
      </div>

      {/* Input */}
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={MAX_MESSAGE}
          rows={1}
          disabled={pending}
          className={cn(
            "flex max-h-32 min-h-[44px] flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground transition",
            "placeholder:text-muted-foreground",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          aria-label="message"
        />
        <Button
          onClick={() => void send()}
          disabled={pending || !input.trim()}
          size="icon"
          aria-label="send"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearChat}
            disabled={pending}
            aria-label="clear"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Enter لإرسال · Shift+Enter لسطر جديد
      </p>
    </DemoShell>
  );
}

// ---------- Bubble ----------

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex items-start gap-2",
        isUser ? "flex-row-reverse text-right" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-violet-600 text-white"
            : "bg-muted text-muted-foreground"
        )}
        aria-hidden
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-7 shadow-sm",
          isUser
            ? "bg-violet-600 text-white"
            : "bg-card text-foreground ring-1 ring-border",
          message.error && "ring-1 ring-red-300 dark:ring-red-900"
        )}
      >
        {message.pending && !message.content ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-70 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-70 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-70 [animation-delay:300ms]" />
          </span>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
    </div>
  );
}
