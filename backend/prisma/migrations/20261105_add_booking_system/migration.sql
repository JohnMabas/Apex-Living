-- Phase 5: Booking and Reservation System
-- Safe additive migration — does not alter or drop existing tables

-- ---------------------------------------------------------------------------
-- BookingStatus enum
-- ---------------------------------------------------------------------------

CREATE TYPE "BookingStatus" AS ENUM (
  'PENDING',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
  'DECLINED'
);

-- ---------------------------------------------------------------------------
-- bookings table
-- ---------------------------------------------------------------------------

CREATE TABLE "bookings" (
    "id"                      TEXT NOT NULL,
    "bookingReference"        TEXT NOT NULL,
    "guestId"                 TEXT NOT NULL,
    "apartmentId"             TEXT NOT NULL,
    "status"                  "BookingStatus" NOT NULL DEFAULT 'PENDING',

    -- Stay details
    "checkIn"                 TIMESTAMP(3) NOT NULL,
    "checkOut"                TIMESTAMP(3) NOT NULL,
    "numberOfGuests"          INTEGER NOT NULL,
    "numberOfNights"          INTEGER NOT NULL,

    -- Price snapshot (immutable)
    "nightlyPriceSnapshot"    DECIMAL(12, 2) NOT NULL,
    "accommodationSubtotal"   DECIMAL(12, 2) NOT NULL,
    "cleaningFeeSnapshot"     DECIMAL(12, 2),
    "additionalFeesSnapshot"  DECIMAL(12, 2),
    "totalAmount"             DECIMAL(12, 2) NOT NULL,
    "currency"                TEXT NOT NULL DEFAULT 'NGN',

    -- Expiry for PENDING bookings
    "expiresAt"               TIMESTAMP(3),

    -- Cancellation / decline
    "cancellationReason"      TEXT,
    "cancelledAt"             TIMESTAMP(3),
    "cancelledById"           TEXT,

    -- Admin notes
    "adminNotes"              TEXT,

    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- booking_status_history table
-- ---------------------------------------------------------------------------

CREATE TABLE "booking_status_history" (
    "id"          TEXT NOT NULL,
    "bookingId"   TEXT NOT NULL,
    "status"      "BookingStatus" NOT NULL,
    "note"        TEXT,
    "changedById" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Unique constraints
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX "bookings_bookingReference_key"
    ON "bookings"("bookingReference");

-- ---------------------------------------------------------------------------
-- Indexes for efficient query patterns
-- ---------------------------------------------------------------------------

CREATE INDEX "bookings_guestId_idx"          ON "bookings"("guestId");
CREATE INDEX "bookings_apartmentId_idx"       ON "bookings"("apartmentId");
CREATE INDEX "bookings_status_idx"            ON "bookings"("status");
CREATE INDEX "bookings_checkIn_idx"           ON "bookings"("checkIn");
CREATE INDEX "bookings_checkOut_idx"          ON "bookings"("checkOut");
CREATE INDEX "bookings_bookingReference_idx"  ON "bookings"("bookingReference");

CREATE INDEX "booking_status_history_bookingId_idx"
    ON "booking_status_history"("bookingId");

-- ---------------------------------------------------------------------------
-- Foreign keys
-- ---------------------------------------------------------------------------

ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_guestId_fkey"
    FOREIGN KEY ("guestId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_apartmentId_fkey"
    FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_status_history"
    ADD CONSTRAINT "booking_status_history_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_status_history"
    ADD CONSTRAINT "booking_status_history_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
