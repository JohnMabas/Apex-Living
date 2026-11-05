import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "../validators/authValidators.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SafeUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  user: SafeUser;
  token: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRES_MINUTES = 60; // 1 hour

/** Strip the password hash and reset fields before returning to client. */
function toSafeUser(user: {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Issue a signed JWT for the user. */
function signToken(userId: string, role: Role, rememberMe = false): string {
  const expiresIn = rememberMe ? "30d" : env.JWT_EXPIRES_IN;
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn,
  } as jwt.SignOptions);
}

/** Normalise an email-or-phone identifier for lookup. */
function parseIdentifier(
  raw: string,
): { email: string } | { phone: string } {
  const cleaned = raw.trim();
  if (cleaned.includes("@")) {
    return { email: cleaned.toLowerCase() };
  }
  // Everything else is treated as a phone number
  return { phone: cleaned };
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export async function registerUser(input: RegisterInput): Promise<AuthPayload> {
  const { fullName, email, phone, password } = input;

  // Check for duplicate email
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(
        "An account with this email address already exists.",
        409,
      );
    }
  }

  // Check for duplicate phone
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new AppError(
        "An account with this phone number already exists.",
        409,
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      fullName,
      email: email ?? null,
      phone: phone ?? null,
      passwordHash,
    },
  });

  const token = signToken(user.id, user.role);

  return { user: toSafeUser(user), token };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginUser(input: LoginInput): Promise<AuthPayload> {
  const lookup = parseIdentifier(input.emailOrPhone);

  const user = await prisma.user.findUnique({ where: lookup });

  // Use a generic error to avoid leaking whether the account exists
  const INVALID_CREDENTIALS = new AppError("Invalid email/phone or password.", 401);

  if (!user) throw INVALID_CREDENTIALS;

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) throw INVALID_CREDENTIALS;

  const token = signToken(user.id, user.role, input.rememberMe);

  return { user: toSafeUser(user), token };
}

// ---------------------------------------------------------------------------
// Get current user
// ---------------------------------------------------------------------------

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found.", 404);
  return toSafeUser(user);
}

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

export interface ForgotPasswordResult {
  /** The raw token to embed in the reset link — only available when there is
   *  no email/SMS provider configured (development only). */
  devToken?: string;
}

export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResult> {
  const lookup = parseIdentifier(input.emailOrPhone);

  // Always return success — do not leak whether the account exists
  const user = await prisma.user.findUnique({ where: lookup });
  if (!user) return {};

  // Generate a cryptographically secure random token
  const rawToken = randomBytes(32).toString("hex");
  const expires = new Date(
    Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: rawToken,
      passwordResetExpires: expires,
    },
  });

  // TODO (Phase 3 — email provider not configured):
  // Send an email containing the reset link:
  //   ${FRONTEND_URL}/reset-password?token=${rawToken}
  // Until a provider (e.g. Resend, SendGrid) is wired up, the token is
  // returned only in development so developers can test the flow.

  if (env.NODE_ENV !== "production") {
    return { devToken: rawToken };
  }

  return {};
}

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: input.token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(
      "This password reset link is invalid or has expired. Please request a new one.",
      400,
    );
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      // Invalidate the token immediately (single-use)
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}

// ---------------------------------------------------------------------------
// Update profile
// ---------------------------------------------------------------------------

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<SafeUser> {
  // Check for duplicate email if being updated
  if (input.email) {
    const existing = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: userId } },
    });
    if (existing) {
      throw new AppError(
        "An account with this email address already exists.",
        409,
      );
    }
  }

  // Check for duplicate phone if being updated
  if (input.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: input.phone, NOT: { id: userId } },
    });
    if (existing) {
      throw new AppError(
        "An account with this phone number already exists.",
        409,
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName && { fullName: input.fullName }),
      ...(input.email && { email: input.email }),
      ...(input.phone && { phone: input.phone }),
    },
  });

  return toSafeUser(updated);
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found.", 404);

  const currentMatches = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );
  if (!currentMatches) {
    throw new AppError("Current password is incorrect.", 401);
  }

  const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
}
