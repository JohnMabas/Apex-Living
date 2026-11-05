import { type NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Protected routes — unauthenticated users are redirected to /login
// ---------------------------------------------------------------------------

const PROTECTED_PREFIXES = ["/account", "/dashboard"];

// Routes that logged-in users shouldn't need to visit
const AUTH_ONLY_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route needs authentication
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // The HTTP-only auth cookie set by the backend
  const authCookie = request.cookies.get("nestora_token");
  const isAuthenticated = Boolean(authCookie?.value);

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optional: redirect already-logged-in users away from login/register
  // (useful UX, but not a security requirement)
  if (AUTH_ONLY_ROUTES.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
