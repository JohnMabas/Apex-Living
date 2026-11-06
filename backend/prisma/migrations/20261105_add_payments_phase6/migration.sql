-- Phase 6: Paystack Payment, Email Notifications, Refund Policy, Cookies and Privacy
-- Safe additive migration — does not alter or drop existing tables

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE "PaymentStatus" AS ENUM (
  'INITIALIZED', 'PENDING', 'SUCCESS', 'FAILED',
  'ABANDONED', 'REFUND_PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED'
);

CREATE TYPE "RefundStatus" AS ENUM (
  'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING',
  'COMPLETED', 'REJECTED', 'FAILED'
);

CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- ---------------------------------------------------------------------------
-- Add payments relation to bookings (no column change — just noted in schema)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------

CREATE TABLE "payments" (
  "id"                TEXT NOT NULL,
  "bookingId"         TEXT NOT NULL,
  "userId"            TEXT NOT NULL,
  "paymentReference"  TEXT NOT NULL,
  "paystackReference" TEXT,
  "amount"            DECIMAL(12,2) NOT NULL,
  "currency"          TEXT NOT NULL DEFAULT 'NGN',
  "status"            "PaymentStatus" NOT NULL DEFAULT 'INITIALIZED',
  "paymentMethod"     TEXT,
  "gatewayResponse"   TEXT,
  "paidAt"            TIMESTAMP(3),
  "failureReason"     TEXT,
  "metadata"          JSONB,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_paymentReference_key" ON "payments"("paymentReference");
CREATE INDEX "payments_bookingId_idx"          ON "payments"("bookingId");
CREATE INDEX "payments_userId_idx"             ON "payments"("userId");
CREATE INDEX "payments_status_idx"             ON "payments"("status");
CREATE INDEX "payments_paystackReference_idx"  ON "payments"("paystackReference");

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- webhook_events
-- ---------------------------------------------------------------------------

CREATE TABLE "webhook_events" (
  "id"          TEXT NOT NULL,
  "provider"    TEXT NOT NULL DEFAULT 'paystack',
  "eventId"     TEXT NOT NULL,
  "event"       TEXT NOT NULL,
  "payload"     JSONB NOT NULL,
  "processed"   BOOLEAN NOT NULL DEFAULT false,
  "error"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");
CREATE INDEX "webhook_events_processed_idx"    ON "webhook_events"("processed");

-- ---------------------------------------------------------------------------
-- refund_requests
-- ---------------------------------------------------------------------------

CREATE TABLE "refund_requests" (
  "id"               TEXT NOT NULL,
  "paymentId"        TEXT NOT NULL,
  "requestedById"    TEXT NOT NULL,
  "amount"           DECIMAL(12,2) NOT NULL,
  "reason"           TEXT NOT NULL,
  "status"           "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
  "adminNote"        TEXT,
  "paystackRefundRef" TEXT,
  "resolvedAt"       TIMESTAMP(3),
  "resolvedById"     TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "refund_requests_paymentId_idx" ON "refund_requests"("paymentId");
CREATE INDEX "refund_requests_status_idx"    ON "refund_requests"("status");

ALTER TABLE "refund_requests"
  ADD CONSTRAINT "refund_requests_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- email_deliveries
-- ---------------------------------------------------------------------------

CREATE TABLE "email_deliveries" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT,
  "paymentId"    TEXT,
  "templateName" TEXT NOT NULL,
  "recipient"    TEXT NOT NULL,
  "subject"      TEXT NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'QUEUED',
  "attempts"     INTEGER NOT NULL DEFAULT 0,
  "lastError"    TEXT,
  "sentAt"       TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_deliveries_userId_idx" ON "email_deliveries"("userId");
CREATE INDEX "email_deliveries_status_idx" ON "email_deliveries"("status");

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- email_preferences
-- ---------------------------------------------------------------------------

CREATE TABLE "email_preferences" (
  "id"                      TEXT NOT NULL,
  "userId"                  TEXT NOT NULL,
  "promotionalEmailsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "consentGivenAt"          TIMESTAMP(3),
  "unsubscribedAt"          TIMESTAMP(3),
  "consentSource"           TEXT,
  "unsubscribeToken"        TEXT NOT NULL,
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_preferences_userId_key"          ON "email_preferences"("userId");
CREATE UNIQUE INDEX "email_preferences_unsubscribeToken_key" ON "email_preferences"("unsubscribeToken");

ALTER TABLE "email_preferences"
  ADD CONSTRAINT "email_preferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- cookie_consents
-- ---------------------------------------------------------------------------

CREATE TABLE "cookie_consents" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT,
  "sessionToken"  TEXT,
  "necessary"     BOOLEAN NOT NULL DEFAULT true,
  "functional"    BOOLEAN NOT NULL DEFAULT false,
  "analytics"     BOOLEAN NOT NULL DEFAULT false,
  "marketing"     BOOLEAN NOT NULL DEFAULT false,
  "policyVersion" TEXT NOT NULL DEFAULT '1.0',
  "consentedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cookie_consents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cookie_consents_userId_idx"       ON "cookie_consents"("userId");
CREATE INDEX "cookie_consents_sessionToken_idx" ON "cookie_consents"("sessionToken");

ALTER TABLE "cookie_consents"
  ADD CONSTRAINT "cookie_consents_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- job_queue
-- ---------------------------------------------------------------------------

CREATE TABLE "job_queue" (
  "id"          TEXT NOT NULL,
  "jobType"     TEXT NOT NULL,
  "payload"     JSONB NOT NULL,
  "status"      "JobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts"    INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "runAt"       TIMESTAMP(3) NOT NULL,
  "lastError"   TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_queue_status_runAt_idx" ON "job_queue"("status", "runAt");
CREATE INDEX "job_queue_jobType_idx"      ON "job_queue"("jobType");
