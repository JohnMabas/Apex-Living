import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { paystackInitialize, paystackVerify, validateWebhookSignature } from "./paystackService.js";
import { sendEmail, buildReceiptHtml, buildPaymentFailedHtml } from "./emailService.js";
import type { InitializePaymentInput } from "../validators/paymentValidators.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generatePaymentReference(): string {
  return `PAY-${randomBytes(6).toString("hex").toUpperCase()}`;
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
    guest: { select: { id: true, fullName: true, email: true } },
  },
} as const;

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

  if (!booking.guest.email) {
    throw new AppError(
      "Your account needs a verified email address to complete payment.",
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
      email: booking.guest.email,
      amountNGN,
      reference: ref,
      callbackUrl: `${env.PAYSTACK_CALLBACK_URL ?? `${env.FRONTEND_URL}/payment/success`}?reference=${ref}`,
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

  // Send receipt email after SUCCESS
  if (newStatus === PaymentStatus.SUCCESS && updated && payment.booking.guest.email) {
    void sendReceiptEmail(updated.booking, payment.paymentReference, updated.paidAt);
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

        if (payment.booking.guest.email) {
          void sendReceiptEmail(payment.booking, payment.paymentReference, new Date(payload.data.paid_at));
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
        booking: { include: { apartment: { select: { title: true, city: true } } } },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: params.limit,
    }),
    prisma.payment.count({ where }),
  ]);
  return {
    payments: payments.map((p) => ({ ...serializePayment(p), user: (p as { user?: { id: string; fullName: string; email: string | null } }).user })),
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
      include: { payment: { include: { booking: { select: { bookingReference: true } }, user: { select: { fullName: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: params.limit,
    }),
    prisma.refundRequest.count({ where }),
  ]);
  return {
    refunds,
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
// Receipt HTML
// ---------------------------------------------------------------------------

export async function getReceiptHtml(userId: string, paymentReference: string): Promise<string> {
  const payment = await prisma.payment.findUnique({
    where: { paymentReference },
    include: { booking: { ...bookingWithApartment } },
  });

  if (!payment || payment.userId !== userId) throw new AppError("Receipt not found.", 404);
  if (payment.status !== PaymentStatus.SUCCESS) {
    throw new AppError("Receipt is only available for successful payments.", 400);
  }

  const b = payment.booking;
  return buildReceiptHtml({
    guestName: b.guest.fullName,
    bookingReference: b.bookingReference,
    paymentReference,
    apartmentTitle: b.apartment.title,
    apartmentLocation: `${b.apartment.location ?? ""}, ${b.apartment.city}`,
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
    bookingUrl: `${env.FRONTEND_URL}/account/bookings/${b.id}`,
  });
}

// ---------------------------------------------------------------------------
// Send receipt email helper
// ---------------------------------------------------------------------------

async function sendReceiptEmail(
  booking: { id: string; bookingReference: string; checkIn: Date; checkOut: Date; numberOfGuests: number; numberOfNights: number; nightlyPriceSnapshot: Prisma.Decimal; accommodationSubtotal: Prisma.Decimal; cleaningFeeSnapshot: Prisma.Decimal | null; additionalFeesSnapshot: Prisma.Decimal | null; totalAmount: Prisma.Decimal; currency: string; guest: { fullName: string; email: string | null }; apartment: { title: string; city: string; location: string } },
  paymentReference: string,
  paidAt: Date | null,
) {
  if (!booking.guest.email) return;

  const html = buildReceiptHtml({
    guestName: booking.guest.fullName,
    bookingReference: booking.bookingReference,
    paymentReference,
    apartmentTitle: booking.apartment.title,
    apartmentLocation: `${booking.apartment.location}, ${booking.apartment.city}`,
    checkIn: booking.checkIn.toISOString().split("T")[0],
    checkOut: booking.checkOut.toISOString().split("T")[0],
    numberOfGuests: booking.numberOfGuests,
    numberOfNights: booking.numberOfNights,
    nightlyPrice: Number(booking.nightlyPriceSnapshot),
    cleaningFee: money(booking.cleaningFeeSnapshot),
    additionalFees: money(booking.additionalFeesSnapshot),
    totalAmount: Number(booking.totalAmount),
    currency: booking.currency,
    paidAt: paidAt?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0],
    bookingUrl: `${env.FRONTEND_URL}/account/bookings/${booking.id}`,
  });

  await sendEmail({
    to: booking.guest.email,
    subject: `Your Nestora payment receipt — ${booking.bookingReference}`,
    html,
    templateName: "payment-receipt",
    userId: undefined,
  });
}
