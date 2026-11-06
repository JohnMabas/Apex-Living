import assert from "node:assert/strict";
import { app } from "../src/app.js";
import { AppError } from "../src/middleware/errorHandler.js";
import {
  assertBookingAccess,
  BOOKING_ACCESS_TOKEN_TTL_DAYS,
  buildBookingManagementUrl,
  generateBookingAccessToken,
  hashBookingAccessToken,
} from "../src/utils/bookingAccessToken.js";
import { buildReceiptPdf } from "../src/utils/pdf.js";
import { createGuestBookingSchema } from "../src/validators/bookingValidators.js";

function dateOffset(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

function validGuestInput() {
  return {
    apartmentId: "apt_123",
    checkIn: dateOffset(2),
    checkOut: dateOffset(4),
    numberOfGuests: 2,
    firstName: "Ada",
    lastName: "Okafor",
    email: "ADA@example.com",
    phone: "+234 800 000 0000",
    country: "Nigeria",
    specialRequests: "High floor if possible",
    arrivalTime: "3:00 PM",
    additionalNotes: "",
    acceptTerms: true,
  };
}

function expectAppError(fn: () => void, statusCode: number): void {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, statusCode);
    return;
  }
  assert.fail("Expected an AppError to be thrown.");
}

async function testValidation(): Promise<void> {
  const parsed = createGuestBookingSchema.safeParse(validGuestInput());
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.email, "ada@example.com");
  }

  const noTerms = createGuestBookingSchema.safeParse({
    ...validGuestInput(),
    acceptTerms: false,
  });
  assert.equal(noTerms.success, false);

  const pastDate = createGuestBookingSchema.safeParse({
    ...validGuestInput(),
    checkIn: dateOffset(-3),
    checkOut: dateOffset(-1),
  });
  assert.equal(pastDate.success, false);

  const badPhone = createGuestBookingSchema.safeParse({
    ...validGuestInput(),
    phone: "call me",
  });
  assert.equal(badPhone.success, false);

  const invalidEmail = createGuestBookingSchema.safeParse({
    ...validGuestInput(),
    email: "not-an-email",
  });
  assert.equal(invalidEmail.success, false);

  console.info("Guest booking validation tests passed.");
}

function testAccessTokens(): void {
  const token = generateBookingAccessToken();
  assert.ok(token.length >= 40);
  assert.notEqual(token, generateBookingAccessToken());

  const hash = hashBookingAccessToken(token);
  assert.equal(hash.length, 64);
  assert.notEqual(hash, token);

  const record = {
    bookingAccessTokenHash: hash,
    bookingAccessTokenExpiresAt: new Date(
      Date.now() + BOOKING_ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    ),
    bookingAccessTokenRevokedAt: null,
  };

  assert.doesNotThrow(() => assertBookingAccess(record, token));
  expectAppError(() => assertBookingAccess(record, null), 401);
  expectAppError(() => assertBookingAccess(record, "wrong-token"), 401);
  expectAppError(
    () =>
      assertBookingAccess(
        {
          ...record,
          bookingAccessTokenExpiresAt: new Date(Date.now() - 1000),
        },
        token,
      ),
    401,
  );
  expectAppError(
    () =>
      assertBookingAccess(
        { ...record, bookingAccessTokenRevokedAt: new Date() },
        token,
      ),
    401,
  );
  expectAppError(
    () =>
      assertBookingAccess(
        { ...record, bookingAccessTokenHash: null },
        token,
      ),
    404,
  );

  const url = buildBookingManagementUrl(
    "https://nestora.example/",
    "NEST-ABC123",
    token,
  );
  assert.equal(
    url,
    `https://nestora.example/bookings/manage/NEST-ABC123?token=${encodeURIComponent(
      token,
    )}`,
  );

  console.info("Booking access token tests passed.");
}

function testReceiptPdf(): void {
  const pdf = buildReceiptPdf({
    guestName: "Ada Okafor",
    bookingReference: "NEST-ABC123",
    paymentReference: "PAY-123456",
    apartmentTitle: "The Palm Suite",
    apartmentLocation: "Lekki, Lagos",
    checkIn: "2026-12-01",
    checkOut: "2026-12-04",
    numberOfGuests: 2,
    numberOfNights: 3,
    nightlyPrice: 50000,
    cleaningFee: 5000,
    additionalFees: null,
    totalAmount: 155000,
    currency: "NGN",
    paidAt: "2026-11-07",
  });

  const text = pdf.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.includes("NEST-ABC123"));
  assert.ok(text.includes("PAY-123456"));
  assert.ok(text.includes("155,000"));
  assert.ok(text.trimEnd().endsWith("%%EOF"));

  console.info("PDF receipt generation tests passed.");
}

async function testPublicRouteValidation(): Promise<void> {
  const server = app.listen(0);
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/bookings/guest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      },
    );

    assert.equal(response.status, 400);
    const body = (await response.json()) as {
      status: string;
      message: string;
    };
    assert.equal(body.status, "error");
    assert.ok(body.message.length > 0);

    console.info("Public guest booking route validation test passed.");
  } finally {
    server.close();
  }
}

async function run(): Promise<void> {
  await testValidation();
  testAccessTokens();
  testReceiptPdf();
  await testPublicRouteValidation();
}

void run();
