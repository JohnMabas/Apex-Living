-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'SUSPENDED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "apartments" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "pricePerNight" DECIMAL(12,2) NOT NULL,
    "cleaningFee" DECIMAL(12,2),
    "otherFees" DECIMAL(12,2),
    "otherFeesNote" TEXT,
    "checkInInfo" TEXT NOT NULL,
    "checkOutInfo" TEXT NOT NULL,
    "smokingPolicy" TEXT NOT NULL,
    "petPolicy" TEXT NOT NULL,
    "additionalRules" TEXT,
    "status" "ApartmentStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "hostId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartment_images" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apartment_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartment_amenities" (
    "apartmentId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "apartment_amenities_pkey" PRIMARY KEY ("apartmentId","amenityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "apartments_slug_key" ON "apartments"("slug");

-- CreateIndex
CREATE INDEX "apartments_hostId_idx" ON "apartments"("hostId");

-- CreateIndex
CREATE INDEX "apartments_status_idx" ON "apartments"("status");

-- CreateIndex
CREATE INDEX "apartments_city_idx" ON "apartments"("city");

-- CreateIndex
CREATE INDEX "apartments_pricePerNight_idx" ON "apartments"("pricePerNight");

-- CreateIndex
CREATE INDEX "apartment_images_apartmentId_idx" ON "apartment_images"("apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "amenities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_slug_key" ON "amenities"("slug");

-- CreateIndex
CREATE INDEX "apartment_amenities_amenityId_idx" ON "apartment_amenities"("amenityId");

-- AddForeignKey
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_images" ADD CONSTRAINT "apartment_images_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_amenities" ADD CONSTRAINT "apartment_amenities_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_amenities" ADD CONSTRAINT "apartment_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default amenities (idempotent, does not touch existing rows)
INSERT INTO "amenities" ("id", "name", "slug", "icon") VALUES
    ('amn_wifi', 'Wi-Fi', 'wifi', 'Wifi'),
    ('amn_air_conditioning', 'Air conditioning', 'air-conditioning', 'AirVent'),
    ('amn_kitchen', 'Kitchen', 'kitchen', 'UtensilsCrossed'),
    ('amn_swimming_pool', 'Swimming pool', 'swimming-pool', 'Waves'),
    ('amn_parking', 'Parking', 'parking', 'Car'),
    ('amn_television', 'Television', 'television', 'Tv'),
    ('amn_laundry', 'Laundry', 'laundry', 'WashingMachine'),
    ('amn_security', 'Security', 'security', 'ShieldCheck'),
    ('amn_generator', 'Generator', 'generator', 'Zap'),
    ('amn_workspace', 'Workspace', 'workspace', 'Laptop')
ON CONFLICT ("slug") DO NOTHING;
