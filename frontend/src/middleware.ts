import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

// Customer routes accept either a Supabase session or the legacy Nestora cookie.
const CUSTOMER_PROTECTED_PREFIXES = ["/account"];

// Host/admin routes must continue to use the backend-issued Nestora JWT cookie.
const LEGACY_PROTECTED_PREFIXES = ["/dashboard", "/host", "/admin"];

const AUTH_ONLY_ROUTES = ["/login", "/register"];

function redirectWithCookies(
  request: NextRequest,
  path: string,
  searchParams: Record<string, string>,
  sessionResponse: NextResponse,
): NextResponse {
  const url = new URL(path, request.url);
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // OAuth callback handles its own code exchange and cookie writes.
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  const { response, hasUser } = await updateSupabaseSession(request);

  const legacyCookie = request.cookies.get("nestora_token");
  const hasLegacySession = Boolean(legacyCookie?.value);

  const isCustomerProtected = CUSTOMER_PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isLegacyProtected = LEGACY_PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isCustomerProtected && !hasUser && !hasLegacySession) {
    return redirectWithCookies(
      request,
      "/login",
      { redirect: `${pathname}${search}` },
      response,
    );
  }

  if (isLegacyProtected && !hasLegacySession) {
    return redirectWithCookies(
      request,
      "/login",
      { redirect: `${pathname}${search}` },
      response,
    );
  }

  if (AUTH_ONLY_ROUTES.includes(pathname) && (hasUser || hasLegacySession)) {
    return redirectWithCookies(request, "/account", {}, response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
