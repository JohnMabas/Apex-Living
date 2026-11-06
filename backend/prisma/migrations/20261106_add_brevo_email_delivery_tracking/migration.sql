-- Brevo transactional email delivery tracking. Additive only.
CREATE TYPE "EmailDeliveryStatus" AS ENUM (
  'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'RETRY_PENDING', 'BOUNCED'
);

ALTER TABLE "email_deliveries"
  ADD COLUMN "bookingId" TEXT,
  ADD COLUMN "providerMessageId" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN "payload" JSONB;

ALTER TABLE "email_deliveries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "email_deliveries"
  ALTER COLUMN "status" TYPE "EmailDeliveryStatus"
  USING "status"::"EmailDeliveryStatus";
ALTER TABLE "email_deliveries" ALTER COLUMN "status" SET DEFAULT 'QUEUED';

UPDATE "email_deliveries"
SET "idempotencyKey" = 'legacy-' || "id"
WHERE "idempotencyKey" IS NULL;

UPDATE "email_deliveries"
SET "payload" = '{}'::jsonb
WHERE "payload" IS NULL;

ALTER TABLE "email_deliveries"
  ALTER COLUMN "idempotencyKey" SET NOT NULL;

ALTER TABLE "email_deliveries"
  ALTER COLUMN "payload" SET NOT NULL;

CREATE UNIQUE INDEX "email_deliveries_providerMessageId_key" ON "email_deliveries"("providerMessageId");
CREATE UNIQUE INDEX "email_deliveries_idempotencyKey_key" ON "email_deliveries"("idempotencyKey");
CREATE INDEX "email_deliveries_bookingId_idx" ON "email_deliveries"("bookingId");
CREATE INDEX "email_deliveries_nextRetryAt_idx" ON "email_deliveries"("nextRetryAt");

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "email_webhook_events" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'brevo',
  "eventId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "deliveryId" TEXT,
  "payload" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_webhook_events_eventId_key" ON "email_webhook_events"("eventId");
CREATE INDEX "email_webhook_events_deliveryId_idx" ON "email_webhook_events"("deliveryId");
CREATE INDEX "email_webhook_events_processed_idx" ON "email_webhook_events"("processed");
ALTER TABLE "email_webhook_events"
  ADD CONSTRAINT "email_webhook_events_deliveryId_fkey"
  FOREIGN KEY ("deliveryId") REFERENCES "email_deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
