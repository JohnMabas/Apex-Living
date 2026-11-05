import type { AuthUser } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

// ---------------------------------------------------------------------------
// Base fetch helper
// ---------------------------------------------------------------------------

interface ApiError extends Error {
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Send HTTP-only cookies on every request
    ...options,
  });

  const body = await response.json().catch(() => ({})) as Record<string, unknown>;

  if (!response.ok) {
    const err = new Error(
      (body.message as string) ?? "Something went wrong.",
    ) as ApiError;
    err.statusCode = response.status;
    if (body.errors) {
      err.fieldErrors = body.errors as Record<string, string[]>;
    }
    throw err;
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Auth API calls
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordPayload {
  emailOrPhone: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Register
export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const body = await apiFetch<{ data: { user: AuthUser } }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.data.user;
}

// Login
export async function login(payload: LoginPayload): Promise<AuthUser> {
  const body = await apiFetch<{ data: { user: AuthUser } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.data.user;
}

// Logout
export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

// Get current user (returns null if not authenticated — does not throw on 401)
export async function getMe(): Promise<AuthUser | null> {
  try {
    const body = await apiFetch<{ data: { user: AuthUser } }>("/auth/me");
    return body.data.user;
  } catch {
    return null;
  }
}

// Forgot password
export async function forgotPassword(
  payload: ForgotPasswordPayload,
): Promise<{ message: string; devToken?: string }> {
  const body = await apiFetch<{ message: string; devToken?: string }>(
    "/auth/forgot-password",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return body;
}

// Reset password
export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<void> {
  await apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Update profile
export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  const body = await apiFetch<{ data: { user: AuthUser } }>(
    "/users/profile",
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return body.data.user;
}

// Change password
export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  await apiFetch("/users/change-password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
