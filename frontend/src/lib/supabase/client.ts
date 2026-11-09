import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserClient | undefined;

export function getSupabaseBrowserClient(): BrowserClient {
  if (!browserClient) {
    const { url, publishableKey } = getSupabaseConfig();
    browserClient = createBrowserClient(url, publishableKey);
  }
  return browserClient;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}
