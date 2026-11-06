import { BlockType, BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  AvailabilityBlockInput,
  AvailabilityBlockQuery,
} from "../validators/availabilityValidators.js";

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function serializeBlock(b: Prisma.ApartmentAvailabilityBlockGetPayload<{}>) {
  return {
    id: b.id,
    apartmentId: b.apartmentId,
    startDate: b.startDate.toISOString().split("T")[0],
    endDate: b.endDate.toISOString().split("T")[0],
    reason: b.reason,
    blockType: b.blockType,
    createdById: b.createdById,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Host: list blocks for an apartment
// ---------------------------------------------------------------------------

export async function listAvailabilityBlocks(
  apartmentId: string,
  hostId: string,
) {
  const apartment = await prisma.apartment.findFirst({
    where: { id: apartmentId, hostId },
    select: { id: true },
  });
  if (!apartment) throw new AppError("Apartment not found.", 404);

  const blocks = await prisma.apartmentAvailabilityBlock.findMany({
    where: { apartmentId },
    orderBy: { startDate: "asc" },
  });

  return { blocks: blocks.map(serializeBlock) };
}

// ---------------------------------------------------------------------------
// Host: create availability block
// ---------------------------------------------------------------------------

export async function createAvailabilityBlock(
  apartmentId: string,
  hostId: string,
  input: AvailabilityBlockInput,
) {
  const apartment = await prisma.apartment.findFirst({
    where: { id: apartmentId, hostId },
    select: { id: true, title: true },
  });
  if (!apartment) throw new AppError("Apartment not found.", 404);

  // Check for overlap with confirmed/active bookings
  const bookingConflict = await prisma.booking.findFirst({
    where: {
      apartmentId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
      checkIn: { lt: input.endDate },
      checkOut: { gt: input.startDate },
    },
    select: { id: true, bookingReference: true },
  });

  if (bookingConflict) {
    throw new AppError(
      `Cannot block these dates — booking ${bookingConflict.bookingReference} overlaps this range.`,
      409,
    );
  }

  // Check for overlap with existing blocks — merge if overlapping
  const existingBlocks = await prisma.apartmentAvailabilityBlock.findMany({
    where: {
      apartmentId,
      startDate: { lt: input.endDate },
      endDate: { gt: input.startDate },
    },
  });

  if (existingBlocks.length > 0) {
    // Delete overlapping blocks and create a merged one
    const minStart = new Date(
      Math.min(
        input.startDate.getTime(),
        ...existingBlocks.map((b) => b.startDate.getTime()),
      ),
    );
    const maxEnd = new Date(
      Math.max(
        input.endDate.getTime(),
        ...existingBlocks.map((b) => b.endDate.getTime()),
      ),
    );

    await prisma.apartmentAvailabilityBlock.deleteMany({
      where: { id: { in: existingBlocks.map((b) => b.id) } },
    });

    const block = await prisma.apartmentAvailabilityBlock.create({
      data: {
        apartmentId,
        startDate: minStart,
        endDate: maxEnd,
        reason: input.reason ?? null,
        blockType: input.blockType ?? BlockType.HOST_BLOCK,
        createdById: hostId,
      },
    });
    return serializeBlock(block);
  }

  const block = await prisma.apartmentAvailabilityBlock.create({
    data: {
      apartmentId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason ?? null,
      blockType: input.blockType ?? BlockType.HOST_BLOCK,
      createdById: hostId,
    },
  });

  return serializeBlock(block);
}

// ---------------------------------------------------------------------------
// Host: delete availability block
// ---------------------------------------------------------------------------

export async function deleteAvailabilityBlock(
  apartmentId: string,
  blockId: string,
  hostId: string,
) {
  const apartment = await prisma.apartment.findFirst({
    where: { id: apartmentId, hostId },
    select: { id: true },
  });
  if (!apartment) throw new AppError("Apartment not found.", 404);

  const block = await prisma.apartmentAvailabilityBlock.findFirst({
    where: { id: blockId, apartmentId },
  });
  if (!block) throw new AppError("Availability block not found.", 404);

  await prisma.apartmentAvailabilityBlock.delete({
    where: { id: blockId },
  });

  return { deleted: true };
}

// ---------------------------------------------------------------------------
// Host: list all blocks across apartments owned by host
// ---------------------------------------------------------------------------

export async function listHostAvailabilityBlocks(
  hostId: string,
  query: AvailabilityBlockQuery,
) {
  const where: Prisma.ApartmentAvailabilityBlockWhereInput = {
    apartment: { hostId },
  };

  if (query.apartmentId) {
    where.apartmentId = query.apartmentId;
  }

  const blocks = await prisma.apartmentAvailabilityBlock.findMany({
    where,
    include: {
      apartment: { select: { id: true, title: true } },
    },
    orderBy: { startDate: "asc" },
    ...(query.limit ? { take: query.limit } : {}),
  });

  return {
    blocks: blocks.map((b) => ({
      ...serializeBlock(b),
      apartment: { id: b.apartment.id, title: b.apartment.title },
    })),
  };
}

// ---------------------------------------------------------------------------
// Admin: create availability block
// ---------------------------------------------------------------------------

export async function adminCreateAvailabilityBlock(
  apartmentId: string,
  adminId: string,
  input: AvailabilityBlockInput,
) {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { id: true },
  });
  if (!apartment) throw new AppError("Apartment not found.", 404);

  const block = await prisma.apartmentAvailabilityBlock.create({
    data: {
      apartmentId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason ?? null,
      blockType: input.blockType ?? BlockType.MAINTENANCE,
      createdById: adminId,
    },
  });

  return serializeBlock(block);
}

// ---------------------------------------------------------------------------
// Public: get availability data for calendar (bookings + blocks)
// ---------------------------------------------------------------------------

export async function getApartmentAvailabilityData(apartmentId: string) {
  const apartment = await prisma.apartment.findFirst({
    where: { id: apartmentId },
    select: { id: true, status: true },
  });

  if (!apartment) throw new AppError("Apartment not found.", 404);

  const BLOCKING_STATUSES = [
    BookingStatus.PENDING,
    BookingStatus.AWAITING_PAYMENT,
    BookingStatus.CONFIRMED,
    BookingStatus.ACTIVE,
  ];

  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        apartmentId,
        status: { in: BLOCKING_STATUSES },
      },
      select: {
        checkIn: true,
        checkOut: true,
        status: true,
      },
      orderBy: { checkIn: "asc" },
    }),
    prisma.apartmentAvailabilityBlock.findMany({
      where: { apartmentId },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        blockType: true,
        reason: true,
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return {
    blockedDates: bookings.map((b) => ({
      checkIn: b.checkIn.toISOString().split("T")[0],
      checkOut: b.checkOut.toISOString().split("T")[0],
      status: b.status,
      type: "booking",
    })),
    availabilityBlocks: blocks.map((b) => ({
      id: b.id,
      startDate: b.startDate.toISOString().split("T")[0],
      endDate: b.endDate.toISOString().split("T")[0],
      blockType: b.blockType,
      reason: b.reason,
      type: "block",
    })),
  };
}
