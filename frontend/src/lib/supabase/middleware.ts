import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./config";

export interface SupabaseSessionResult {
  response: NextResponse;
  hasUser: boolean;
}

/**
 * Refresh the Supabase auth cookies for the current request and report whether
 * a verified Supabase user is present. Never throws when Supabase is not yet
 * configured so the legacy host/admin flows keep working.
 */
export async function updateSupabaseSession(
  request: NextRequest,
): Promise<SupabaseSessionResult> {
  if (!isSupabaseConfigured()) {
    return { response: NextResponse.next({ request }), hasUser: false };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { response, hasUser: Boolean(user) };
  } catch {
    return { response, hasUser: false };
  }
}
