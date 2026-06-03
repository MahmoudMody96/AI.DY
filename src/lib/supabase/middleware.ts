import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/tools",
  "/categories",
  "/login",
  "/signup",
  "/forgot-password",
  "/auth",
];

const API_PUBLIC_ROUTES = [
  "/api/categories",
  "/api/tools",
  "/api/admin/content", // authenticated via API key, not session
  "/api/newsletter",
  "/api/leads",
  "/api/views",
];

const PROTECTED_ROUTES = ["/account", "/submit"];

const ADMIN_ROUTES = ["/admin"];

function isPublic(pathname: string): boolean {
  if (ADMIN_ROUTES.some((p) => pathname.startsWith(p))) return false;
  if (PROTECTED_ROUTES.some((p) => pathname.startsWith(p))) return false;
  if (pathname.startsWith("/api/")) {
    return API_PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
  }
  return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });

  // Refresh session if needed
  const { data: { user } } = await supabase.auth.getUser();

  // Enforce admin role for /admin/* routes
  if (user && isAdminRoute(request.nextUrl.pathname)) {
    // Use the same user-scoped client (RLS allows reading own profile role).
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string }>();
    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("error", "admin_required");
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export { isPublic, isAdminRoute };
