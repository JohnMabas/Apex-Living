import type { AuthUser } from "@/types";
import { apiFetch } from "./apiClient";

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
  country?: string;
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
    body: payload,
  });
  return body.data.user;
}

// Login
export async function login(payload: LoginPayload): Promise<AuthUser> {
  const body = await apiFetch<{ data: { user: AuthUser } }>("/auth/login", {
    method: "POST",
    body: payload,
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
    { method: "POST", body: payload },
  );
  return body;
}

// Reset password
export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<void> {
  await apiFetch("/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}

// Update profile
export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  const body = await apiFetch<{ data: { user: AuthUser } }>(
    "/users/profile",
    { method: "PATCH", body: payload },
  );
  return body.data.user;
}

// Change password
export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  await apiFetch("/users/change-password", {
    method: "PATCH",
    body: payload,
  });
}
