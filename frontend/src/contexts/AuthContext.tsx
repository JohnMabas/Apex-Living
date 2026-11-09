"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/types";
import * as authService from "@/services/authService";
import {
  signOutSupabase,
  syncSupabaseAccount,
} from "@/services/supabaseAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  LoginPayload,
  RegisterPayload,
} from "@/services/authService";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  /** The currently authenticated user, or null if not logged in. */
  user: AuthUser | null;
  /** True while the initial auth check is running (server-side cookie hydration). */
  loading: boolean;
  /** Call after a successful login to update state. */
  loginUser: (payload: LoginPayload) => Promise<AuthUser>;
  /** Call after a successful register to update state. */
  registerUser: (payload: RegisterPayload) => Promise<AuthUser>;
  /** Log out and clear local state. */
  logoutUser: () => Promise<void>;
  /** Update the in-memory user after a profile change. */
  updateUser: (user: AuthUser) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: prefer a verified Supabase session, then fall back to the
  // legacy HTTP-only Nestora cookie used by hosts and admins.
  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        if (isSupabaseConfigured()) {
          const supabase = getSupabaseBrowserClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            const synced = await syncSupabaseAccount();
            if (active) setUser(synced);
            return;
          }
        }

        const legacyUser = await authService.getMe();
        if (active) setUser(legacyUser);
      } catch {
        const legacyUser = await authService.getMe().catch(() => null);
        if (active) setUser(legacyUser);
      } finally {
        if (active) setLoading(false);
      }
    }

    void hydrate();

    const subscription = isSupabaseConfigured()
      ? getSupabaseBrowserClient().auth.onAuthStateChange((event) => {
          if (event === "SIGNED_OUT") {
            void authService.getMe().then((legacyUser) => {
              if (active) setUser(legacyUser);
            });
          }
        }).data.subscription
      : null;

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const loginUser = useCallback(async (payload: LoginPayload): Promise<AuthUser> => {
    const loggedIn = await authService.login(payload);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const registerUser = useCallback(
    async (payload: RegisterPayload): Promise<AuthUser> => {
      const registered = await authService.register(payload);
      setUser(registered);
      return registered;
    },
    [],
  );

  const logoutUser = useCallback(async (): Promise<void> => {
    await Promise.allSettled([signOutSupabase(), authService.logout()]);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: AuthUser): void => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, loginUser, registerUser, logoutUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}
