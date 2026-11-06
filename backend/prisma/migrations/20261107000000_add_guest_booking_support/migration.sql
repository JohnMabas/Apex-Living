-- Guest booking support
-- Additive, data-preserving migration. Existing bookings and payments remain intact.

-- ---------------------------------------------------------------------------
-- bookings: allow bookings without a registered customer account
-- ---------------------------------------------------------------------------

ALTER TABLE "bookings" ALTER COLUMN "guestId" DROP NOT NULL;

ALTER TABLE "bookings"
  ADD COLUMN "guestFirstName" TEXT,
  ADD COLUMN "guestLastName" TEXT,
  ADD COLUMN "guestEmail" TEXT,
  ADD COLUMN "guestPhone" TEXT,
  ADD COLUMN "guestCountry" TEXT,
  ADD COLUMN "specialRequests" TEXT,
  ADD COLUMN "arrivalTime" TEXT,
  ADD COLUMN "additionalNotes" TEXT,
  ADD COLUMN "bookingAccessTokenHash" TEXT,
  ADD COLUMN "bookingAccessTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "bookingAccessTokenRevokedAt" TIMESTAMP(3),
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

CREATE INDEX "bookings_guestEmail_idx" ON "bookings"("guestEmail");
CREATE INDEX "bookings_bookingAccessTokenHash_idx" ON "bookings"("bookingAccessTokenHash");

-- Preserve the traveller's details for legacy account bookings so hosts and
-- admins continue to see the same information in a single place.
UPDATE "bookings" b
SET
  "guestFirstName" = split_part(u."fullName", ' ', 1),
  "guestLastName" = CASE
    WHEN position(' ' in u."fullName") > 0
      THEN substring(u."fullName" from position(' ' in u."fullName") + 1)
    ELSE NULL
  END,
  "guestEmail" = u."email",
  "guestPhone" = u."phone"
FROM "users" u
WHERE b."guestId" = u."id";

-- Existing bookings are account-bound. Only change the delete behaviour so
-- deleting an account does not delete its booking history.
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_guestId_fkey";
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_guestId_fkey"
  FOREIGN KEY ("guestId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- payments: allow guest payments without a registered user
-- ---------------------------------------------------------------------------

ALTER TABLE "payments" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
