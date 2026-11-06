import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { Request } from "express";
import { AppError } from "../middleware/errorHandler.js";

/** How long a guest booking management link remains valid. */
export const BOOKING_ACCESS_TOKEN_TTL_DAYS = 30;

/** Generate a cryptographically secure, URL-safe booking access token. */
export function generateBookingAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash a raw access token before it is stored in the database. */
export function hashBookingAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time comparison of a raw token with a stored hash. */
export function bookingTokenMatches(token: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashBookingAccessToken(token), "utf8");
  const expected = Buffer.from(storedHash, "utf8");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/** Read a guest booking token from the request (header preferred). */
export function extractBookingAccessToken(req: Request): string | null {
  const headerToken = req.header("x-booking-token");
  if (headerToken?.trim()) return headerToken.trim();

  const authHeader = req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }

  const queryToken = req.query.token;
  if (typeof queryToken === "string" && queryToken.trim()) {
    return queryToken.trim();
  }

  return null;
}

export interface BookingAccessRecord {
  bookingAccessTokenHash: string | null;
  bookingAccessTokenExpiresAt: Date | null;
  bookingAccessTokenRevokedAt: Date | null;
}

/**
 * Throw when a guest booking access token is missing, invalid, expired or
 * revoked. Deliberately returns the same 404-style message for every failure
 * so tokens cannot be probed.
 */
export function assertBookingAccess(
  booking: BookingAccessRecord,
  token: string | null,
): void {
  if (!token) {
    throw new AppError("A valid booking access token is required.", 401);
  }

  if (!booking.bookingAccessTokenHash) {
    throw new AppError("This booking does not have an active access link.", 404);
  }

  if (
    booking.bookingAccessTokenRevokedAt ||
    !booking.bookingAccessTokenExpiresAt ||
    booking.bookingAccessTokenExpiresAt < new Date()
  ) {
    throw new AppError(
      "This booking access link has expired. Please contact support for a new link.",
      401,
    );
  }

  if (!bookingTokenMatches(token, booking.bookingAccessTokenHash)) {
    throw new AppError("Invalid booking access token.", 401);
  }
}

/** Build the customer-facing secure booking management URL. */
export function buildBookingManagementUrl(
  frontendUrl: string,
  bookingReference: string,
  token: string,
): string {
  const base = frontendUrl.replace(/\/$/, "");
  return `${base}/bookings/manage/${encodeURIComponent(bookingReference)}?token=${encodeURIComponent(token)}`;
}
