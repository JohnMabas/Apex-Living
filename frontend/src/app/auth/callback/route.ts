import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

function safeNextPath(next: string | null): string {
  if (!next) return "/account";
  if (!next.startsWith("/") || next.startsWith("//")) return "/account";
  if (next.startsWith("/auth/")) return "/account";
  return next;
}

function redirectWithMessage(
  request: NextRequest,
  path: string,
  params: Record<string, string>,
): NextResponse {
  const url = new URL(path, request.nextUrl.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const linkMode = searchParams.get("link") === "1";
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");

  if (oauthError) {
    return redirectWithMessage(request, "/login", {
      redirect: next,
      error:
        oauthError === "access_denied"
          ? "Google sign-in was cancelled."
          : oauthDescription || "Google sign-in could not be completed.",
    });
  }

  if (!code) {
    return redirectWithMessage(request, "/login", {
      redirect: next,
      error: "Google sign-in did not return an authorization code.",
    });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session?.access_token) {
      return redirectWithMessage(request, "/login", {
        redirect: next,
        error: error?.message || "Your Google session could not be verified.",
      });
    }

    const accessToken = data.session.access_token;

    if (linkMode) {
      const cookieHeader = request.headers.get("cookie") ?? "";
      const response = await fetch(`${API_URL}/auth/supabase/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        body: JSON.stringify({ accessToken }),
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        await supabase.auth.signOut({ scope: "local" });
        return redirectWithMessage(request, "/account", {
          link_error: payload.message || "Google account linking failed.",
        });
      }

      return redirectWithMessage(request, next, { linked: "1" });
    }

    const response = await fetch(`${API_URL}/auth/supabase/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
    };

    if (!response.ok) {
      await supabase.auth.signOut({ scope: "local" });
      return redirectWithMessage(request, "/login", {
        redirect: next,
        error:
          payload.message ||
          "We could not create your Nestora customer profile. Please try again.",
      });
    }

    return redirectWithMessage(request, next, { welcome: "1" });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Google sign-in could not be completed.";
    return redirectWithMessage(request, "/login", {
      redirect: next,
      error: message,
    });
  }
}
