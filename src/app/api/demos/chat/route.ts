// ============================================
// AI.DY — Chat demo proxy
// ============================================
// POST /api/demos/chat
//   body: { tool_slug: string, message: string }
//   resp: { reply: string }
//
// Flow:
//   1. Validate input + rate-limit the caller (10 req / min / IP).
//   2. Look up the tool row; reject if demo_type !== 'chat'.
//   3. Read demo_config to pick the model + system prompt.
//   4. Detect the provider from the model name and dispatch:
//        OpenAI   → POST https://api.openai.com/v1/chat/completions
//        Anthropic → POST https://api.anthropic.com/v1/messages
//        Gemini   → POST https://generativelanguage.googleapis.com/...
//   5. If no provider key is configured for the chosen model, fall
//      back to a friendly placeholder reply so the demo never breaks.
//   6. Errors map to friendly Arabic messages + correct HTTP codes.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// ---------- Validation ----------

const BodySchema = z.object({
  tool_slug: z.string().trim().min(1).max(120),
  message: z
    .string()
    .trim()
    .min(1, "message is required")
    .max(1000, "message must be 1000 characters or fewer"),
});

const DEFAULT_MAX_TOKENS = 300;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_RATE_LIMIT = 10; // req / min
const WINDOW_MS = 60_000;

// ---------- Provider detection ----------

type Provider = "openai" | "anthropic" | "gemini" | "unknown";

interface ChatRow {
  id: string;
  slug: string;
  name: string;
  is_published: boolean;
  status: string;
  demo_type: string | null;
  demo_config: unknown;
}

function detectProvider(model: string): Provider {
  const m = model.toLowerCase();
  if (m.startsWith("gpt-") || m.includes("openai")) return "openai";
  if (m.startsWith("claude") || m.includes("anthropic")) return "anthropic";
  if (m.startsWith("gemini") || m.includes("google")) return "gemini";
  return "unknown";
}

// ---------- Demo config parsing ----------

interface ParsedConfig {
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  rateLimit: number;
}

function parseDemoConfig(
  raw: unknown,
  fallbackModel: string,
  fallbackSystemPrompt: string
): ParsedConfig {
  const c = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    model: typeof c.model === "string" ? c.model : fallbackModel,
    systemPrompt:
      typeof c.systemPrompt === "string"
        ? c.systemPrompt
        : fallbackSystemPrompt,
    maxTokens:
      typeof c.maxTokens === "number" && c.maxTokens > 0 && c.maxTokens <= 4000
        ? Math.floor(c.maxTokens)
        : DEFAULT_MAX_TOKENS,
    temperature:
      typeof c.temperature === "number" && c.temperature >= 0 && c.temperature <= 2
        ? c.temperature
        : DEFAULT_TEMPERATURE,
    rateLimit:
      typeof c.rateLimit === "number" && c.rateLimit > 0 && c.rateLimit <= 60
        ? Math.floor(c.rateLimit)
        : DEFAULT_RATE_LIMIT,
  };
}

// ---------- Provider dispatch ----------

interface ProviderResult {
  reply: string;
  /** True when the model was actually called. False = placeholder. */
  live: boolean;
}

async function callOpenAI(
  model: string,
  systemPrompt: string,
  message: string,
  maxTokens: number,
  temperature: number,
  apiKey: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callAnthropic(
  model: string,
  systemPrompt: string,
  message: string,
  maxTokens: number,
  temperature: number,
  apiKey: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  return (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

async function callGemini(
  model: string,
  systemPrompt: string,
  message: string,
  maxTokens: number,
  temperature: number,
  apiKey: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: message }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

function placeholderReply(toolName: string, message: string): string {
  return (
    `[Demo placeholder — ${toolName}]\n\n` +
    `استلمت رسالتك: "${message}"\n\n` +
    `لتفعيل ردود حقيقية، أضف الـ API key الخاص بالـ ${toolName} ` +
    `في environment variables (OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY) ` +
    `وأعد deploy.`
  );
}

async function dispatch(
  provider: Provider,
  model: string,
  systemPrompt: string,
  message: string,
  maxTokens: number,
  temperature: number
): Promise<ProviderResult> {
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    const reply = await callOpenAI(
      model,
      systemPrompt,
      message,
      maxTokens,
      temperature,
      process.env.OPENAI_API_KEY
    );
    return { reply, live: true };
  }
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    const reply = await callAnthropic(
      model,
      systemPrompt,
      message,
      maxTokens,
      temperature,
      process.env.ANTHROPIC_API_KEY
    );
    return { reply, live: true };
  }
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    const reply = await callGemini(
      model,
      systemPrompt,
      message,
      maxTokens,
      temperature,
      process.env.GEMINI_API_KEY
    );
    return { reply, live: true };
  }
  return { reply: "", live: false };
}

// ---------- Route handler ----------

export async function POST(req: NextRequest) {
  // 1. Parse + validate body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const { tool_slug, message } = parsed.data;

  // 2. Rate limit (per IP). 10 / min is the default; demo_config can
  //    raise or lower it (clamped to 1-60).
  const ip = getClientIp(req.headers);
  // We don't yet know the tool's rate limit — start with the default
  // and re-check after we read the row.
  const preCheck = checkRateLimit(ip, DEFAULT_RATE_LIMIT, WINDOW_MS);
  if (!preCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: preCheck.retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(preCheck.retryAfter),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // 3. Look up the tool
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }
  const { data: tool, error: toolErr } = await supabase
    .from("tools")
    .select("id, slug, name, is_published, status, demo_type, demo_config")
    .eq("slug", tool_slug)
    .maybeSingle();

  if (toolErr) {
    return NextResponse.json({ error: toolErr.message }, { status: 500 });
  }
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }
  if (!tool.is_published || tool.status !== "published") {
    return NextResponse.json(
      { error: "Tool is not published" },
      { status: 403 }
    );
  }
  if (tool.demo_type !== "chat") {
    return NextResponse.json(
      { error: "Tool does not have a chat demo" },
      { status: 400 }
    );
  }

  // 4. Re-check rate limit with the tool's per-tool budget (if tighter
  //    than the global default).
  const config = parseDemoConfig(
    tool.demo_config,
    "gpt-3.5-turbo",
    "You are a helpful AI assistant. Reply briefly in Arabic."
  );
  if (config.rateLimit < DEFAULT_RATE_LIMIT) {
    const toolCheck = checkRateLimit(
      `${ip}:${tool_slug}`,
      config.rateLimit,
      WINDOW_MS
    );
    if (!toolCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: toolCheck.retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(toolCheck.retryAfter),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // 5. Dispatch to the provider
  const provider = detectProvider(config.model);
  try {
    const result = await dispatch(
      provider,
      config.model,
      config.systemPrompt,
      message,
      config.maxTokens,
      config.temperature
    );
    const reply = result.live
      ? result.reply
      : placeholderReply(tool.name, message);

    return NextResponse.json(
      { reply },
      {
        status: 200,
        headers: {
          "X-Demo-Live": result.live ? "1" : "0",
          "X-Demo-Provider": provider,
          "X-Demo-Model": config.model,
        },
      }
    );
  } catch (err) {
    console.error("[api/demos/chat] provider error:", err);
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Provider error — مش قادر أوصل للـ API دلوقتي. حاول بعد شوية.",
        detail,
      },
      { status: 502 }
    );
  }
}

// ---------- GET: 405 + a small capability description ----------

export function GET() {
  return NextResponse.json(
    {
      error: "Method not allowed — استخدم POST { tool_slug, message }",
      method: "POST",
      schema: {
        tool_slug: "string (slug of a tool with demo_type='chat')",
        message: "string (1-1000 chars)",
      },
      rate_limit: `${DEFAULT_RATE_LIMIT} requests / minute / IP (override via demo_config.rateLimit, max 60)`,
    },
    { status: 405 }
  );
}
