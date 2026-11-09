import type { AuthUser } from "@/types";
import { apiFetch } from "./apiClient";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface GoogleSignInOptions {
  /** Safe relative path to return to after the OAuth callback. */
  next?: string;
  /** Link the Google identity to the currently signed-in legacy account. */
  link?: boolean;
}

function safeNextPath(next: string | undefined): string {
  if (!next) return "/account";
  if (!next.startsWith("/") || next.startsWith("//")) return "/account";
  if (next.startsWith("/auth/")) return "/account";
  return next;
}

export async function signInWithGoogle(
  options: GoogleSignInOptions = {},
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const params = new URLSearchParams({
    next: safeNextPath(options.next),
  });
  if (options.link) params.set("link", "1");

  const redirectTo = `${window.location.origin}/auth/callback?${params.toString()}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw new Error(error.message || "Could not start Google sign-in.");
  }
}

export async function signOutSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await getSupabaseBrowserClient().auth.signOut({ scope: "local" });
  } catch {
    // The backend logout still clears the legacy session.
  }
}

export async function syncSupabaseAccount(): Promise<AuthUser> {
  const body = await apiFetch<{ data: { user: AuthUser } }>(
    "/auth/supabase/sync",
    { method: "POST" },
  );
  return body.data.user;
}

export async function linkSupabaseAccount(
  accessToken: string,
): Promise<AuthUser> {
  const body = await apiFetch<{ data: { user: AuthUser } }>(
    "/auth/supabase/link",
    { method: "POST", body: { accessToken } },
  );
  return body.data.user;
}
