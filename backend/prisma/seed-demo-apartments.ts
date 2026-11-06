/**
 * Demo apartment seed script for Nestora.
 *
 * Creates 6 realistic demo apartments with amenities and images in
 * Aiven PostgreSQL. Idempotent — running it again will update existing
 * demo records rather than creating duplicates.
 *
 * Usage:
 *   ENABLE_DEMO_SEED=true npx tsx prisma/seed-demo-apartments.ts
 *
 * The script refuses to run unless ENABLE_DEMO_SEED is explicitly set
 * and NODE_ENV is not production.
 */

import { ApartmentStatus, PrismaClient, Role } from "@prisma/client";
import { config } from "dotenv";

config();

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Demo host — a single system user to own demo apartments
// ---------------------------------------------------------------------------

const DEMO_HOST_EMAIL = "demo.host@nestora.local";
const DEMO_HOST_NAME = "Nestora Demo Host";
const DEMO_HOST_PHONE = "+234 700 000 0000";
const DEMO_HOST_PASSWORD_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMy.MQD0K.vZG1k0b7Uy4U8r8D6Y4Q4Q4Q"; // bcrypt("DemoHost123!")

// ---------------------------------------------------------------------------
// Amenities — standard list used across demo apartments
// ---------------------------------------------------------------------------

const DEMO_AMENITIES = [
  { name: "Free Wi-Fi", slug: "free-wifi", icon: "wifi" },
  { name: "Air Conditioning", slug: "air-conditioning", icon: "wind" },
  { name: "Kitchen", slug: "kitchen", icon: "utensils" },
  { name: "Parking", slug: "parking", icon: "car" },
  { name: "Swimming Pool", slug: "swimming-pool", icon: "waves" },
  { name: "Gym", slug: "gym", icon: "dumbbell" },
  { name: "Security", slug: "security", icon: "shield" },
  { name: "Washing Machine", slug: "washing-machine", icon: "washing-machine" },
  { name: "Smart TV", slug: "smart-tv", icon: "tv" },
  { name: "Hot Water", slug: "hot-water", icon: "droplet" },
  { name: "Refrigerator", slug: "refrigerator", icon: "refrigerator" },
  { name: "Microwave", slug: "microwave", icon: "microwave" },
  { name: "Garden", slug: "garden", icon: "trees" },
  { name: "Generator", slug: "generator", icon: "zap" },
  { name: "Balcony", slug: "balcony", icon: "building" },
  { name: "Elevator", slug: "elevator", icon: "arrow-up-down" },
  { name: "Workspace", slug: "workspace", icon: "briefcase" },
  { name: "Fire Extinguisher", slug: "fire-extinguisher", icon: "flame" },
];

// ---------------------------------------------------------------------------
// Demo apartments — realistic Nigerian listings with Unsplash images
// ---------------------------------------------------------------------------

interface DemoApartmentInput {
  slug: string;
  title: string;
  description: string;
  propertyType: string;
  city: string;
  location: string;
  address: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  cleaningFee: number | null;
  otherFees: number | null;
  otherFeesNote: string | null;
  checkInInfo: string;
  checkOutInfo: string;
  smokingPolicy: string;
  petPolicy: string;
  additionalRules: string | null;
  amenitySlugs: string[];
  images: { url: string; altText: string }[];
  isFeatured: boolean;
}

const DEMO_APARTMENTS: DemoApartmentInput[] = [
  {
    slug: "lekki-skyline-penthouse",
    title: "Lekki Skyline Penthouse",
    description:
      "Experience luxury living in this stunning penthouse apartment overlooking the Lekki skyline. Floor-to-ceiling windows fill the open-plan living area with natural light, while the private balcony offers panoramic views of the lagoon. The fully equipped kitchen features modern appliances, and the master suite boasts an en-suite bathroom with a soaking tub. Located in a secure, gated estate with 24/7 security, this apartment is perfect for business travellers and families seeking a premium stay in Lagos.",
    propertyType: "Penthouse",
    city: "Lagos",
    location: "Lekki Phase 1",
    address: "Admiralty Way, Lekki Phase 1, Lagos",
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 3,
    pricePerNight: 85000,
    cleaningFee: 5000,
    otherFees: null,
    otherFeesNote: null,
    checkInInfo: "2:00 PM — 8:00 PM (flexible on request)",
    checkOutInfo: "11:00 AM",
    smokingPolicy: "No smoking",
    petPolicy: "No pets",
    additionalRules: "No parties or events. Quiet hours after 10 PM.",
    amenitySlugs: [
      "free-wifi", "air-conditioning", "kitchen", "parking", "security",
      "smart-tv", "hot-water", "refrigerator", "balcony", "elevator", "workspace",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0260?w=1200&q=80", altText: "Modern penthouse living room with city view" },
      { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80", altText: "Master bedroom with large bed" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80", altText: "Modern kitchen with appliances" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80", altText: "Luxury bathroom with soaking tub" },
    ],
    isFeatured: true,
  },
  {
    slug: "ikoyi-garden-apartment",
    title: "Ikoyi Garden Apartment",
    description:
      "A serene retreat in the heart of Ikoyi, this elegant apartment combines comfort with convenience. The spacious living area opens onto a private garden, perfect for morning coffee or evening relaxation. Recently renovated with contemporary finishes, the apartment features a chef's kitchen, two comfortable bedrooms, and two modern bathrooms. Walking distance to popular restaurants, cafes, and the Ikoyi Golf Club.",
    propertyType: "Apartment",
    city: "Lagos",
    location: "Ikoyi",
    address: "Bourdillon Road, Ikoyi, Lagos",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    pricePerNight: 55000,
    cleaningFee: 3000,
    otherFees: null,
    otherFeesNote: null,
    checkInInfo: "3:00 PM — 8:00 PM",
    checkOutInfo: "11:00 AM",
    smokingPolicy: "No smoking",
    petPolicy: "Pets on request",
    additionalRules: "No parties. Maximum 4 guests including visitors.",
    amenitySlugs: [
      "free-wifi", "air-conditioning", "kitchen", "parking", "security",
      "washing-machine", "smart-tv", "hot-water", "refrigerator", "garden", "workspace",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1493809842364-78817add727e?w=1200&q=80", altText: "Bright living room with garden view" },
      { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", altText: "Cozy bedroom with natural light" },
      { url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&q=80", altText: "Modern kitchen with breakfast bar" },
      { url: "https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=1200&q=80", altText: "Private garden terrace" },
    ],
    isFeatured: true,
  },
  {
    slug: "vi-waterfront-studio",
    title: "Victoria Island Waterfront Studio",
    description:
      "A sleek, modern studio in the heart of Victoria Island, perfect for solo travellers or couples. The open-plan design maximises space with a comfortable sleeping area, compact kitchenette, and a stylish bathroom. Large windows offer views of the waterfront and easy access to the VI business district. Ideal for short business trips or weekend getaways.",
    propertyType: "Studio",
    city: "Lagos",
    location: "Victoria Island",
    address: "Adeola Odeku Street, Victoria Island, Lagos",
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    pricePerNight: 35000,
    cleaningFee: 2000,
    otherFees: null,
    otherFeesNote: null,
    checkInInfo: "2:00 PM — 8:00 PM",
    checkOutInfo: "11:00 AM",
    smokingPolicy: "No smoking",
    petPolicy: "No pets",
    additionalRules: "No parties. Guests must be registered at check-in.",
    amenitySlugs: [
      "free-wifi", "air-conditioning", "parking", "security", "smart-tv",
      "hot-water", "refrigerator", "microwave", "elevator", "workspace",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d9e88e?w=1200&q=80", altText: "Modern studio with waterfront view" },
      { url: "https://images.unsplash.com/photo-1522771739844-2a723d3e35f9?w=1200&q=80", altText: "Compact kitchenette" },
      { url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80", altText: "Modern bathroom" },
    ],
    isFeatured: false,
  },
  {
    slug: "maitama-executive-villa",
    title: "Maitama Executive Villa",
    description:
      "An exquisite villa in Abuja's most prestigious neighbourhood, Maitama. This spacious property features four beautifully appointed bedrooms, a grand living area, formal dining room, and a private pool surrounded by manicured gardens. Perfect for families, diplomatic visitors, or executives seeking privacy and luxury. The estate offers 24/7 security, backup power, and ample parking.",
    propertyType: "Villa",
    city: "Abuja",
    location: "Maitama",
    address: "Ibrahim Babangida Boulevard, Maitama, Abuja",
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 4,
    pricePerNight: 150000,
    cleaningFee: 8000,
    otherFees: 5000,
    otherFeesNote: "Estate service charge",
    checkInInfo: "2:00 PM — 6:00 PM",
    checkOutInfo: "11:00 AM",
    smokingPolicy: "Smoking allowed outdoors",
    petPolicy: "Pets on request",
    additionalRules: "No parties without prior approval. Pool hours: 7 AM — 9 PM.",
    amenitySlugs: [
      "free-wifi", "air-conditioning", "kitchen", "parking", "swimming-pool",
      "gym", "security", "washing-machine", "smart-tv", "hot-water",
      "refrigerator", "microwave", "garden", "generator", "workspace",
      "fire-extinguisher",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80", altText: "Luxury villa exterior with pool" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80", altText: "Grand living room" },
      { url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1200&q=80", altText: "Master bedroom suite" },
      { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80", altText: "Private swimming pool" },
      { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80", altText: "Formal dining room" },
    ],
    isFeatured: true,
  },
  {
    slug: "wuse-modern-duplex",
    title: "Wuse Modern Duplex",
    description:
      "A contemporary duplex in the vibrant Wuse 2 district of Abuja. This stylish home features an open-plan ground floor with a modern kitchen, dining area, and lounge that flows to a private patio. Upstairs, three comfortable bedrooms share two bathrooms. Walking distance to shopping centres, restaurants, and nightlife. Perfect for families and groups visiting Abuja.",
    propertyType: "Duplex",
    city: "Abuja",
    location: "Wuse 2",
    address: "Aminu Kano Crescent, Wuse 2, Abuja",
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    pricePerNight: 70000,
    cleaningFee: 4000,
    otherFees: null,
    otherFeesNote: null,
    checkInInfo: "2:00 PM — 8:00 PM",
    checkOutInfo: "11:00 AM",
    smokingPolicy: "No smoking",
    petPolicy: "No pets",
    additionalRules: "No parties. Quiet hours after 10 PM. No unregistered guests.",
    amenitySlugs: [
      "free-wifi", "air-conditioning", "kitchen", "parking", "security",
      "washing-machine", "smart-tv", "hot-water", "refrigerator", "generator",
      "workspace", "fire-extinguisher",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200&q=80", altText: "Modern duplex living room" },
      { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80", altText: "Contemporary kitchen" },
      { url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80", altText: "Comfortable bedroom" },
      { url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&q=80", altText: "Private patio area" },
    ],
    isFeatured: false,
  },
  {
    slug: "jos-plateau-cottage",
    title: "Jos Plateau Cottage",
    description:
      "Escape to the cool climate of Jos in this charming cottage nestled in the Plateau highlands. The property offers a cosy living space with a fireplace, a well-equipped kitchen, and two comfortable bedrooms. The garden is perfect for outdoor dining with views of the surrounding hills. Ideal for weekend getaways, writers' retreats, or anyone seeking tranquillity in Nigeria's most temperate city.",
    propertyType: "Bungalow",
    city: "Jos",
    location: "Rayfield",
    address: "Rayfield Resort Road, Jos, Plateau State",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    pricePerNight: 28000,
    cleaningFee: 2000,
    otherFees: null,
    otherFeesNote: null,
    checkInInfo: "3:00 PM — 8:00 PM",
    checkOutInfo: "10:00 AM",
    smokingPolicy: "No smoking",
    petPolicy: "Pets allowed",
    additionalRules: "Fireplace available November to February. Please keep gates closed.",
    amenitySlugs: [
      "free-wifi", "kitchen", "parking", "security", "washing-machine",
      "smart-tv", "hot-water", "refrigerator", "garden", "generator",
    ],
    images: [
      { url: "https://images.unsplash.com/photo-1568605114987-505b54b413d9?w=1200&q=80", altText: "Cosy cottage exterior" },
      { url: "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=80", altText: "Living room with fireplace" },
      { url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80", altText: "Compact kitchen" },
      { url: "https://images.unsplash.com/photo-1617806898100-6e6b6f5f2d3a?w=1200&q=80", altText: "Garden with hill views" },
    ],
    isFeatured: false,
  },
];

// ---------------------------------------------------------------------------
// Main seed function — idempotent
// ---------------------------------------------------------------------------

async function seedDemoApartments(): Promise<void> {
  const enableSeed = process.env.ENABLE_DEMO_SEED;
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (!enableSeed || enableSeed !== "true") {
    console.error(
      "Demo seeding is disabled. Set ENABLE_DEMO_SEED=true to proceed.",
    );
    process.exit(1);
  }

  if (nodeEnv === "production") {
    console.error("Demo seeding is not allowed in production.");
    process.exit(1);
  }

  console.info("Starting demo apartment seeding...\n");

  // --- Ensure demo host exists ---
  let demoHost = await prisma.user.findUnique({
    where: { email: DEMO_HOST_EMAIL },
  });

  if (!demoHost) {
    demoHost = await prisma.user.create({
      data: {
        fullName: DEMO_HOST_NAME,
        email: DEMO_HOST_EMAIL,
        phone: DEMO_HOST_PHONE,
        passwordHash: DEMO_HOST_PASSWORD_HASH,
        role: Role.ADMIN,
        isEmailVerified: true,
      },
    });
    console.info(`Created demo host: ${demoHost.email}`);
  } else {
    console.info(`Demo host already exists: ${demoHost.email}`);
  }

  // --- Ensure amenities exist ---
  for (const amenity of DEMO_AMENITIES) {
    await prisma.amenity.upsert({
      where: { slug: amenity.slug },
      create: amenity,
      update: { name: amenity.name, icon: amenity.icon },
    });
  }
  console.info(`Ensured ${DEMO_AMENITIES.length} amenities exist.`);

  // --- Upsert demo apartments ---
  for (const demo of DEMO_APARTMENTS) {
    const existing = await prisma.apartment.findUnique({
      where: { slug: demo.slug },
      include: { images: true, amenities: true },
    });

    const amenityRecords = await prisma.amenity.findMany({
      where: { slug: { in: demo.amenitySlugs } },
      select: { id: true, slug: true },
    });

    const amenityIds = demo.amenitySlugs
      .map((slug) => amenityRecords.find((a) => a.slug === slug)?.id)
      .filter((id): id is string => Boolean(id));

    if (existing) {
      // Update existing demo apartment
      await prisma.apartment.update({
        where: { id: existing.id },
        data: {
          title: demo.title,
          description: demo.description,
          propertyType: demo.propertyType,
          city: demo.city,
          location: demo.location,
          address: demo.address,
          maxGuests: demo.maxGuests,
          bedrooms: demo.bedrooms,
          bathrooms: demo.bathrooms,
          pricePerNight: demo.pricePerNight,
          cleaningFee: demo.cleaningFee,
          otherFees: demo.otherFees,
          otherFeesNote: demo.otherFeesNote,
          checkInInfo: demo.checkInInfo,
          checkOutInfo: demo.checkOutInfo,
          smokingPolicy: demo.smokingPolicy,
          petPolicy: demo.petPolicy,
          additionalRules: demo.additionalRules,
          status: ApartmentStatus.PUBLISHED,
          isDemo: true,
          isFeatured: demo.isFeatured,
          publishedAt: existing.publishedAt ?? new Date(),
          hostId: demoHost.id,
        },
      });

      // Replace images
      if (existing.images.length > 0) {
        await prisma.apartmentImage.deleteMany({
          where: { apartmentId: existing.id },
        });
      }
      for (let i = 0; i < demo.images.length; i++) {
        const img = demo.images[i];
        await prisma.apartmentImage.create({
          data: {
            apartmentId: existing.id,
            url: img.url,
            altText: img.altText,
            position: i,
            isPrimary: i === 0,
          },
        });
      }

      // Replace amenities
      await prisma.apartmentAmenity.deleteMany({
        where: { apartmentId: existing.id },
      });
      for (const amenityId of amenityIds) {
        await prisma.apartmentAmenity.create({
          data: { apartmentId: existing.id, amenityId },
        });
      }

      console.info(`Updated: ${demo.title}`);
    } else {
      // Create new demo apartment
      const apartment = await prisma.apartment.create({
        data: {
          slug: demo.slug,
          title: demo.title,
          description: demo.description,
          propertyType: demo.propertyType,
          city: demo.city,
          location: demo.location,
          address: demo.address,
          maxGuests: demo.maxGuests,
          bedrooms: demo.bedrooms,
          bathrooms: demo.bathrooms,
          pricePerNight: demo.pricePerNight,
          cleaningFee: demo.cleaningFee,
          otherFees: demo.otherFees,
          otherFeesNote: demo.otherFeesNote,
          checkInInfo: demo.checkInInfo,
          checkOutInfo: demo.checkOutInfo,
          smokingPolicy: demo.smokingPolicy,
          petPolicy: demo.petPolicy,
          additionalRules: demo.additionalRules,
          status: ApartmentStatus.PUBLISHED,
          isDemo: true,
          isFeatured: demo.isFeatured,
          publishedAt: new Date(),
          hostId: demoHost.id,
          amenities: {
            create: amenityIds.map((amenityId) => ({ amenityId })),
          },
        },
      });

      for (let i = 0; i < demo.images.length; i++) {
        const img = demo.images[i];
        await prisma.apartmentImage.create({
          data: {
            apartmentId: apartment.id,
            url: img.url,
            altText: img.altText,
            position: i,
            isPrimary: i === 0,
          },
        });
      }

      console.info(`Created: ${demo.title}`);
    }
  }

  // --- Summary ---
  const demoCount = await prisma.apartment.count({ where: { isDemo: true } });
  console.info(`\nSeed complete. ${demoCount} demo apartments in database.`);
}

seedDemoApartments()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
