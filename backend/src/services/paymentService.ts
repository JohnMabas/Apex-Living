import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { paystackInitialize, paystackVerify, validateWebhookSignature } from "./paystackService.js";
import {
  sendEmail,
  buildReceiptHtml,
  buildPaymentFailedHtml,
  buildBookingConfirmedHtml,
} from "./emailService.js";
import {
  assertBookingAccess,
  buildBookingManagementUrl,
} from "../utils/bookingAccessToken.js";
import { guestEmail, guestName } from "../utils/bookingGuest.js";
import { buildReceiptPdf } from "../utils/pdf.js";
import type {
  InitializePaymentInput,
  InitializeGuestPaymentInput,
} from "../validators/paymentValidators.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generatePaymentReference(): string {
  return `PAY-${randomBytes(6).toString("hex").toUpperCase()}`;
}

function paymentCallbackUrl(reference: string, accessToken?: string): string {
  const base =
    env.PAYSTACK_CALLBACK_URL ?? `${env.FRONTEND_URL}/payment/success`;
  const url = new URL(base);
  url.searchParams.set("reference", reference);
  if (accessToken) {
    url.searchParams.set("guest", "1");
    url.searchParams.set("token", accessToken);
  }
  return url.toString();
}

function money(v: Prisma.Decimal | null): number | null {
  return v === null ? null : Number(v);
}

const bookingWithApartment = {
  include: {
    apartment: {
      select: {
        id: true, title: true, city: true, location: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    },
    guest: { select: { id: true, fullName: true, email: true, phone: true } },
  },
} as const;

type PaymentWithBooking = Prisma.PaymentGetPayload<{
  include: { booking: typeof bookingWithApartment };
}>;

type BookingWithDetails = PaymentWithBooking["booking"];

// ---------------------------------------------------------------------------
// Initialize payment
// ---------------------------------------------------------------------------

export async function initializePayment(
  userId: string,
  input: InitializePaymentInput,
) {
  const booking = await prisma.booking.findFirst({
    where: { id: input.bookingId, guestId: userId },
    ...bookingWithApartment,
  });

  if (!booking) throw new AppError("Booking not found.", 404);

  const payableStatuses: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.AWAITING_PAYMENT,
  ];
  if (!payableStatuses.includes(booking.status)) {
    throw new AppError(
      `This booking cannot be paid — current status: ${booking.status}.`,
      400,
    );
  }

  if (booking.expiresAt && booking.expiresAt < new Date()) {
    throw new AppError("This booking has expired. Please create a new booking.", 400);
  }

  const email = guestEmail(booking);
  if (!email) {
    throw new AppError(
      "A verified email address is required to complete payment.",
      400,
    );
  }

  // Check for an existing successful payment
  const existing = await prisma.payment.findFirst({
    where: { bookingId: booking.id, status: PaymentStatus.SUCCESS },
  });
  if (existing) {
    throw new AppError("This booking has already been paid.", 409);
  }

  const ref = generatePaymentReference();
  const amountNGN = Number(booking.totalAmount);

  // Create payment record before calling Paystack
  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId,
      paymentReference: ref,
      amount: booking.totalAmount,
      currency: booking.currency,
      status: PaymentStatus.INITIALIZED,
      metadata: {
        bookingReference: booking.bookingReference,
        apartmentTitle: booking.apartment.title,
      },
    },
  });

  try {
    const pstk = await paystackInitialize({
      email,
      amountNGN,
      reference: ref,
      callbackUrl: paymentCallbackUrl(ref),
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        guestId: userId,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paystackReference: pstk.reference,
        status: PaymentStatus.PENDING,
      },
    });

    // Move booking to AWAITING_PAYMENT
    if (booking.status === BookingStatus.PENDING) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.AWAITING_PAYMENT },
      });
    }

    return {
      paymentReference: ref,
      authorizationUrl: pstk.authorization_url,
      amount: amountNGN,
      currency: booking.currency,
      booking: {
        id: booking.id,
        reference: booking.bookingReference,
        apartment: booking.apartment.title,
        checkIn: booking.checkIn.toISOString().split("T")[0],
        checkOut: booking.checkOut.toISOString().split("T")[0],
        totalAmount: amountNGN,
      },
    };
  } catch (err) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED, failureReason: String(err) },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Initialize guest payment (no account)
// ---------------------------------------------------------------------------

export async function initializeGuestPayment(
  input: InitializeGuestPaymentInput,
) {
  const booking = await prisma.booking.findFirst({
    where: { id: input.bookingId },
    ...bookingWithApartment,
  });

  if (!booking) throw new AppError("Booking not found.", 404);
  if (booking.guestId) {
    throw new AppError(
      "This booking belongs to an account. Please sign in to continue.",
      403,
    );
  }

  assertBookingAccess(booking, input.accessToken);

  const payableStatuses: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.AWAITING_PAYMENT,
  ];
  if (!payableStatuses.includes(booking.status)) {
    throw new AppError(
      `This booking cannot be paid — current status: ${booking.status}.`,
      400,
    );
  }

  if (booking.expiresAt && booking.expiresAt < new Date()) {
    throw new AppError(
      "This booking has expired. Please create a new booking.",
      400,
    );
  }

  const email = guestEmail(booking);
  if (!email) {
    throw new AppError(
      "A verified email address is required to complete payment.",
      400,
    );
  }

  const existing = await prisma.payment.findFirst({
    where: { bookingId: booking.id, status: PaymentStatus.SUCCESS },
  });
  if (existing) {
    throw new AppError("This booking has already been paid.", 409);
  }

  const ref = generatePaymentReference();
  const amountNGN = Number(booking.totalAmount);

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId: null,
      paymentReference: ref,
      amount: booking.totalAmount,
      currency: booking.currency,
      status: PaymentStatus.INITIALIZED,
      metadata: {
        bookingReference: booking.bookingReference,
        apartmentTitle: booking.apartment.title,
        guestBooking: true,
      },
    },
  });

  try {
    const pstk = await paystackInitialize({
      email,
      amountNGN,
      reference: ref,
      callbackUrl: paymentCallbackUrl(ref, input.accessToken),
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        guestBooking: true,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paystackReference: pstk.reference,
        status: PaymentStatus.PENDING,
      },
    });

    if (booking.status === BookingStatus.PENDING) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.AWAITING_PAYMENT },
      });
    }

    return {
      paymentReference: ref,
      authorizationUrl: pstk.authorization_url,
      amount: amountNGN,
      currency: booking.currency,
      booking: {
        id: booking.id,
        reference: booking.bookingReference,
        apartment: booking.apartment.title,
        checkIn: booking.checkIn.toISOString().split("T")[0],
        checkOut: booking.checkOut.toISOString().split("T")[0],
        totalAmount: amountNGN,
      },
    };
  } catch (err) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED, failureReason: String(err) },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Verify payment
// ---------------------------------------------------------------------------

export async function verifyPayment(userId: string, paymentReference: string) {
  const payment = await prisma.payment.findUnique({
    where: { paymentReference },
    include: {
      booking: { ...bookingWithApartment },
    },
  });

  if (!payment) throw new AppError("Payment record not found.", 404);
  if (payment.userId !== userId) throw new AppError("Access denied.", 403);

  // Idempotent: already processed
  if (payment.status === PaymentStatus.SUCCESS) {
    return serializePayment(payment);
  }

  if (!payment.paystackReference) {
    throw new AppError("Payment was not initialized with the provider.", 400);
  }

  const pstkData = await paystackVerify(payment.paystackReference);
  const newStatus = pstkStatusToLocal(pstkData.status);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        gatewayResponse: pstkData.gateway_response,
        paymentMethod: pstkData.channel,
        paidAt: pstkData.paid_at ? new Date(pstkData.paid_at) : null,
        failureReason: newStatus === PaymentStatus.FAILED ? pstkData.gateway_response : null,
      },
    });

    if (newStatus === PaymentStatus.SUCCESS) {
      // Amount & currency check
      const expectedKobo = Math.round(Number(payment.amount) * 100);
      if (pstkData.amount !== expectedKobo || pstkData.currency !== payment.currency) {
        throw new AppError("Payment amount or currency mismatch.", 400);
      }

      await confirmBookingAfterPayment(tx, payment.booking.id, payment.id);
    }
  });

  const updated = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: { booking: { ...bookingWithApartment } },
  });

  if (updated) {
    const recipient = guestEmail(updated.booking);
    if (recipient && newStatus === PaymentStatus.SUCCESS) {
      void sendBookingConfirmationEmail(
        updated.booking,
        updated.paymentReference,
        updated.paidAt,
        `${env.FRONTEND_URL.replace(/\/$/, "")}/account/bookings/${updated.booking.id}`,
      );
    } else if (recipient && newStatus === PaymentStatus.FAILED) {
      void sendPaymentFailedEmail(
        updated.booking,
        updated.failureReason ?? "The payment was declined.",
        `${env.FRONTEND_URL.replace(/\/$/, "")}/account/bookings/${updated.booking.id}`,
      );
    }
  }

  return serializePayment(updated!);
}

// ---------------------------------------------------------------------------
// Verify guest payment with a booking access token
// ---------------------------------------------------------------------------

export async function verifyGuestPayment(
  paymentReference: string,
  accessToken: string | null,
) {
  const payment = await prisma.payment.findUnique({
    where: { paymentReference },
    include: { booking: { ...bookingWithApartment } },
  });

  if (!payment || payment.userId !== null) {
    throw new AppError("Payment record not found.", 404);
  }

  assertBookingAccess(payment.booking, accessToken);

  if (payment.status === PaymentStatus.SUCCESS) {
    return serializePayment(payment);
  }

  if (!payment.paystackReference) {
    throw new AppError("Payment was not initialized with the provider.", 400);
  }

  const pstkData = await paystackVerify(payment.paystackReference);
  const newStatus = pstkStatusToLocal(pstkData.status);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        gatewayResponse: pstkData.gateway_response,
        paymentMethod: pstkData.channel,
        paidAt: pstkData.paid_at ? new Date(pstkData.paid_at) : null,
        failureReason:
          newStatus === PaymentStatus.FAILED
            ? pstkData.gateway_response
            : null,
      },
    });

    if (newStatus === PaymentStatus.SUCCESS) {
      const expectedKobo = Math.round(Number(payment.amount) * 100);
      if (
        pstkData.amount !== expectedKobo ||
        pstkData.currency !== payment.currency
      ) {
        throw new AppError("Payment amount or currency mismatch.", 400);
      }

      await confirmBookingAfterPayment(tx, payment.booking.id, payment.id);
    }
  });

  const updated = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: { booking: { ...bookingWithApartment } },
  });

  if (updated && accessToken) {
    const recipient = guestEmail(updated.booking);
    const managementUrl = buildBookingManagementUrl(
      env.FRONTEND_URL,
      updated.booking.bookingReference,
      accessToken,
    );

    if (recipient && newStatus === PaymentStatus.SUCCESS) {
      void sendBookingConfirmationEmail(
        updated.booking,
        updated.paymentReference,
        updated.paidAt,
        managementUrl,
      );
    } else if (recipient && newStatus === PaymentStatus.FAILED) {
      void sendPaymentFailedEmail(
        updated.booking,
        updated.failureReason ?? "The payment was declined.",
        managementUrl,
      );
    }
  }

  return serializePayment(updated!);
}

// ---------------------------------------------------------------------------
// Process webhook
// ---------------------------------------------------------------------------

export async function processWebhook(rawBody: Buffer, signatureHeader: string) {
  if (!validateWebhookSignature(rawBody, signatureHeader)) {
    throw new AppError("Invalid webhook signature.", 401);
  }

  const payload = JSON.parse(rawBody.toString()) as {
    event: string;
    data: { reference: string; id: string | number; status: string; amount: number; currency: string; paid_at: string; gateway_response: string; channel: string };
  };

  const eventId = `${payload.event}:${payload.data?.id ?? Date.now()}`;

  // Idempotency check
  const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
  if (existing?.processed) return { received: true };

  await prisma.webhookEvent.upsert({
    where: { eventId },
    create: { eventId, event: payload.event, payload: payload as unknown as Prisma.InputJsonValue },
    update: {},
  });

  if (payload.event === "charge.success") {
    const ref = payload.data.reference;
    const payment = await prisma.payment.findUnique({
      where: { paymentReference: ref },
      include: { booking: { ...bookingWithApartment } },
    });

    if (payment && payment.status !== PaymentStatus.SUCCESS) {
      const expectedKobo = Math.round(Number(payment.amount) * 100);
      const amountOk = payload.data.amount === expectedKobo;
      const currencyOk = payload.data.currency === payment.currency;

      if (amountOk && currencyOk) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              gatewayResponse: payload.data.gateway_response,
              paymentMethod: payload.data.channel,
              paidAt: payload.data.paid_at ? new Date(payload.data.paid_at) : new Date(),
            },
          });
          await confirmBookingAfterPayment(tx, payment.booking.id, payment.id);
        });

        const recipient = guestEmail(payment.booking);
        if (recipient) {
          const booking = payment.booking;
          const managementUrl = booking.guestId
            ? `${env.FRONTEND_URL.replace(/\/$/, "")}/account/bookings/${booking.id}`
            : `${env.FRONTEND_URL.replace(/\/$/, "")}/bookings/manage/${encodeURIComponent(booking.bookingReference)}`;
          void sendBookingConfirmationEmail(
            booking,
            payment.paymentReference,
            payment.paidAt ?? new Date(payload.data.paid_at),
            managementUrl,
          );
        }
      }
    }

    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processed: true, processedAt: new Date() },
    });
  }

  return { received: true };
}

// ---------------------------------------------------------------------------
// Confirm booking (inside transaction)
// ---------------------------------------------------------------------------

async function confirmBookingAfterPayment(
  tx: Prisma.TransactionClient,
  bookingId: string,
  paymentId: string,
) {
  const booking = await tx.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;

  const confirmable: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.AWAITING_PAYMENT,
  ];
  if (!confirmable.includes(booking.status)) return;

  await tx.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CONFIRMED },
  });

  await tx.bookingStatusHistory.create({
    data: {
      bookingId,
      status: BookingStatus.CONFIRMED,
      note: `Confirmed after payment ${paymentId}.`,
    },
  });
}

// ---------------------------------------------------------------------------
// Paystack status → local status
// ---------------------------------------------------------------------------

function pstkStatusToLocal(pstkStatus: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    success: PaymentStatus.SUCCESS,
    failed: PaymentStatus.FAILED,
    abandoned: PaymentStatus.ABANDONED,
    pending: PaymentStatus.PENDING,
  };
  return map[pstkStatus] ?? PaymentStatus.FAILED;
}

// ---------------------------------------------------------------------------
// List guest payments
// ---------------------------------------------------------------------------

export async function listGuestPayments(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where = { userId };
  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      include: { booking: { include: { apartment: { select: { title: true, city: true, location: true } } } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments: payments.map(serializePayment),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

// ---------------------------------------------------------------------------
// Get single payment (guest)
// ---------------------------------------------------------------------------

export async function getGuestPayment(userId: string, paymentReference: string) {
  const payment = await prisma.payment.findUnique({
    where: { paymentReference },
    include: { booking: { ...bookingWithApartment } },
  });
  if (!payment || payment.userId !== userId) throw new AppError("Payment not found.", 404);
  return serializePayment(payment);
}

// ---------------------------------------------------------------------------
// Admin: list payments
// ---------------------------------------------------------------------------

export async function listAdminPayments(params: { search?: string; status?: string; page: number; limit: number }) {
  const where: Prisma.PaymentWhereInput = {};
  if (params.status) where.status = params.status as PaymentStatus;
  if (params.search) {
    where.OR = [
      { paymentReference: { contains: params.search, mode: "insensitive" } },
      { booking: { bookingReference: { contains: params.search, mode: "insensitive" } } },
      { user: { fullName: { contains: params.search, mode: "insensitive" } } },
    ];
  }
  const skip = (params.page - 1) * params.limit;
  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            apartment: { select: { title: true, city: true } },
            guest: { select: { id: true, fullName: true, email: true } },
          },
        },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: params.limit,
    }),
    prisma.payment.count({ where }),
  ]);
  return {
    payments: payments.map((p) => {
      const serialized = serializePayment(p);
      return {
        ...serialized,
        user: p.user,
        booking: p.booking
          ? {
              ...serialized.booking,
              guest: {
                id: p.booking.guestId,
                fullName: guestName(p.booking),
                email: guestEmail(p.booking),
              },
            }
          : undefined,
      };
    }),
    meta: { page: params.page, limit: params.limit, total, totalPages: Math.max(1, Math.ceil(total / params.limit)) },
  };
}

// ---------------------------------------------------------------------------
// Admin: list refund requests
// ---------------------------------------------------------------------------

export async function listAdminRefunds(params: { status?: string; page: number; limit: number }) {
  const where: Prisma.RefundRequestWhereInput = {};
  if (params.status) where.status = params.status as Prisma.EnumRefundStatusFilter;
  const skip = (params.page - 1) * params.limit;
  const [refunds, total] = await prisma.$transaction([
    prisma.refundRequest.findMany({
      where,
      include: {
        payment: {
          include: {
            booking: {
              select: {
                bookingReference: true,
                guestFirstName: true,
                guestLastName: true,
                guestEmail: true,
                guest: { select: { fullName: true, email: true } },
              },
            },
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: params.limit,
    }),
    prisma.refundRequest.count({ where }),
  ]);
  return {
    refunds: refunds.map((refund) => ({
      ...refund,
      payment: refund.payment
        ? {
            ...refund.payment,
            booking: refund.payment.booking
              ? {
                  bookingReference: refund.payment.booking.bookingReference,
                  guest: {
                    fullName: guestName(refund.payment.booking),
                    email: guestEmail(refund.payment.booking),
                  },
                }
              : null,
          }
        : null,
    })),
    meta: { page: params.page, limit: params.limit, total, totalPages: Math.max(1, Math.ceil(total / params.limit)) },
  };
}

// ---------------------------------------------------------------------------
// Email preferences
// ---------------------------------------------------------------------------

export async function getEmailPreferences(userId: string) {
  const pref = await prisma.emailPreference.findUnique({ where: { userId } });
  if (!pref) {
    return { promotionalEmailsEnabled: false, consentGivenAt: null, unsubscribedAt: null };
  }
  return {
    promotionalEmailsEnabled: pref.promotionalEmailsEnabled,
    consentGivenAt: pref.consentGivenAt?.toISOString() ?? null,
    unsubscribedAt: pref.unsubscribedAt?.toISOString() ?? null,
  };
}

export async function updateEmailPreferences(
  userId: string,
  data: { promotionalEmailsEnabled: boolean; consentSource?: string },
) {
  const pref = await prisma.emailPreference.upsert({
    where: { userId },
    create: {
      userId,
      promotionalEmailsEnabled: data.promotionalEmailsEnabled,
      consentGivenAt: data.promotionalEmailsEnabled ? new Date() : null,
      unsubscribedAt: data.promotionalEmailsEnabled ? null : new Date(),
      consentSource: data.consentSource ?? "account-settings",
    },
    update: {
      promotionalEmailsEnabled: data.promotionalEmailsEnabled,
      consentGivenAt: data.promotionalEmailsEnabled ? new Date() : undefined,
      unsubscribedAt: data.promotionalEmailsEnabled ? null : new Date(),
    },
  });
  return pref;
}

export async function unsubscribeByToken(token: string) {
  const pref = await prisma.emailPreference.findUnique({ where: { unsubscribeToken: token } });
  if (!pref) throw new AppError("Invalid unsubscribe token.", 400);

  await prisma.emailPreference.update({
    where: { id: pref.id },
    data: { promotionalEmailsEnabled: false, unsubscribedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Cookie consent
// ---------------------------------------------------------------------------

export async function saveCookieConsent(
  data: { userId?: string; sessionToken?: string; necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean; policyVersion: string },
) {
  return prisma.cookieConsent.create({ data });
}

export async function getCookieConsent(userId?: string, sessionToken?: string) {
  if (!userId && !sessionToken) return null;
  return prisma.cookieConsent.findFirst({
    where: { ...(userId ? { userId } : { sessionToken }) },
    orderBy: { consentedAt: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Serializer
// ---------------------------------------------------------------------------

function serializePayment(p: { id: string; paymentReference: string; paystackReference: string | null; amount: Prisma.Decimal; currency: string; status: PaymentStatus; paymentMethod: string | null; gatewayResponse: string | null; paidAt: Date | null; failureReason: string | null; createdAt: Date; updatedAt: Date; booking?: { bookingReference: string; apartment: { title: string; city?: string; location?: string } } }) {
  return {
    id: p.id,
    paymentReference: p.paymentReference,
    paystackReference: p.paystackReference,
    amount: Number(p.amount),
    currency: p.currency,
    status: p.status,
    paymentMethod: p.paymentMethod,
    gatewayResponse: p.gatewayResponse,
    paidAt: p.paidAt?.toISOString() ?? null,
    failureReason: p.failureReason,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    booking: p.booking
      ? {
          bookingReference: p.booking.bookingReference,
          apartment: { title: p.booking.apartment.title, city: p.booking.apartment.city ?? "", location: p.booking.apartment.location ?? "" },
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Receipt helpers
// ---------------------------------------------------------------------------

function locationLabel(booking: BookingWithDetails): string {
  return [booking.apartment.location, booking.apartment.city]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function receiptPdf(
  booking: BookingWithDetails,
  paymentReference: string,
  paidAt: Date | null,
): Buffer {
  return buildReceiptPdf({
    guestName: guestName(booking),
    bookingReference: booking.bookingReference,
    paymentReference,
    apartmentTitle: booking.apartment.title,
    apartmentLocation: locationLabel(booking),
    checkIn: booking.checkIn.toISOString().split("T")[0],
    checkOut: booking.checkOut.toISOString().split("T")[0],
    numberOfGuests: booking.numberOfGuests,
    numberOfNights: booking.numberOfNights,
    nightlyPrice: Number(booking.nightlyPriceSnapshot),
    cleaningFee: money(booking.cleaningFeeSnapshot),
    additionalFees: money(booking.additionalFeesSnapshot),
    totalAmount: Number(booking.totalAmount),
    currency: booking.currency,
    paidAt: (paidAt ?? new Date()).toISOString().split("T")[0],
  });
}

export async function getReceiptHtml(
  userId: string,
  paymentReference: string,
): Promise<string> {
  const payment = await prisma.payment.findUnique({
    where: { paymentReference },
    include: { booking: { ...bookingWithApartment } },
  });

  if (!payment || payment.userId !== userId)
    throw new AppError("Receipt not found.", 404);
  if (payment.status !== PaymentStatus.SUCCESS) {
    throw new AppError(
      "Receipt is only available for successful payments.",
      400,
    );
  }

  const b = payment.booking;
  return buildReceiptHtml({
    guestName: guestName(b),
    bookingReference: b.bookingReference,
    paymentReference,
    apartmentTitle: b.apartment.title,
    apartmentLocation: locationLabel(b),
    checkIn: b.checkIn.toISOString().split("T")[0],
    checkOut: b.checkOut.toISOString().split("T")[0],
    numberOfGuests: b.numberOfGuests,
    numberOfNights: b.numberOfNights,
    nightlyPrice: Number(b.nightlyPriceSnapshot),
    cleaningFee: money(b.cleaningFeeSnapshot),
    additionalFees: money(b.additionalFeesSnapshot),
    totalAmount: Number(b.totalAmount),
    currency: b.currency,
    paidAt: payment.paidAt?.toISOString().split("T")[0] ?? "",
    bookingUrl: b.guestId
      ? `${env.FRONTEND_URL}/account/bookings/${b.id}`
      : `${env.FRONTEND_URL}/bookings/manage/${encodeURIComponent(b.bookingReference)}`,
  });
}

/** Download a PDF receipt for a guest booking using its access token. */
export async function getGuestReceiptPdf(
  paymentReference: string,
  accessToken: string | null,
): Promise<{ fileName: string; buffer: Buffer }> {
  const payment = await prisma.payment.findUnique({
    where: { paymentReference },
    include: { booking: { ...bookingWithApartment } },
  });

  if (!payment || payment.userId !== null) {
    throw new AppError("Receipt not found.", 404);
  }

  assertBookingAccess(payment.booking, accessToken);

  if (payment.status !== PaymentStatus.SUCCESS) {
    throw new AppError(
      "Receipt is only available for successful payments.",
      400,
    );
  }

  return {
    fileName: `Nestora-Receipt-${payment.booking.bookingReference}.pdf`,
    buffer: receiptPdf(payment.booking, paymentReference, payment.paidAt),
  };
}

async function sendBookingConfirmationEmail(
  booking: BookingWithDetails,
  paymentReference: string,
  paidAt: Date | null,
  managementUrl: string,
): Promise<void> {
  const recipient = guestEmail(booking);
  if (!recipient) return;

  const paidDate = paidAt ?? new Date();
  const pdf = receiptPdf(booking, paymentReference, paidDate);

  const managementUrlForReceipt = managementUrl;
  await sendEmail({
    to: recipient,
    subject: `Payment receipt — ${booking.bookingReference}`,
    templateName: "payment-receipt",
    bookingId: booking.id,
    idempotencyKey: `payment-receipt:${paymentReference}`,
    html: buildReceiptHtml({
      guestName: guestName(booking),
      bookingReference: booking.bookingReference,
      paymentReference,
      apartmentTitle: booking.apartment.title,
      apartmentLocation: locationLabel(booking),
      checkIn: booking.checkIn.toISOString().split("T")[0],
      checkOut: booking.checkOut.toISOString().split("T")[0],
      numberOfGuests: booking.numberOfGuests,
      numberOfNights: booking.numberOfNights,
      nightlyPrice: Number(booking.nightlyPriceSnapshot),
      cleaningFee: money(booking.cleaningFeeSnapshot),
      additionalFees: money(booking.additionalFeesSnapshot),
      totalAmount: Number(booking.totalAmount),
      currency: booking.currency,
      paidAt: paidDate.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }),
      bookingUrl: managementUrlForReceipt,
    }),
  });

  const html = buildBookingConfirmedHtml({
    guestName: guestName(booking),
    bookingReference: booking.bookingReference,
    apartmentTitle: booking.apartment.title,
    apartmentLocation: locationLabel(booking),
    checkIn: booking.checkIn.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }),
    checkOut: booking.checkOut.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }),
    numberOfGuests: booking.numberOfGuests,
    numberOfNights: booking.numberOfNights,
    totalAmount: Number(booking.totalAmount),
    currency: booking.currency,
    managementUrl,
    paymentReference,
    paidAt: paidDate.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }),
  });

  await sendEmail({
    to: recipient,
    subject: `Booking confirmed — ${booking.bookingReference}`,
    html,
    templateName: "booking-confirmation",
    bookingId: booking.id,
    idempotencyKey: `booking-confirmation:${booking.id}`,
    attachments: [
      {
        name: `Nestora-Receipt-${booking.bookingReference}.pdf`,
        content: pdf.toString("base64"),
      },
    ],
  });
}

async function sendPaymentFailedEmail(
  booking: BookingWithDetails,
  reason: string,
  retryUrl: string,
): Promise<void> {
  const recipient = guestEmail(booking);
  if (!recipient) return;

  await sendEmail({
    to: recipient,
    subject: `Payment failed — ${booking.bookingReference}`,
    html: buildPaymentFailedHtml({
      guestName: guestName(booking),
      bookingReference: booking.bookingReference,
      apartmentTitle: booking.apartment.title,
      reason,
      retryUrl,
    }),
    templateName: "payment-failed",
    bookingId: booking.id,
  });
}
