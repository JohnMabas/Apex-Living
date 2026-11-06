import { BookingStatus, JobStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { sendEmail, buildReminderHtml, retryDueEmails } from "./emailService.js";
import { guestEmail, guestName } from "../utils/bookingGuest.js";

// ---------------------------------------------------------------------------
// Schedule a reminder job
// ---------------------------------------------------------------------------

export async function scheduleBookingReminders(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { expiresAt: true, createdAt: true },
  });
  if (!booking?.expiresAt) return;

  const created = booking.createdAt.getTime();
  const expires = booking.expiresAt.getTime();
  const now = Date.now();

  const times: number[] = [
    created + 15 * 60 * 1000,   // 15 min after creation
    created + 60 * 60 * 1000,   // 1 hour after creation
    expires - 5 * 60 * 1000,    // 5 min before expiry
  ];

  for (const runAt of times) {
    if (runAt > now) {
      await prisma.jobQueue.create({
        data: {
          jobType: "BOOKING_REMINDER",
          payload: { bookingId },
          runAt: new Date(runAt),
        },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Process due jobs
// ---------------------------------------------------------------------------

export async function processDueJobs(): Promise<void> {
  await retryDueEmails();
  const jobs = await prisma.jobQueue.findMany({
    where: {
      status: JobStatus.PENDING,
      runAt: { lte: new Date() },
    },
    take: 20,
    orderBy: { runAt: "asc" },
  });

  for (const job of jobs) {
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: JobStatus.PROCESSING, attempts: { increment: 1 } },
    });

    try {
      if (job.jobType === "BOOKING_REMINDER") {
        await processBookingReminder((job.payload as { bookingId: string }).bookingId);
      }
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: { status: JobStatus.DONE, processedAt: new Date() },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const maxAttempts = job.maxAttempts;
      const attempts = job.attempts + 1;
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: attempts >= maxAttempts ? JobStatus.FAILED : JobStatus.PENDING,
          lastError: msg.slice(0, 500),
          runAt: new Date(Date.now() + 5 * 60 * 1000), // retry in 5 min
        },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Send booking payment reminder
// ---------------------------------------------------------------------------

async function processBookingReminder(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      guest: { select: { fullName: true, email: true } },
      apartment: { select: { title: true } },
    },
  });

  if (!booking) return;

  // Only remind for bookings still awaiting payment
  const remindableStatuses: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.AWAITING_PAYMENT,
  ];
  if (!remindableStatuses.includes(booking.status)) return;

  const recipient = guestEmail(booking);
  if (!recipient) return;

  // Don't remind if already expired
  if (booking.expiresAt && booking.expiresAt < new Date()) return;

  const manageUrl = booking.guestId
    ? `${env.FRONTEND_URL}/account/bookings/${booking.id}/pay`
    : `${env.FRONTEND_URL}/bookings/manage/${encodeURIComponent(
        booking.bookingReference,
      )}`;

  const html = buildReminderHtml({
    guestName: guestName(booking),
    bookingReference: booking.bookingReference,
    apartmentTitle: booking.apartment.title,
    checkIn: booking.checkIn.toISOString().split("T")[0],
    checkOut: booking.checkOut.toISOString().split("T")[0],
    totalAmount: Number(booking.totalAmount),
    currency: booking.currency,
    expiresAt: booking.expiresAt?.toISOString() ?? "soon",
    payUrl: manageUrl,
  });

  await sendEmail({
    to: recipient,
    subject: `Complete your Nestora booking — ${booking.bookingReference}`,
    html,
    templateName: "booking-reminder",
    bookingId: booking.id,
    userId: booking.guestId ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// Start scheduler (polling loop — safe across restarts)
// ---------------------------------------------------------------------------

let schedulerHandle: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (schedulerHandle) return;

  // Run immediately on start then poll
  void processDueJobs();

  schedulerHandle = setInterval(() => {
    void processDueJobs();
  }, env.JOB_POLL_INTERVAL_MS);

  console.info(
    `[Scheduler] Started — polling every ${env.JOB_POLL_INTERVAL_MS / 1000}s`,
  );
}

export function stopScheduler(): void {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}
