import { Prisma, type User } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SupabaseIdentity {
  supabaseUserId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
}

interface SupabaseUserResponse {
  id?: unknown;
  email?: unknown;
  email_confirmed_at?: unknown;
  confirmed_at?: unknown;
  phone?: unknown;
  user_metadata?: Record<string, unknown> | null;
}

const ACCOUNT_LINK_REQUIRED =
  "An existing Nestora account already uses this email address. Please sign in with your existing account and link Google from your account settings.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function splitFullName(fullName: string): {
  firstName: string | null;
  lastName: string | null;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Nestora Guest";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Parse the verified Supabase user payload into the fields Nestora needs. */
export function extractSupabaseIdentity(raw: unknown): SupabaseIdentity {
  if (!raw || typeof raw !== "object") {
    throw new AppError("Supabase did not return a user profile.", 401);
  }

  const user = raw as SupabaseUserResponse;
  const supabaseUserId = cleanString(user.id);
  if (!supabaseUserId) {
    throw new AppError("Supabase did not return a valid user identity.", 401);
  }

  const rawEmail = cleanString(user.email);
  if (!rawEmail) {
    throw new AppError(
      "Your Google account did not provide an email address. Nestora needs a verified email to confirm bookings.",
      400,
    );
  }
  const email = normalizeEmail(rawEmail);

  const metadata = user.user_metadata ?? {};
  const givenName = cleanString(metadata.given_name);
  const familyName = cleanString(metadata.family_name);
  const metadataName =
    cleanString(metadata.full_name) ?? cleanString(metadata.name);

  const derived = metadataName
    ? splitFullName(metadataName)
    : {
        firstName: givenName,
        lastName: familyName,
      };

  const fullName =
    metadataName ??
    [givenName, familyName].filter(Boolean).join(" ").trim() ??
    "";

  const resolvedFullName = fullName || nameFromEmail(email);
  const names = metadataName
    ? derived
    : {
        firstName: givenName ?? splitFullName(resolvedFullName).firstName,
        lastName: familyName ?? splitFullName(resolvedFullName).lastName,
      };

  const emailVerified = Boolean(
    cleanString(user.email_confirmed_at) ??
      cleanString(user.confirmed_at) ??
      metadata.email_verified === true,
  );

  return {
    supabaseUserId,
    email,
    emailVerified,
    fullName: resolvedFullName,
    firstName: names.firstName,
    lastName: names.lastName,
    avatarUrl:
      cleanString(metadata.avatar_url) ?? cleanString(metadata.picture),
    phone: cleanString(user.phone),
  };
}

// ---------------------------------------------------------------------------
// Token verification
// ---------------------------------------------------------------------------

/**
 * Verify a Supabase access token directly with Supabase Auth. This confirms the
 * token is valid, unexpired and belongs to the returned user identity.
 */
export async function verifySupabaseAccessToken(
  accessToken: string,
): Promise<SupabaseIdentity> {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    throw new AppError(
      "Supabase authentication is not configured on the server.",
      503,
    );
  }

  const baseUrl = env.SUPABASE_URL.replace(/\/$/, "");

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new AppError(
      "We could not verify your session with Supabase. Please try again.",
      502,
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new AppError(
      "Your session is invalid or has expired. Please sign in again.",
      401,
    );
  }

  if (!response.ok) {
    throw new AppError(
      "We could not verify your Supabase session. Please try again.",
      502,
    );
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  return extractSupabaseIdentity(payload);
}

// ---------------------------------------------------------------------------
// Profile synchronisation
// ---------------------------------------------------------------------------

async function emailOwnedByAnotherUser(
  email: string,
  userId?: string,
): Promise<User | null> {
  return prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      ...(userId ? { NOT: { id: userId } } : {}),
    },
  });
}

/**
 * Find or create the Nestora customer record for a verified Supabase identity.
 * The Supabase user ID is the stable identity key, so repeat sign-ins never
 * create duplicate customers.
 */
export async function syncCustomerFromSupabase(
  identity: SupabaseIdentity,
): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { supabaseUserId: identity.supabaseUserId },
  });

  if (existing) {
    const update: Prisma.UserUpdateInput = {};

    // Only fill fields the customer has not provided or edited themselves.
    // Google profile data must never overwrite Nestora profile changes.
    if (!existing.firstName && identity.firstName) {
      update.firstName = identity.firstName;
    }
    if (!existing.lastName && identity.lastName) {
      update.lastName = identity.lastName;
    }
    if (!existing.avatarUrl && identity.avatarUrl) {
      update.avatarUrl = identity.avatarUrl;
    }
    if (!existing.phone && identity.phone) {
      update.phone = identity.phone;
    }
    if (identity.emailVerified && !existing.isEmailVerified) {
      update.isEmailVerified = true;
    }

    const emailOwner = await emailOwnedByAnotherUser(
      identity.email,
      existing.id,
    );
    if (!emailOwner && existing.email !== identity.email) {
      update.email = identity.email;
    }

    if (Object.keys(update).length === 0) return existing;
    return prisma.user.update({ where: { id: existing.id }, data: update });
  }

  const emailOwner = await emailOwnedByAnotherUser(identity.email);
  if (emailOwner) {
    if (emailOwner.supabaseUserId === identity.supabaseUserId) {
      return emailOwner;
    }
    throw new AppError(ACCOUNT_LINK_REQUIRED, 409);
  }

  try {
    return await prisma.user.create({
      data: {
        fullName: identity.fullName,
        firstName: identity.firstName,
        lastName: identity.lastName,
        email: identity.email,
        phone: identity.phone,
        avatarUrl: identity.avatarUrl,
        passwordHash: null,
        supabaseUserId: identity.supabaseUserId,
        role: "CUSTOMER",
        isEmailVerified: identity.emailVerified,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await prisma.user.findUnique({
        where: { supabaseUserId: identity.supabaseUserId },
      });
      if (raced) return raced;
      throw new AppError(ACCOUNT_LINK_REQUIRED, 409);
    }
    throw error;
  }
}

/**
 * Securely link a Supabase identity to an existing password account. The caller
 * must already be authenticated with the legacy Nestora session, and the
 * verified Google email must match the existing account email.
 */
export async function linkSupabaseAccount(
  userId: string,
  accessToken: string,
): Promise<User> {
  const identity = await verifySupabaseAccessToken(accessToken);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found.", 404);

  if (user.supabaseUserId === identity.supabaseUserId) {
    return user;
  }
  if (user.supabaseUserId) {
    throw new AppError(
      "This account is already linked to a different Google identity.",
      409,
    );
  }

  if (!user.email || normalizeEmail(user.email) !== identity.email) {
    throw new AppError(
      "The Google account email does not match your Nestora account email. Account linking was rejected.",
      403,
    );
  }

  const identityOwner = await prisma.user.findUnique({
    where: { supabaseUserId: identity.supabaseUserId },
  });
  if (identityOwner && identityOwner.id !== user.id) {
    throw new AppError(
      "This Google identity is already linked to another Nestora account.",
      409,
    );
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      supabaseUserId: identity.supabaseUserId,
      firstName: user.firstName ?? identity.firstName,
      lastName: user.lastName ?? identity.lastName,
      avatarUrl: user.avatarUrl ?? identity.avatarUrl,
      isEmailVerified: true,
    },
  });
}
