// ============================================
// AI.DY — In-memory rate limiter
// ============================================
// Tracks per-key request counts in a Map. Each key gets a fixed-size
// sliding window (default 60s) and is rejected with 429 once the
// count exceeds the limit.
//
// IMPORTANT: this works for dev + single-instance prod. For multi-
// instance production (Vercel, etc.) the in-memory state doesn't
// survive cold starts. Swap for Vercel KV / Upstash Redis when
// going live. The Map interface here matches @vercel/kv / ioredis
// closely enough that the change is a 1-file edit.

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number; // seconds (0 when allowed)
}

/**
 * Record a hit for `key` and return whether the request is allowed.
 * Bursts are counted inside a single fixed window — if the previous
 * window has elapsed, the counter resets.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      retryAfter: 0,
    };
  }

  if (existing.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfter: 0,
  };
}

/**
 * Best-effort lookup of the caller's IP. The X-Forwarded-For header
 * is preferred because Vercel sets it. Falls back to a constant so
 * callers always get *some* key — never undefined.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/** Test-only: clear all buckets. */
export function _resetRateLimiter(): void {
  buckets.clear();
}
