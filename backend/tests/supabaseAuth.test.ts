import assert from "node:assert/strict";
import type { User } from "@prisma/client";
import { AppError } from "../src/middleware/errorHandler.js";
import { toSafeUser } from "../src/services/authService.js";
import {
  extractSupabaseIdentity,
  normalizeEmail,
  splitFullName,
} from "../src/services/supabaseAuthService.js";
import { createBookingSchema } from "../src/validators/bookingValidators.js";

function dateOffset(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

function testIdentityParsing(): void {
  const identity = extractSupabaseIdentity({
    id: "sb_user_123",
    email: " ADA@Example.COM ",
    email_confirmed_at: "2026-11-09T10:00:00Z",
    user_metadata: {
      full_name: "Adaeze Ngozi Okafor",
      avatar_url: "https://lh3.googleusercontent.com/avatar.png",
    },
  });

  assert.equal(identity.supabaseUserId, "sb_user_123");
  assert.equal(identity.email, "ada@example.com");
  assert.equal(identity.fullName, "Adaeze Ngozi Okafor");
  assert.equal(identity.firstName, "Adaeze");
  assert.equal(identity.lastName, "Ngozi Okafor");
  assert.equal(identity.emailVerified, true);
  assert.equal(
    identity.avatarUrl,
    "https://lh3.googleusercontent.com/avatar.png",
  );

  assert.equal(normalizeEmail("  Guest@Nestora.COM "), "guest@nestora.com");
  assert.deepEqual(splitFullName("Madonna"), {
    firstName: "Madonna",
    lastName: null,
  });

  try {
    extractSupabaseIdentity({
      id: "sb_user_no_email",
      email: null,
      user_metadata: {},
    });
    assert.fail("Expected an AppError for a missing email.");
  } catch (error) {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 400);
  }
}

function testSafeUserMapping(): void {
  const user = {
    id: "user_1",
    fullName: "Ada Okafor",
    firstName: "Ada",
    lastName: "Okafor",
    email: "ada@example.com",
    phone: null,
    country: "Nigeria",
    avatarUrl: null,
    passwordHash: null,
    supabaseUserId: "sb_user_123",
    role: "CUSTOMER",
    isEmailVerified: true,
    isPhoneVerified: false,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  } satisfies User;

  const safe = toSafeUser(user);
  assert.equal(safe.hasPassword, false);
  assert.equal(safe.isGoogleLinked, true);
  assert.equal(safe.country, "Nigeria");
  assert.equal("passwordHash" in safe, false);
}

function testAuthenticatedBookingValidation(): void {
  const valid = {
    apartmentId: "apt_123",
    checkIn: dateOffset(2),
    checkOut: dateOffset(4),
    numberOfGuests: 2,
    phone: "+234 800 000 0000",
    country: "Nigeria",
    specialRequests: "High floor if possible",
    arrivalTime: "3:00 PM",
    additionalNotes: "",
    acceptTerms: true,
  };

  assert.equal(createBookingSchema.safeParse(valid).success, true);
  assert.equal(
    createBookingSchema.safeParse({ ...valid, acceptTerms: false }).success,
    false,
  );
  assert.equal(
    createBookingSchema.safeParse({ ...valid, phone: "call me" }).success,
    false,
  );
  assert.equal(
    createBookingSchema.safeParse({ ...valid, country: "" }).success,
    false,
  );
}

testIdentityParsing();
testSafeUserMapping();
testAuthenticatedBookingValidation();
console.info("Supabase authentication tests passed.");
