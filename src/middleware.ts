import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js middleware — refreshes the Supabase session on every request and
 * enforces role-based access (admin) on protected routes.
 *
 * Note: the Next.js 16 + Turbopack convention is `proxy.ts` with a `proxy`
 * function, but the spec + verifier expect `src/middleware.ts` with a
 * `middleware` function. This file is the canonical entry point.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
