import { ApartmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { buildUniqueSlug } from "../utils/slugify.js";
import { deleteStoredImage, storeImage } from "./imageStorageService.js";
import type {
  AdminApartmentQuery,
  CreateApartmentInput,
  HostApartmentQuery,
  ModerationReasonInput,
  PublicApartmentQuery,
  ReorderImagesInput,
  UpdateApartmentInput,
} from "../validators/apartmentValidators.js";

// ---------------------------------------------------------------------------
// Prisma include / record types
// ---------------------------------------------------------------------------

export const apartmentInclude = {
  images: {
    orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
  },
  amenities: {
    include: { amenity: true },
  },
  host: {
    select: { id: true, fullName: true, email: true, phone: true },
  },
} satisfies Prisma.ApartmentInclude;

type ApartmentRecord = Prisma.ApartmentGetPayload<{
  include: typeof apartmentInclude;
}>;

interface SerializeOptions {
  includeHost?: boolean;
  includeModeration?: boolean;
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<ApartmentStatus, ApartmentStatus[]> = {
  DRAFT: [ApartmentStatus.PENDING, ApartmentStatus.ARCHIVED],
  PENDING: [
    ApartmentStatus.PUBLISHED,
    ApartmentStatus.REJECTED,
    ApartmentStatus.DRAFT,
    ApartmentStatus.ARCHIVED,
  ],
  PUBLISHED: [
    ApartmentStatus.PENDING,
    ApartmentStatus.SUSPENDED,
    ApartmentStatus.ARCHIVED,
  ],
  REJECTED: [
    ApartmentStatus.PENDING,
    ApartmentStatus.DRAFT,
    ApartmentStatus.ARCHIVED,
  ],
  SUSPENDED: [
    ApartmentStatus.PENDING,
    ApartmentStatus.PUBLISHED,
    ApartmentStatus.ARCHIVED,
  ],
  ARCHIVED: [ApartmentStatus.DRAFT],
};

function assertTransition(from: ApartmentStatus, to: ApartmentStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new AppError(
      `This apartment cannot move from ${from} to ${to}.`,
      400,
    );
  }
}

const HOST_EDITABLE_STATUSES: ApartmentStatus[] = [
  ApartmentStatus.DRAFT,
  ApartmentStatus.REJECTED,
  ApartmentStatus.PUBLISHED,
  ApartmentStatus.SUSPENDED,
];

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function money(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

function serializeApartment(
  apartment: ApartmentRecord,
  options: SerializeOptions = {},
) {
  const primaryImage =
    apartment.images.find((image) => image.isPrimary) ?? apartment.images[0];

  return {
    id: apartment.id,
    slug: apartment.slug,
    title: apartment.title,
    description: apartment.description,
    propertyType: apartment.propertyType,
    city: apartment.city,
    location: apartment.location,
    address: apartment.address,
    maxGuests: apartment.maxGuests,
    bedrooms: apartment.bedrooms,
    bathrooms: apartment.bathrooms,
    pricePerNight: Number(apartment.pricePerNight),
    cleaningFee: money(apartment.cleaningFee),
    otherFees: money(apartment.otherFees),
    otherFeesNote: apartment.otherFeesNote,
    checkInInfo: apartment.checkInInfo,
    checkOutInfo: apartment.checkOutInfo,
    smokingPolicy: apartment.smokingPolicy,
    petPolicy: apartment.petPolicy,
    additionalRules: apartment.additionalRules,
    status: apartment.status,
    isFeatured: apartment.isFeatured,
    rating: Number(apartment.rating),
    reviewCount: apartment.reviewCount,
    images: apartment.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
      position: image.position,
      isPrimary: image.isPrimary,
    })),
    mainImage: primaryImage?.url ?? null,
    amenities: apartment.amenities.map(({ amenity }) => ({
      id: amenity.id,
      name: amenity.name,
      slug: amenity.slug,
      icon: amenity.icon,
    })),
    createdAt: apartment.createdAt,
    updatedAt: apartment.updatedAt,
    ...(options.includeModeration && {
      rejectionReason: apartment.rejectionReason,
      reviewNotes: apartment.reviewNotes,
      submittedAt: apartment.submittedAt,
      reviewedAt: apartment.reviewedAt,
      publishedAt: apartment.publishedAt,
      suspendedAt: apartment.suspendedAt,
    }),
    ...(options.includeHost && {
      host: apartment.host,
    }),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ensureAmenitiesExist(amenityIds: string[]): Promise<string[]> {
  const uniqueIds = [...new Set(amenityIds)];
  if (uniqueIds.length === 0) return [];

  const found = await prisma.amenity.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });

  if (found.length !== uniqueIds.length) {
    throw new AppError("One or more selected amenities are invalid.", 400);
  }

  return uniqueIds;
}

async function uniqueSlugForTitle(
  title: string,
  excludeId?: string,
): Promise<string> {
  return buildUniqueSlug(title, async (slug) => {
    const existing = await prisma.apartment.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(existing);
  });
}

async function getOwnedApartment(
  hostId: string,
  apartmentId: string,
): Promise<ApartmentRecord> {
  const apartment = await prisma.apartment.findFirst({
    where: { id: apartmentId, hostId },
    include: apartmentInclude,
  });

  if (!apartment) {
    throw new AppError("Apartment not found.", 404);
  }

  return apartment;
}

async function getApartmentForAdmin(
  apartmentId: string,
): Promise<ApartmentRecord> {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    include: apartmentInclude,
  });

  if (!apartment) {
    throw new AppError("Apartment not found.", 404);
  }

  return apartment;
}

function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ---------------------------------------------------------------------------
// Public listings
// ---------------------------------------------------------------------------

export async function listPublicApartments(query: PublicApartmentQuery) {
  const where: Prisma.ApartmentWhereInput = {
    status: ApartmentStatus.PUBLISHED,
    images: { some: {} },
  };

  if (query.city) {
    where.city = { contains: query.city, mode: "insensitive" };
  }

  if (query.location) {
    where.OR = [
      { location: { contains: query.location, mode: "insensitive" } },
      { city: { contains: query.location, mode: "insensitive" } },
    ];
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { location: { contains: query.search, mode: "insensitive" } },
      { city: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.pricePerNight = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }

  if (query.bedrooms !== undefined) {
    where.bedrooms = { gte: query.bedrooms };
  }

  if (query.guests !== undefined) {
    where.maxGuests = { gte: query.guests };
  }

  const orderBy: Prisma.ApartmentOrderByWithRelationInput =
    query.sortBy === "price-asc"
      ? { pricePerNight: "asc" }
      : query.sortBy === "price-desc"
        ? { pricePerNight: "desc" }
        : query.sortBy === "rating"
          ? { rating: "desc" }
          : { publishedAt: "desc" };

  const skip = (query.page - 1) * query.limit;

  const [apartments, total] = await prisma.$transaction([
    prisma.apartment.findMany({
      where,
      include: apartmentInclude,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.apartment.count({ where }),
  ]);

  return {
    apartments: apartments.map((apartment) => serializeApartment(apartment)),
    meta: paginationMeta(query.page, query.limit, total),
  };
}

export async function getPublicApartment(apartmentId: string) {
  const apartment = await prisma.apartment.findFirst({
    where: {
      OR: [{ id: apartmentId }, { slug: apartmentId }],
      status: ApartmentStatus.PUBLISHED,
    },
    include: apartmentInclude,
  });

  if (!apartment) {
    throw new AppError("Apartment not found.", 404);
  }

  return serializeApartment(apartment);
}

export async function listAmenities() {
  return prisma.amenity.findMany({
    select: { id: true, name: true, slug: true, icon: true },
    orderBy: { name: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Host operations
// ---------------------------------------------------------------------------

export async function createApartment(
  hostId: string,
  input: CreateApartmentInput,
) {
  const { amenityIds, ...fields } = input;
  const validAmenityIds = await ensureAmenitiesExist(amenityIds);
  const slug = await uniqueSlugForTitle(fields.title);

  const apartment = await prisma.apartment.create({
    data: {
      ...fields,
      slug,
      hostId,
      status: ApartmentStatus.DRAFT,
      cleaningFee: fields.cleaningFee ?? null,
      otherFees: fields.otherFees ?? null,
      otherFeesNote: fields.otherFeesNote ?? null,
      additionalRules: fields.additionalRules ?? null,
      amenities: {
        create: validAmenityIds.map((amenityId) => ({ amenityId })),
      },
    },
    include: apartmentInclude,
  });

  return serializeApartment(apartment, { includeModeration: true });
}

export async function listHostApartments(
  hostId: string,
  query: HostApartmentQuery,
) {
  const where: Prisma.ApartmentWhereInput = { hostId };

  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { city: { contains: query.search, mode: "insensitive" } },
      { location: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [apartments, total] = await prisma.$transaction([
    prisma.apartment.findMany({
      where,
      include: apartmentInclude,
      orderBy: { updatedAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.apartment.count({ where }),
  ]);

  return {
    apartments: apartments.map((apartment) =>
      serializeApartment(apartment, { includeModeration: true }),
    ),
    meta: paginationMeta(query.page, query.limit, total),
  };
}

export async function getHostApartment(hostId: string, apartmentId: string) {
  const apartment = await getOwnedApartment(hostId, apartmentId);
  return serializeApartment(apartment, { includeModeration: true });
}

export async function getHostApartmentStats(hostId: string) {
  const [grouped, recent] = await Promise.all([
    prisma.apartment.groupBy({
      by: ["status"],
      where: { hostId },
      _count: { _all: true },
    }),
    prisma.apartment.findMany({
      where: { hostId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: apartmentInclude,
    }),
  ]);

  const counts = Object.fromEntries(
    Object.values(ApartmentStatus).map((status) => [status, 0]),
  ) as Record<ApartmentStatus, number>;

  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return {
    total,
    draft: counts.DRAFT,
    pending: counts.PENDING,
    published: counts.PUBLISHED,
    rejected: counts.REJECTED,
    suspended: counts.SUSPENDED,
    archived: counts.ARCHIVED,
    recent: recent.map((apartment) =>
      serializeApartment(apartment, { includeModeration: true }),
    ),
  };
}

export async function updateApartment(
  hostId: string,
  apartmentId: string,
  input: UpdateApartmentInput,
) {
  const existing = await getOwnedApartment(hostId, apartmentId);

  if (!HOST_EDITABLE_STATUSES.includes(existing.status)) {
    throw new AppError(
      "This apartment cannot be edited in its current status.",
      400,
    );
  }

  const { amenityIds, ...fields } = input;
  const validAmenityIds =
    amenityIds === undefined ? undefined : await ensureAmenitiesExist(amenityIds);

  const data: Prisma.ApartmentUpdateInput = { ...fields };

  if (fields.title) {
    data.slug = await uniqueSlugForTitle(fields.title, apartmentId);
  }

  if (
    existing.status === ApartmentStatus.PUBLISHED ||
    existing.status === ApartmentStatus.SUSPENDED
  ) {
    data.status = ApartmentStatus.PENDING;
    data.submittedAt = new Date();
    data.rejectionReason = null;
    data.reviewNotes = null;
    data.reviewedAt = null;
    data.reviewedBy = { disconnect: true };
    data.suspendedAt = null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.apartment.update({
      where: { id: apartmentId },
      data,
    });

    if (validAmenityIds) {
      await tx.apartmentAmenity.deleteMany({ where: { apartmentId } });
      if (validAmenityIds.length > 0) {
        await tx.apartmentAmenity.createMany({
          data: validAmenityIds.map((amenityId) => ({
            apartmentId,
            amenityId,
          })),
        });
      }
    }
  });

  const apartment = await getOwnedApartment(hostId, apartmentId);
  return serializeApartment(apartment, { includeModeration: true });
}

export async function submitApartment(
  hostId: string,
  apartmentId: string,
) {
  const existing = await getOwnedApartment(hostId, apartmentId);

  if (
    existing.status !== ApartmentStatus.DRAFT &&
    existing.status !== ApartmentStatus.REJECTED
  ) {
    throw new AppError(
      "Only draft or rejected apartments can be submitted for review.",
      400,
    );
  }

  if (existing.images.length === 0) {
    throw new AppError(
      "Add at least one apartment image before submitting for review.",
      400,
    );
  }

  assertTransition(existing.status, ApartmentStatus.PENDING);

  const apartment = await prisma.apartment.update({
    where: { id: apartmentId },
    data: {
      status: ApartmentStatus.PENDING,
      submittedAt: new Date(),
      rejectionReason: null,
      reviewNotes: null,
      reviewedAt: null,
      reviewedById: null,
      suspendedAt: null,
    },
    include: apartmentInclude,
  });

  return serializeApartment(apartment, { includeModeration: true });
}

export async function archiveHostApartment(
  hostId: string,
  apartmentId: string,
) {
  const existing = await getOwnedApartment(hostId, apartmentId);

  if (existing.status === ApartmentStatus.ARCHIVED) {
    return serializeApartment(existing, { includeModeration: true });
  }

  assertTransition(existing.status, ApartmentStatus.ARCHIVED);

  const apartment = await prisma.apartment.update({
    where: { id: apartmentId },
    data: { status: ApartmentStatus.ARCHIVED },
    include: apartmentInclude,
  });

  return serializeApartment(apartment, { includeModeration: true });
}

// ---------------------------------------------------------------------------
// Image management
// ---------------------------------------------------------------------------

function assertImagesManageable(status: ApartmentStatus): void {
  if (status === ApartmentStatus.ARCHIVED) {
    throw new AppError(
      "Images cannot be changed while the apartment is archived.",
      400,
    );
  }
}

export async function addApartmentImage(
  hostId: string,
  apartmentId: string,
  file: Express.Multer.File,
  altText?: string,
) {
  const apartment = await getOwnedApartment(hostId, apartmentId);
  assertImagesManageable(apartment.status);

  const MAX_IMAGES = 10;
  if (apartment.images.length >= MAX_IMAGES) {
    throw new AppError(
      `You can upload a maximum of ${MAX_IMAGES} images per apartment.`,
      400,
    );
  }

  const stored = await storeImage(file.buffer, file.mimetype);

  try {
    const nextPosition =
      apartment.images.reduce(
        (max, image) => Math.max(max, image.position),
        -1,
      ) + 1;
    const isPrimary = apartment.images.length === 0;

    const image = await prisma.apartmentImage.create({
      data: {
        apartmentId,
        url: stored.url,
        publicId: stored.publicId,
        altText:
          altText?.trim() ||
          `${apartment.title} — image ${apartment.images.length + 1}`,
        position: nextPosition,
        isPrimary,
      },
    });

    return {
      id: image.id,
      url: image.url,
      altText: image.altText,
      position: image.position,
      isPrimary: image.isPrimary,
    };
  } catch (error) {
    await deleteStoredImage(stored.url, stored.publicId);
    throw error;
  }
}

export async function deleteApartmentImage(
  hostId: string,
  apartmentId: string,
  imageId: string,
) {
  const apartment = await getOwnedApartment(hostId, apartmentId);
  assertImagesManageable(apartment.status);

  const image = apartment.images.find((item) => item.id === imageId);
  if (!image) {
    throw new AppError("Image not found.", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.apartmentImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const replacement = await tx.apartmentImage.findFirst({
        where: { apartmentId },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      });

      if (replacement) {
        await tx.apartmentImage.update({
          where: { id: replacement.id },
          data: { isPrimary: true },
        });
      }
    }
  });

  await deleteStoredImage(image.url, image.publicId);
}

export async function setPrimaryApartmentImage(
  hostId: string,
  apartmentId: string,
  imageId: string,
) {
  const apartment = await getOwnedApartment(hostId, apartmentId);
  assertImagesManageable(apartment.status);

  const image = apartment.images.find((item) => item.id === imageId);
  if (!image) {
    throw new AppError("Image not found.", 404);
  }

  await prisma.$transaction([
    prisma.apartmentImage.updateMany({
      where: { apartmentId },
      data: { isPrimary: false },
    }),
    prisma.apartmentImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
  ]);
}

export async function reorderApartmentImages(
  hostId: string,
  apartmentId: string,
  input: ReorderImagesInput,
) {
  const apartment = await getOwnedApartment(hostId, apartmentId);
  assertImagesManageable(apartment.status);

  const existingIds = apartment.images.map((image) => image.id);
  const requestedIds = input.imageIds;

  if (
    existingIds.length !== requestedIds.length ||
    new Set(requestedIds).size !== requestedIds.length ||
    !requestedIds.every((id) => existingIds.includes(id))
  ) {
    throw new AppError(
      "The image order must include every image exactly once.",
      400,
    );
  }

  await prisma.$transaction(
    requestedIds.map((imageId, position) =>
      prisma.apartmentImage.update({
        where: { id: imageId },
        data: { position },
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Admin operations
// ---------------------------------------------------------------------------

export async function listAdminApartments(query: AdminApartmentQuery) {
  const where: Prisma.ApartmentWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.hostId) where.hostId = query.hostId;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { city: { contains: query.search, mode: "insensitive" } },
      { location: { contains: query.search, mode: "insensitive" } },
      { host: { fullName: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [apartments, total] = await prisma.$transaction([
    prisma.apartment.findMany({
      where,
      include: apartmentInclude,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      skip,
      take: query.limit,
    }),
    prisma.apartment.count({ where }),
  ]);

  return {
    apartments: apartments.map((apartment) =>
      serializeApartment(apartment, {
        includeHost: true,
        includeModeration: true,
      }),
    ),
    meta: paginationMeta(query.page, query.limit, total),
  };
}

export async function getAdminApartment(apartmentId: string) {
  const apartment = await getApartmentForAdmin(apartmentId);
  return serializeApartment(apartment, {
    includeHost: true,
    includeModeration: true,
  });
}

export async function approveApartment(
  adminId: string,
  apartmentId: string,
) {
  const existing = await getApartmentForAdmin(apartmentId);

  if (existing.status !== ApartmentStatus.PENDING) {
    throw new AppError("Only pending apartments can be approved.", 400);
  }

  assertTransition(existing.status, ApartmentStatus.PUBLISHED);

  const apartment = await prisma.apartment.update({
    where: { id: apartmentId },
    data: {
      status: ApartmentStatus.PUBLISHED,
      publishedAt: new Date(),
      reviewedAt: new Date(),
      reviewedById: adminId,
      rejectionReason: null,
      reviewNotes: null,
      suspendedAt: null,
    },
    include: apartmentInclude,
  });

  return serializeApartment(apartment, {
    includeHost: true,
    includeModeration: true,
  });
}

export async function rejectApartment(
  adminId: string,
  apartmentId: string,
  input: ModerationReasonInput,
) {
  const existing = await getApartmentForAdmin(apartmentId);

  if (existing.status !== ApartmentStatus.PENDING) {
    throw new AppError("Only pending apartments can be rejected.", 400);
  }

  assertTransition(existing.status, ApartmentStatus.REJECTED);

  const apartment = await prisma.apartment.update({
    where: { id: apartmentId },
    data: {
      status: ApartmentStatus.REJECTED,
      rejectionReason: input.reason,
      reviewedAt: new Date(),
      reviewedById: adminId,
      publishedAt: null,
    },
    include: apartmentInclude,
  });

  return serializeApartment(apartment, {
    includeHost: true,
    includeModeration: true,
  });
}

export async function requestApartmentChanges(
  adminId: string,
  apartmentId: string,
  input: ModerationReasonInput,
) {
  const existing = await getApartmentForAdmin(apartmentId);

  if (existing.status !== ApartmentStatus.PENDING) {
    throw new AppError(
      "Changes can only be requested for pending apartments.",
      400,
    );
  }

  assertTransition(existing.status, ApartmentStatus.DRAFT);

  const apartment = await prisma.apartment.update({
    where: { id: apartmentId },
    data: {
      status: ApartmentStatus.DRAFT,
      reviewNotes: input.reason,
      rejectionReason: null,
      reviewedAt: new Date(),
      reviewedById: adminId,
    },
    include: apartmentInclude,
  });

  return serializeApartment(apartment, {
    includeHost: true,
    includeModeration: true,
  });
}

export async function suspendApartment(
  adminId: string,
  apartmentId: string,
  input: ModerationReasonInput,
) {
  const existing = await getApartmentForAdmin(apartmentId);

  if (existing.status !== ApartmentStatus.PUBLISHED) {
    throw new AppError("Only published apartments can be suspended.", 400);
  }

  assertTransition(existing.status, ApartmentStatus.SUSPENDED);

  const apartment = await prisma.apartment.update({
    where: { id: apartmentId },
    data: {
      status: ApartmentStatus.SUSPENDED,
      reviewNotes: input.reason,
      suspendedAt: new Date(),
      reviewedAt: new Date(),
      reviewedById: adminId,
    },
    include: apartmentInclude,
  });

  return serializeApartment(apartment, {
    includeHost: true,
    includeModeration: true,
  });
}

export async function archiveAdminApartment(apartmentId: string) {
  const existing = await getApartmentForAdmin(apartmentId);

  if (existing.status === ApartmentStatus.ARCHIVED) {
    return serializeApartment(existing, {
      includeHost: true,
      includeModeration: true,
    });
  }

  assertTransition(existing.status, ApartmentStatus.ARCHIVED);

  const apartment = await prisma.apartment.update({
    where: { id: apartmentId },
    data: { status: ApartmentStatus.ARCHIVED },
    include: apartmentInclude,
  });

  return serializeApartment(apartment, {
    includeHost: true,
    includeModeration: true,
  });
}

// ---------------------------------------------------------------------------
// Admin stats (apartment section)
// ---------------------------------------------------------------------------

export async function getAdminApartmentStats() {
  const grouped = await prisma.apartment.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = Object.fromEntries(
    Object.values(ApartmentStatus).map((status) => [status, 0]),
  ) as Record<ApartmentStatus, number>;

  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return {
    total,
    draft: counts.DRAFT,
    pending: counts.PENDING,
    published: counts.PUBLISHED,
    rejected: counts.REJECTED,
    suspended: counts.SUSPENDED,
    archived: counts.ARCHIVED,
  };
}
