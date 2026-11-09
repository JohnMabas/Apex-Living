import { BookingStatus, ApartmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  assertBookingAccess,
  BOOKING_ACCESS_TOKEN_TTL_DAYS,
  buildBookingManagementUrl,
  generateBookingAccessToken,
  hashBookingAccessToken,
} from "../utils/bookingAccessToken.js";
import {
  guestEmail,
  guestFirstName,
  guestLastName,
  guestName,
  guestPhone,
} from "../utils/bookingGuest.js";
import {
  buildBookingReceivedHtml,
  buildCancellationHtml,
  sendEmail,
} from "./emailService.js";
import type {
  AdminBookingQuery,
  AdminStatusChangeInput,
  CancelBookingInput,
  CheckAvailabilityInput,
  CreateBookingInput,
  CreateGuestBookingInput,
  DeclineBookingInput,
  GuestBookingQuery,
  HostBookingQuery,
} from "../validators/bookingValidators.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** PENDING bookings expire after this many minutes, releasing the hold. */
const PENDING_EXPIRY_MINUTES = 15;

/** Statuses that actively block apartment availability */
const BLOCKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.AWAITING_PAYMENT,
  BookingStatus.CONFIRMED,
  BookingStatus.ACTIVE,
];

/** Valid transitions enforced by the backend */
const ALLOWED_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  PENDING: [
    BookingStatus.AWAITING_PAYMENT,
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
    BookingStatus.EXPIRED,
    BookingStatus.DECLINED,
  ],
  AWAITING_PAYMENT: [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
    BookingStatus.EXPIRED,
  ],
  CONFIRMED: [
    BookingStatus.ACTIVE,
    BookingStatus.CANCELLED,
  ],
  ACTIVE: [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
  DECLINED: [],
};

function assertTransition(from: BookingStatus, to: BookingStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(
      `A booking cannot move from ${from} to ${to}.`,
      400,
    );
  }
}

// ---------------------------------------------------------------------------
// Reference generator — NEST-XXXXXX
// ---------------------------------------------------------------------------

function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `NEST-${code}`;
}

async function uniqueBookingReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const ref = generateReference();
    const existing = await prisma.booking.findUnique({
      where: { bookingReference: ref },
      select: { id: true },
    });
    if (!existing) return ref;
  }
  throw new AppError("Could not generate a unique booking reference.", 500);
}

// ---------------------------------------------------------------------------
// Nights calculation (UTC calendar dates)
// ---------------------------------------------------------------------------

function calcNights(checkIn: Date, checkOut: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay);
}

// ---------------------------------------------------------------------------
// Apartment include helper (for booking responses)
// ---------------------------------------------------------------------------

const apartmentSelect = {
  id: true,
  title: true,
  city: true,
  location: true,
  address: true,
  checkInInfo: true,
  checkOutInfo: true,
  hostId: true,
  images: {
    where: { isPrimary: true },
    select: { url: true, altText: true },
    take: 1,
  },
} satisfies Prisma.ApartmentSelect;

const guestSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
} satisfies Prisma.UserSelect;

const bookingInclude = {
  apartment: { select: apartmentSelect },
  guest: { select: guestSelect },
  statusHistory: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      changedBy: { select: { id: true, fullName: true } },
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      paymentReference: true,
      status: true,
      amount: true,
      currency: true,
      paidAt: true,
    },
  },
} satisfies Prisma.BookingInclude;

type BookingRecord = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function money(v: Prisma.Decimal | null): number | null {
  return v === null ? null : Number(v);
}

function serializeBooking(b: BookingRecord) {
  const primaryImage = b.apartment.images[0];
  const firstName = guestFirstName(b);
  const lastName = guestLastName(b);
  return {
    id: b.id,
    bookingReference: b.bookingReference,
    status: b.status,
    isGuestBooking: b.guestId === null,
    checkIn: b.checkIn.toISOString().split("T")[0],
    checkOut: b.checkOut.toISOString().split("T")[0],
    numberOfGuests: b.numberOfGuests,
    numberOfNights: b.numberOfNights,
    nightlyPriceSnapshot: Number(b.nightlyPriceSnapshot),
    accommodationSubtotal: Number(b.accommodationSubtotal),
    cleaningFeeSnapshot: money(b.cleaningFeeSnapshot),
    additionalFeesSnapshot: money(b.additionalFeesSnapshot),
    totalAmount: Number(b.totalAmount),
    currency: b.currency,
    expiresAt: b.expiresAt?.toISOString() ?? null,
    cancellationReason: b.cancellationReason,
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
    adminNotes: b.adminNotes,
    termsAcceptedAt: b.termsAcceptedAt?.toISOString() ?? null,
    apartment: {
      id: b.apartment.id,
      title: b.apartment.title,
      city: b.apartment.city,
      location: b.apartment.location,
      address: b.apartment.address,
      checkInInfo: b.apartment.checkInInfo,
      checkOutInfo: b.apartment.checkOutInfo,
      hostId: b.apartment.hostId,
      mainImage: primaryImage?.url ?? null,
      mainImageAlt: primaryImage?.altText ?? null,
    },
    guest: {
      id: b.guest?.id ?? null,
      fullName: guestName(b),
      firstName,
      lastName,
      email: guestEmail(b),
      phone: guestPhone(b),
      country: b.guestCountry,
      specialRequests: b.specialRequests,
      arrivalTime: b.arrivalTime,
      additionalNotes: b.additionalNotes,
    },
    latestPayment: b.payments[0]
      ? {
          paymentReference: b.payments[0].paymentReference,
          status: b.payments[0].status,
          amount: Number(b.payments[0].amount),
          currency: b.payments[0].currency,
          paidAt: b.payments[0].paidAt?.toISOString() ?? null,
        }
      : null,
    statusHistory: b.statusHistory,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ---------------------------------------------------------------------------
// Availability helpers
// ---------------------------------------------------------------------------

/** Return true if there is a blocking booking or availability block that overlaps [checkIn, checkOut) */
async function hasOverlap(
  apartmentId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  // Expire stale PENDING bookings first so they don't ghost-block
  await expireStalePendingBookings(apartmentId);

  const [bookingConflict, blockConflict] = await Promise.all([
    prisma.booking.findFirst({
      where: {
        apartmentId,
        status: { in: BLOCKING_STATUSES },
        ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
        // Overlap: existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { id: true },
    }),
    // Treat all availability block types as blocking
    prisma.apartmentAvailabilityBlock.findFirst({
      where: {
        apartmentId,
        startDate: { lt: checkOut },
        endDate: { gt: checkIn },
      },
      select: { id: true },
    }),
  ]);

  return Boolean(bookingConflict) || Boolean(blockConflict);
}

/** Expire PENDING bookings that have passed their expiresAt time. */
async function expireStalePendingBookings(apartmentId?: string): Promise<void> {
  const now = new Date();
  const where: Prisma.BookingWhereInput = {
    status: BookingStatus.PENDING,
    expiresAt: { lt: now },
    ...(apartmentId ? { apartmentId } : {}),
  };

  const stale = await prisma.booking.findMany({
    where,
    select: { id: true },
  });

  if (stale.length === 0) return;

  await prisma.$transaction(
    stale.flatMap((b) => [
      prisma.booking.update({
        where: { id: b.id },
        data: { status: BookingStatus.EXPIRED },
      }),
      prisma.bookingStatusHistory.create({
        data: {
          bookingId: b.id,
          status: BookingStatus.EXPIRED,
          note: "Booking expired automatically due to inactivity.",
        },
      }),
    ]),
  );
}

// ---------------------------------------------------------------------------
// Public: check availability
// ---------------------------------------------------------------------------

export async function checkAvailability(input: CheckAvailabilityInput) {
  const apartment = await prisma.apartment.findUnique({
    where: { id: input.apartmentId },
    select: {
      id: true,
      title: true,
      status: true,
      maxGuests: true,
      pricePerNight: true,
      cleaningFee: true,
      otherFees: true,
      otherFeesNote: true,
    },
  });

  if (!apartment || apartment.status !== ApartmentStatus.PUBLISHED) {
    throw new AppError("This apartment is not available for booking.", 404);
  }

  if (input.numberOfGuests > apartment.maxGuests) {
    throw new AppError(
      `This apartment accommodates a maximum of ${apartment.maxGuests} guests.`,
      400,
    );
  }

  const nights = calcNights(input.checkIn, input.checkOut);
  if (nights < 1) {
    throw new AppError("Stay must be at least 1 night.", 400);
  }

  const overlap = await hasOverlap(
    input.apartmentId,
    input.checkIn,
    input.checkOut,
  );

  const nightly = Number(apartment.pricePerNight);
  const accommodationSubtotal = nightly * nights;
  const cleaningFee = apartment.cleaningFee ? Number(apartment.cleaningFee) : null;
  const additionalFees = apartment.otherFees ? Number(apartment.otherFees) : null;
  const totalAmount =
    accommodationSubtotal + (cleaningFee ?? 0) + (additionalFees ?? 0);

  return {
    available: !overlap,
    apartment: {
      id: apartment.id,
      title: apartment.title,
      maxGuests: apartment.maxGuests,
    },
    checkIn: input.checkIn.toISOString().split("T")[0],
    checkOut: input.checkOut.toISOString().split("T")[0],
    numberOfNights: nights,
    numberOfGuests: input.numberOfGuests,
    pricing: {
      nightlyPriceSnapshot: nightly,
      accommodationSubtotal,
      cleaningFeeSnapshot: cleaningFee,
      additionalFeesSnapshot: additionalFees,
      otherFeesNote: apartment.otherFeesNote,
      totalAmount,
      currency: "NGN",
    },
  };
}

// ---------------------------------------------------------------------------
// Booking creation (account + guest)
// ---------------------------------------------------------------------------

interface PreparedBooking {
  apartmentTitle: string;
  apartmentLocation: string;
  nights: number;
  nightly: number;
  accommodationSubtotal: number;
  cleaningFeeSnapshot: number | null;
  additionalFeesSnapshot: number | null;
  totalAmount: number;
  expiresAt: Date;
}

async function prepareBooking(input: {
  apartmentId: string;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
}): Promise<PreparedBooking> {
  const apartment = await prisma.apartment.findUnique({
    where: { id: input.apartmentId },
    select: {
      id: true,
      title: true,
      city: true,
      location: true,
      status: true,
      maxGuests: true,
      pricePerNight: true,
      cleaningFee: true,
      otherFees: true,
    },
  });

  if (!apartment || apartment.status !== ApartmentStatus.PUBLISHED) {
    throw new AppError("This apartment is not available for booking.", 404);
  }

  if (input.numberOfGuests > apartment.maxGuests) {
    throw new AppError(
      `This apartment accommodates a maximum of ${apartment.maxGuests} guests.`,
      400,
    );
  }

  const nights = calcNights(input.checkIn, input.checkOut);
  if (nights < 1) {
    throw new AppError("Stay must be at least 1 night.", 400);
  }

  // Price snapshot (calculated server-side — never trust frontend price)
  const nightly = Number(apartment.pricePerNight);
  const accommodationSubtotal = nightly * nights;
  const cleaningFeeSnapshot = apartment.cleaningFee
    ? Number(apartment.cleaningFee)
    : null;
  const additionalFeesSnapshot = apartment.otherFees
    ? Number(apartment.otherFees)
    : null;
  const totalAmount =
    accommodationSubtotal +
    (cleaningFeeSnapshot ?? 0) +
    (additionalFeesSnapshot ?? 0);

  return {
    apartmentTitle: apartment.title,
    apartmentLocation: [apartment.location, apartment.city]
      .filter((part): part is string => Boolean(part))
      .join(", "),
    nights,
    nightly,
    accommodationSubtotal,
    cleaningFeeSnapshot,
    additionalFeesSnapshot,
    totalAmount,
    expiresAt: new Date(Date.now() + PENDING_EXPIRY_MINUTES * 60 * 1000),
  };
}

async function assertNoOverlap(
  tx: Prisma.TransactionClient,
  input: { apartmentId: string; checkIn: Date; checkOut: Date },
): Promise<void> {
  const [bookingConflict, blockConflict] = await Promise.all([
    tx.booking.findFirst({
      where: {
        apartmentId: input.apartmentId,
        status: { in: BLOCKING_STATUSES },
        checkIn: { lt: input.checkOut },
        checkOut: { gt: input.checkIn },
      },
      select: { id: true },
    }),
    // Treat all availability block types as blocking
    tx.apartmentAvailabilityBlock.findFirst({
      where: {
        apartmentId: input.apartmentId,
        startDate: { lt: input.checkOut },
        endDate: { gt: input.checkIn },
      },
      select: { id: true },
    }),
  ]);

  if (bookingConflict || blockConflict) {
    throw new AppError(
      "These dates are no longer available. Please choose different dates.",
      409,
    );
  }
}

function formatEmailDate(date: Date): string {
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function accessTokenExpiry(checkOut?: Date): Date {
  const minimum = Date.now() + BOOKING_ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  const afterStay = checkOut
    ? checkOut.getTime() + 7 * 24 * 60 * 60 * 1000
    : minimum;
  return new Date(Math.max(minimum, afterStay));
}

async function saveCustomerContact(
  userId: string,
  phone: string,
  country: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, country: true },
  });
  if (!user) return;

  const data: Prisma.UserUpdateInput = {};
  if (phone && phone !== user.phone) {
    const conflict = await prisma.user.findFirst({
      where: { phone, NOT: { id: userId } },
      select: { id: true },
    });
    if (!conflict) data.phone = phone;
  }
  if (country && country !== user.country) data.country = country;

  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: userId }, data });
  }
}

/** Authenticated customer booking flow. Identity is always the verified user. */
export async function createBooking(
  guestId: string,
  input: CreateBookingInput,
) {
  const customer = await prisma.user.findUnique({
    where: { id: guestId },
    select: {
      id: true,
      fullName: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!customer) throw new AppError("Customer account not found.", 404);

  const email = customer.email?.trim().toLowerCase();
  if (!email) {
    throw new AppError(
      "A verified email address is required to create a booking.",
      400,
    );
  }

  const nameParts = customer.fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = customer.firstName ?? nameParts[0] ?? null;
  const lastName =
    customer.lastName ??
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null);

  const prepared = await prepareBooking({
    apartmentId: input.apartmentId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    numberOfGuests: input.numberOfGuests,
  });

  const booking = await prisma.$transaction(async (tx) => {
    await expireStalePendingBookings(input.apartmentId);
    await assertNoOverlap(tx, {
      apartmentId: input.apartmentId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });

    const ref = await uniqueBookingReference();

    const created = await tx.booking.create({
      data: {
        bookingReference: ref,
        guestId,
        apartmentId: input.apartmentId,
        status: BookingStatus.PENDING,
        guestFirstName: firstName,
        guestLastName: lastName,
        guestEmail: email,
        guestPhone: input.phone,
        guestCountry: input.country,
        specialRequests: input.specialRequests ?? null,
        arrivalTime: input.arrivalTime ?? null,
        additionalNotes: input.additionalNotes ?? null,
        termsAcceptedAt: new Date(),
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        numberOfGuests: input.numberOfGuests,
        numberOfNights: prepared.nights,
        nightlyPriceSnapshot: prepared.nightly,
        accommodationSubtotal: prepared.accommodationSubtotal,
        cleaningFeeSnapshot: prepared.cleaningFeeSnapshot,
        additionalFeesSnapshot: prepared.additionalFeesSnapshot,
        totalAmount: prepared.totalAmount,
        currency: "NGN",
        expiresAt: prepared.expiresAt,
      },
      include: bookingInclude,
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId: created.id,
        status: BookingStatus.PENDING,
        note: "Booking created by authenticated customer.",
        changedById: guestId,
      },
    });

    return created;
  });

  void saveCustomerContact(guestId, input.phone, input.country).catch(
    (error: unknown) => {
      console.error("Failed to update customer contact details:", error);
    },
  );

  const recipient = guestEmail(booking);
  if (recipient) {
    void sendEmail({
      to: recipient, userId: guestId, bookingId: booking.id,
      subject: `Booking received — ${booking.bookingReference}`,
      templateName: "booking-received",
      html: buildBookingReceivedHtml({
        guestName: guestName(booking), bookingReference: booking.bookingReference,
        apartmentTitle: booking.apartment.title,
        apartmentLocation: [booking.apartment.location, booking.apartment.city].filter(Boolean).join(", "),
        checkIn: formatEmailDate(booking.checkIn), checkOut: formatEmailDate(booking.checkOut),
        numberOfGuests: booking.numberOfGuests, numberOfNights: booking.numberOfNights,
        totalAmount: Number(booking.totalAmount), currency: booking.currency,
        managementUrl: `${env.FRONTEND_URL.replace(/\/$/, "")}/account/bookings/${booking.id}`,
        expiresAt: booking.expiresAt ? formatEmailDate(booking.expiresAt) : "soon",
      }),
    });
  }

  return serializeBooking(booking);
}

export interface GuestBookingResult {
  booking: ReturnType<typeof serializeBooking>;
  /** Raw token — returned once and never persisted in plain text. */
  accessToken: string;
}

/**
 * Create a booking without requiring an account. A secure access token is
 * generated so the guest can manage the booking later; only its SHA-256 hash
 * is stored.
 */
export async function createGuestBooking(
  input: CreateGuestBookingInput,
): Promise<GuestBookingResult> {
  const prepared = await prepareBooking({
    apartmentId: input.apartmentId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    numberOfGuests: input.numberOfGuests,
  });

  const accessToken = generateBookingAccessToken();
  const accessTokenHash = hashBookingAccessToken(accessToken);
  const tokenExpiresAt = accessTokenExpiry(input.checkOut);

  const booking = await prisma.$transaction(async (tx) => {
    await expireStalePendingBookings(input.apartmentId);
    await assertNoOverlap(tx, {
      apartmentId: input.apartmentId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });

    const ref = await uniqueBookingReference();

    const created = await tx.booking.create({
      data: {
        bookingReference: ref,
        guestId: null,
        apartmentId: input.apartmentId,
        status: BookingStatus.PENDING,
        guestFirstName: input.firstName,
        guestLastName: input.lastName,
        guestEmail: input.email,
        guestPhone: input.phone,
        guestCountry: input.country,
        specialRequests: input.specialRequests ?? null,
        arrivalTime: input.arrivalTime ?? null,
        additionalNotes: input.additionalNotes ?? null,
        bookingAccessTokenHash: accessTokenHash,
        bookingAccessTokenExpiresAt: tokenExpiresAt,
        termsAcceptedAt: new Date(),
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        numberOfGuests: input.numberOfGuests,
        numberOfNights: prepared.nights,
        nightlyPriceSnapshot: prepared.nightly,
        accommodationSubtotal: prepared.accommodationSubtotal,
        cleaningFeeSnapshot: prepared.cleaningFeeSnapshot,
        additionalFeesSnapshot: prepared.additionalFeesSnapshot,
        totalAmount: prepared.totalAmount,
        currency: "NGN",
        expiresAt: prepared.expiresAt,
      },
      include: bookingInclude,
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId: created.id,
        status: BookingStatus.PENDING,
        note: "Booking created by guest without an account.",
      },
    });

    return created;
  });

  const managementUrl = buildBookingManagementUrl(
    env.FRONTEND_URL,
    booking.bookingReference,
    accessToken,
  );

  void sendEmail({
    to: input.email,
    subject: `Booking received — ${booking.bookingReference}`,
    templateName: "booking-received",
    bookingId: booking.id,
    html: buildBookingReceivedHtml({
      guestName: `${input.firstName} ${input.lastName}`,
      bookingReference: booking.bookingReference,
      apartmentTitle: booking.apartment.title,
      apartmentLocation: prepared.apartmentLocation,
      checkIn: formatEmailDate(booking.checkIn),
      checkOut: formatEmailDate(booking.checkOut),
      numberOfGuests: booking.numberOfGuests,
      numberOfNights: booking.numberOfNights,
      totalAmount: Number(booking.totalAmount),
      currency: booking.currency,
      managementUrl,
      expiresAt: booking.expiresAt
        ? formatEmailDate(booking.expiresAt)
        : formatEmailDate(new Date(Date.now() + PENDING_EXPIRY_MINUTES * 60_000)),
    }),
  }).catch((error: unknown) => {
    console.error("Failed to send booking-received email:", error);
  });

  return { booking: serializeBooking(booking), accessToken };
}

// ---------------------------------------------------------------------------
// Guest: list own bookings
// ---------------------------------------------------------------------------

export async function listGuestBookings(
  guestId: string,
  query: GuestBookingQuery,
) {
  await expireStalePendingBookings();

  const where: Prisma.BookingWhereInput = { guestId };
  if (query.status) where.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map(serializeBooking),
    meta: paginationMeta(query.page, query.limit, total),
  };
}

// ---------------------------------------------------------------------------
// Guest: get single booking
// ---------------------------------------------------------------------------

export async function getGuestBooking(guestId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, guestId },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("Booking not found.", 404);
  return serializeBooking(booking);
}

// ---------------------------------------------------------------------------
// Guest: cancel booking
// ---------------------------------------------------------------------------

export async function cancelGuestBooking(
  guestId: string,
  bookingId: string,
  input: CancelBookingInput,
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, guestId },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("Booking not found.", 404);

  const cancellableByGuest: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.AWAITING_PAYMENT,
    BookingStatus.CONFIRMED,
  ];

  if (!cancellableByGuest.includes(booking.status)) {
    throw new AppError(
      `A ${booking.status.toLowerCase()} booking cannot be cancelled.`,
      400,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: input.reason,
        cancelledAt: new Date(),
        cancelledById: guestId,
      },
      include: bookingInclude,
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status: BookingStatus.CANCELLED,
        note: `Cancelled by guest: ${input.reason}`,
        changedById: guestId,
      },
    });

    return b;
  });

  const recipient = guestEmail(updated);
  if (recipient) {
    void sendEmail({
      to: recipient, userId: guestId, bookingId: updated.id,
      subject: `Booking cancelled — ${updated.bookingReference}`, templateName: "booking-cancelled",
      html: buildCancellationHtml({
        guestName: guestName(updated), bookingReference: updated.bookingReference, apartmentTitle: updated.apartment.title,
        apartmentLocation: [updated.apartment.location, updated.apartment.city].filter(Boolean).join(", "),
        checkIn: formatEmailDate(updated.checkIn), checkOut: formatEmailDate(updated.checkOut),
        numberOfGuests: updated.numberOfGuests, numberOfNights: updated.numberOfNights, totalAmount: Number(updated.totalAmount),
        currency: updated.currency, managementUrl: `${env.FRONTEND_URL.replace(/\/$/, "")}/account/bookings/${updated.id}`,
        reason: input.reason, cancelledAt: formatEmailDate(updated.cancelledAt ?? new Date()),
      }),
    });
  }

  return serializeBooking(updated);
}

// ---------------------------------------------------------------------------
// Guest (no account): access booking with a secure token
// ---------------------------------------------------------------------------

export async function getBookingByAccessToken(
  bookingReference: string,
  accessToken: string | null,
) {
  await expireStalePendingBookings();

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("Booking not found.", 404);
  assertBookingAccess(booking, accessToken);

  return serializeBooking(booking);
}

export async function cancelBookingByAccessToken(
  bookingReference: string,
  accessToken: string | null,
  input: CancelBookingInput,
) {
  await expireStalePendingBookings();

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("Booking not found.", 404);
  assertBookingAccess(booking, accessToken);

  const cancellableByGuest: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.AWAITING_PAYMENT,
    BookingStatus.CONFIRMED,
  ];

  if (!cancellableByGuest.includes(booking.status)) {
    throw new AppError(
      `A ${booking.status.toLowerCase()} booking cannot be cancelled.`,
      400,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: input.reason,
        cancelledAt: new Date(),
        cancelledById: null,
      },
      include: bookingInclude,
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        status: BookingStatus.CANCELLED,
        note: `Cancelled by guest: ${input.reason}`,
      },
    });

    return cancelled;
  });

  const recipient = guestEmail(updated);
  if (recipient) {
    const location = [updated.apartment.location, updated.apartment.city]
      .filter((part): part is string => Boolean(part))
      .join(", ");

    void sendEmail({
      to: recipient,
      subject: `Booking cancelled — ${updated.bookingReference}`,
      templateName: "booking-cancelled",
      bookingId: updated.id,
      html: buildCancellationHtml({
        guestName: guestName(updated),
        bookingReference: updated.bookingReference,
        apartmentTitle: updated.apartment.title,
        apartmentLocation: location,
        checkIn: formatEmailDate(updated.checkIn),
        checkOut: formatEmailDate(updated.checkOut),
        numberOfGuests: updated.numberOfGuests,
        numberOfNights: updated.numberOfNights,
        totalAmount: Number(updated.totalAmount),
        currency: updated.currency,
        managementUrl: accessToken
          ? buildBookingManagementUrl(
              env.FRONTEND_URL,
              updated.bookingReference,
              accessToken,
            )
          : `${env.FRONTEND_URL.replace(/\/$/, "")}/`,
        reason: input.reason,
        cancelledAt: new Date().toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }),
      }),
    }).catch((error: unknown) => {
      console.error("Failed to send booking-cancelled email:", error);
    });
  }

  return serializeBooking(updated);
}

// ---------------------------------------------------------------------------
// Host: list bookings for own apartments
// ---------------------------------------------------------------------------

export async function listHostBookings(
  hostId: string,
  query: HostBookingQuery,
) {
  await expireStalePendingBookings();

  const where: Prisma.BookingWhereInput = {
    apartment: { hostId },
  };

  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { bookingReference: { contains: query.search, mode: "insensitive" } },
      { guest: { fullName: { contains: query.search, mode: "insensitive" } } },
      {
        guestFirstName: { contains: query.search, mode: "insensitive" },
      },
      {
        guestLastName: { contains: query.search, mode: "insensitive" },
      },
      { guestEmail: { contains: query.search, mode: "insensitive" } },
      {
        apartment: {
          title: { contains: query.search, mode: "insensitive" },
        },
      },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map(serializeBooking),
    meta: paginationMeta(query.page, query.limit, total),
  };
}

// ---------------------------------------------------------------------------
// Host: get single booking (must belong to host's apartment)
// ---------------------------------------------------------------------------

export async function getHostBooking(hostId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, apartment: { hostId } },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("Booking not found.", 404);
  return serializeBooking(booking);
}

// ---------------------------------------------------------------------------
// Host: accept booking (PENDING → CONFIRMED)
// ---------------------------------------------------------------------------

export async function acceptHostBooking(hostId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, apartment: { hostId } },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("Booking not found.", 404);

  if (booking.status !== BookingStatus.PENDING) {
    throw new AppError("Only pending bookings can be accepted.", 400);
  }

  assertTransition(booking.status, BookingStatus.CONFIRMED);

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        expiresAt: null,
      },
      include: bookingInclude,
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status: BookingStatus.CONFIRMED,
        note: "Accepted by host.",
        changedById: hostId,
      },
    });

    return b;
  });

  return serializeBooking(updated);
}

// ---------------------------------------------------------------------------
// Host: decline booking (PENDING → DECLINED)
// ---------------------------------------------------------------------------

export async function declineHostBooking(
  hostId: string,
  bookingId: string,
  input: DeclineBookingInput,
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, apartment: { hostId } },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("Booking not found.", 404);

  if (booking.status !== BookingStatus.PENDING) {
    throw new AppError("Only pending bookings can be declined.", 400);
  }

  assertTransition(booking.status, BookingStatus.DECLINED);

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DECLINED,
        cancellationReason: input.reason,
        cancelledAt: new Date(),
        cancelledById: hostId,
      },
      include: bookingInclude,
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status: BookingStatus.DECLINED,
        note: `Declined by host: ${input.reason}`,
        changedById: hostId,
      },
    });

    return b;
  });

  return serializeBooking(updated);
}

// ---------------------------------------------------------------------------
// Admin: list all bookings
// ---------------------------------------------------------------------------

export async function listAdminBookings(query: AdminBookingQuery) {
  await expireStalePendingBookings();

  const where: Prisma.BookingWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.guestId) where.guestId = query.guestId;
  if (query.apartmentId) where.apartmentId = query.apartmentId;
  if (query.search) {
    where.OR = [
      { bookingReference: { contains: query.search, mode: "insensitive" } },
      { guest: { fullName: { contains: query.search, mode: "insensitive" } } },
      { guest: { email: { contains: query.search, mode: "insensitive" } } },
      { guestFirstName: { contains: query.search, mode: "insensitive" } },
      { guestLastName: { contains: query.search, mode: "insensitive" } },
      { guestEmail: { contains: query.search, mode: "insensitive" } },
      {
        apartment: {
          title: { contains: query.search, mode: "insensitive" },
        },
      },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map(serializeBooking),
    meta: paginationMeta(query.page, query.limit, total),
  };
}

// ---------------------------------------------------------------------------
// Admin: get single booking
// ---------------------------------------------------------------------------

export async function getAdminBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("Booking not found.", 404);
  return serializeBooking(booking);
}

// ---------------------------------------------------------------------------
// Admin: change booking status
// ---------------------------------------------------------------------------

export async function adminChangeBookingStatus(
  adminId: string,
  bookingId: string,
  input: AdminStatusChangeInput,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("Booking not found.", 404);

  assertTransition(booking.status, input.status);

  const updated = await prisma.$transaction(async (tx) => {
    const extraData: Prisma.BookingUpdateInput = {};

    if (
      input.status === BookingStatus.CANCELLED ||
      input.status === BookingStatus.DECLINED
    ) {
      extraData.cancellationReason = input.note;
      extraData.cancelledAt = new Date();
      extraData.cancelledById = adminId;
    }

    if (
      input.status === BookingStatus.CONFIRMED ||
      input.status === BookingStatus.ACTIVE
    ) {
      extraData.expiresAt = null;
    }

    const b = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: input.status,
        adminNotes: input.note,
        ...extraData,
      },
      include: bookingInclude,
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status: input.status,
        note: input.note ?? `Status changed to ${input.status} by admin.`,
        changedById: adminId,
      },
    });

    return b;
  });

  return serializeBooking(updated);
}

// ---------------------------------------------------------------------------
// Public: get booked date ranges for an apartment (for UI calendar)
// ---------------------------------------------------------------------------

export async function getApartmentBlockedDates(apartmentId: string) {
  await expireStalePendingBookings(apartmentId);

  const bookings = await prisma.booking.findMany({
    where: {
      apartmentId,
      status: { in: BLOCKING_STATUSES },
    },
    select: {
      checkIn: true,
      checkOut: true,
    },
    orderBy: { checkIn: "asc" },
  });

  return bookings.map((b) => ({
    checkIn: b.checkIn.toISOString().split("T")[0],
    checkOut: b.checkOut.toISOString().split("T")[0],
  }));
}

// ---------------------------------------------------------------------------
// Admin stats
// ---------------------------------------------------------------------------

export async function getAdminBookingStats() {
  const grouped = await prisma.booking.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = Object.fromEntries(
    Object.values(BookingStatus).map((s) => [s, 0]),
  ) as Record<BookingStatus, number>;

  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }

  const total = Object.values(counts).reduce((sum, v) => sum + v, 0);

  return { total, ...counts };
}
