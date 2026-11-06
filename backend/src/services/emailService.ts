import { randomUUID } from "crypto";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailAttachment {
  /** File name shown to the recipient, e.g. "Nestora-Receipt-NEST-ABC123.pdf". */
  name: string;
  /** Base64-encoded file contents. */
  content: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  templateName: string;
  userId?: string;
  bookingId?: string;
  paymentId?: string;
  attachments?: EmailAttachment[];
}

/** Escape untrusted values before interpolating them into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Core sender — uses HTTP API (Resend-compatible)
// ---------------------------------------------------------------------------

async function sendViaProvider(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
  if (!env.EMAIL_PROVIDER_API_KEY || !env.EMAIL_FROM) {
    // In development without email configured, just log
    if (env.NODE_ENV !== "production") {
      console.info(
        `[EMAIL-DEV] To: ${params.to} | Subject: ${params.subject}`,
      );
      return;
    }
    throw new Error("Email provider is not configured.");
  }

  // Brevo transactional email API
  // Docs: https://developers.brevo.com/reference/send-transac-email
  const res = await fetch(env.EMAIL_PROVIDER_URL, {
    method: "POST",
    headers: {
      "api-key": env.EMAIL_PROVIDER_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: env.EMAIL_FROM_NAME,
        email: env.EMAIL_FROM,
      },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
      ...(params.attachments?.length
        ? {
            attachment: params.attachments.map((a) => ({
              name: a.name,
              content: a.content,
            })),
          }
        : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API returned ${res.status}: ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Record + send with retry tracking
// ---------------------------------------------------------------------------

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const record = await prisma.emailDelivery.create({
    data: {
      userId: params.userId,
      bookingId: params.bookingId,
      paymentId: params.paymentId,
      templateName: params.templateName,
      recipient: params.to,
      subject: params.subject,
      status: "QUEUED",
      idempotencyKey: randomUUID(),
      payload: {
        html: params.html,
        text: params.html.replace(/<[^>]+>/g, " "),
        attachments: params.attachments?.map((a) => a.name) ?? [],
      },
    },
  });

  try {
    await sendViaProvider({
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: params.attachments,
    });
    await prisma.emailDelivery.update({
      where: { id: record.id },
      data: { status: "SENT", sentAt: new Date(), attempts: 1 },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.emailDelivery.update({
      where: { id: record.id },
      data: {
        status: "FAILED",
        attempts: 1,
        lastError: msg.slice(0, 500),
      },
    });
    // Do NOT rethrow — email failure must not fail the payment
    console.error(`[EMAIL] Delivery failed for ${params.to}: ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// Template: Payment receipt
// ---------------------------------------------------------------------------

export function buildReceiptHtml(data: {
  guestName: string;
  bookingReference: string;
  paymentReference: string;
  apartmentTitle: string;
  apartmentLocation: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfNights: number;
  nightlyPrice: number;
  cleaningFee: number | null;
  additionalFees: number | null;
  totalAmount: number;
  currency: string;
  paidAt: string;
  bookingUrl: string;
}): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(n);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Payment Receipt — Nestora</title>
<style>
  body{font-family:Arial,sans-serif;background:#F4EBDD;margin:0;padding:24px}
  .card{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .header{background:#173D32;color:#F4EBDD;padding:32px;text-align:center}
  .header h1{margin:0;font-size:24px;letter-spacing:.5px}
  .header p{margin:4px 0 0;opacity:.7;font-size:13px}
  .body{padding:32px}
  .badge{display:inline-block;background:#d1fae5;color:#065f46;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:600;margin-bottom:20px}
  h2{color:#173D32;margin:0 0 16px;font-size:16px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0ebe3;font-size:14px}
  .row:last-child{border-bottom:none}
  .label{color:#666}
  .value{font-weight:500;color:#252B28;text-align:right}
  .total-row{display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:700;color:#173D32;border-top:2px solid #173D32;margin-top:8px}
  .btn{display:inline-block;margin-top:24px;background:#173D32;color:#F4EBDD;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600}
  .footer{background:#f9f5ef;padding:20px 32px;text-align:center;font-size:12px;color:#999}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>🏠 Nestora</h1>
    <p>Your comfort, your space.</p>
  </div>
  <div class="body">
    <p>Hi ${data.guestName},</p>
    <p>Your payment has been confirmed. Here is your receipt.</p>
    <span class="badge">✓ Payment Successful</span>

    <h2>Booking Details</h2>
    <div class="row"><span class="label">Apartment</span><span class="value">${data.apartmentTitle}</span></div>
    <div class="row"><span class="label">Location</span><span class="value">${data.apartmentLocation}</span></div>
    <div class="row"><span class="label">Check-in</span><span class="value">${data.checkIn}</span></div>
    <div class="row"><span class="label">Check-out</span><span class="value">${data.checkOut}</span></div>
    <div class="row"><span class="label">Guests</span><span class="value">${data.numberOfGuests}</span></div>
    <div class="row"><span class="label">Nights</span><span class="value">${data.numberOfNights}</span></div>
    <div class="row"><span class="label">Booking reference</span><span class="value">${data.bookingReference}</span></div>

    <h2 style="margin-top:24px">Payment Summary</h2>
    <div class="row"><span class="label">Accommodation (${fmt(data.nightlyPrice)} × ${data.numberOfNights})</span><span class="value">${fmt(data.nightlyPrice * data.numberOfNights)}</span></div>
    ${data.cleaningFee !== null ? `<div class="row"><span class="label">Cleaning fee</span><span class="value">${fmt(data.cleaningFee)}</span></div>` : ""}
    ${data.additionalFees !== null ? `<div class="row"><span class="label">Additional fees</span><span class="value">${fmt(data.additionalFees)}</span></div>` : ""}
    <div class="total-row"><span>Total Paid</span><span>${fmt(data.totalAmount)} ${data.currency}</span></div>

    <div class="row" style="margin-top:12px"><span class="label">Payment reference</span><span class="value">${data.paymentReference}</span></div>
    <div class="row"><span class="label">Payment date</span><span class="value">${data.paidAt}</span></div>

    <a href="${data.bookingUrl}" class="btn">View My Booking</a>

    <p style="margin-top:24px;font-size:13px;color:#666">
      Questions? Contact us at <a href="mailto:hello@nestora.ng" style="color:#173D32">hello@nestora.ng</a>
    </p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Nestora. All rights reserved.</div>
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template: Payment failed
// ---------------------------------------------------------------------------

export function buildPaymentFailedHtml(data: {
  guestName: string;
  bookingReference: string;
  apartmentTitle: string;
  reason: string;
  retryUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Payment Failed — Nestora</title>
<style>body{font-family:Arial,sans-serif;background:#F4EBDD;padding:24px}
.card{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.header{background:#173D32;color:#F4EBDD;padding:32px;text-align:center}
.header h1{margin:0;font-size:24px}
.body{padding:32px}
.badge{display:inline-block;background:#fee2e2;color:#991b1b;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:600;margin-bottom:16px}
.btn{display:inline-block;margin-top:20px;background:#173D32;color:#F4EBDD;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600}
.footer{background:#f9f5ef;padding:20px;text-align:center;font-size:12px;color:#999}</style>
</head>
<body>
<div class="card">
  <div class="header"><h1>🏠 Nestora</h1></div>
  <div class="body">
    <p>Hi ${escapeHtml(data.guestName)},</p>
    <span class="badge">✗ Payment Failed</span>
    <p>We were unable to process your payment for <strong>${escapeHtml(data.apartmentTitle)}</strong>.</p>
    <p>Booking reference: <strong>${escapeHtml(data.bookingReference)}</strong></p>
    ${data.reason ? `<p>Reason: ${escapeHtml(data.reason)}</p>` : ""}
    <p>Your booking remains pending. Please try again before it expires.</p>
    <a href="${data.retryUrl}" class="btn">Try Again</a>
    <p style="margin-top:20px;font-size:13px;color:#666">Need help? <a href="mailto:hello@nestora.ng" style="color:#173D32">hello@nestora.ng</a></p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Nestora.</div>
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template: Unpaid booking reminder
// ---------------------------------------------------------------------------

export function buildReminderHtml(data: {
  guestName: string;
  bookingReference: string;
  apartmentTitle: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  expiresAt: string;
  payUrl: string;
}): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(n);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Complete Your Booking — Nestora</title>
<style>body{font-family:Arial,sans-serif;background:#F4EBDD;padding:24px}
.card{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.header{background:#173D32;color:#F4EBDD;padding:32px;text-align:center}
.header h1{margin:0;font-size:24px}
.body{padding:32px}
.badge{display:inline-block;background:#fef3c7;color:#92400e;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:600;margin-bottom:16px}
.btn{display:inline-block;margin-top:20px;background:#C69B65;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700}
.footer{background:#f9f5ef;padding:20px;text-align:center;font-size:12px;color:#999}</style>
</head>
<body>
<div class="card">
  <div class="header"><h1>🏠 Nestora</h1></div>
  <div class="body">
    <p>Hi ${data.guestName},</p>
    <span class="badge">⏳ Payment Pending</span>
    <p>You started a booking for <strong>${data.apartmentTitle}</strong> but payment was not completed.</p>
    <p>Booking reference: <strong>${data.bookingReference}</strong><br/>
    Dates: ${data.checkIn} — ${data.checkOut}<br/>
    Total: <strong>${fmt(data.totalAmount)} ${data.currency}</strong></p>
    <p><strong>This booking expires at ${data.expiresAt}.</strong> Complete payment now to secure your stay.</p>
    <a href="${data.payUrl}" class="btn">Complete Payment</a>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Nestora.</div>
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Guest booking templates
// ---------------------------------------------------------------------------

export interface BookingEmailData {
  guestName: string;
  bookingReference: string;
  apartmentTitle: string;
  apartmentLocation: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfNights: number;
  totalAmount: number;
  currency: string;
  managementUrl: string;
}

function emailShell(options: {
  title: string;
  preview: string;
  body: string;
  footerNote?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(options.title)} — Nestora</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;background:#F4EBDD;margin:0;padding:24px}
  .card{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .header{background:#173D32;color:#F4EBDD;padding:32px;text-align:center}
  .header h1{margin:0;font-size:24px;letter-spacing:.5px}
  .header p{margin:4px 0 0;opacity:.75;font-size:13px}
  .body{padding:32px;color:#252B28}
  .badge{display:inline-block;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:600;margin-bottom:18px}
  .badge-success{background:#d1fae5;color:#065f46}
  .badge-pending{background:#fef3c7;color:#92400e}
  .badge-danger{background:#fee2e2;color:#991b1b}
  .badge-info{background:#dbeafe;color:#1e40af}
  h2{color:#173D32;margin:22px 0 12px;font-size:16px}
  .row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #f0ebe3;font-size:14px}
  .row:last-child{border-bottom:none}
  .label{color:#666}
  .value{font-weight:500;color:#252B28;text-align:right}
  .total-row{display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:700;color:#173D32;border-top:2px solid #173D32;margin-top:8px}
  .btn{display:inline-block;margin-top:24px;background:#173D32;color:#F4EBDD;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600}
  .note{margin-top:20px;font-size:13px;color:#666;line-height:1.6}
  .footer{background:#f9f5ef;padding:20px 32px;text-align:center;font-size:12px;color:#999}
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🏠 Nestora</h1>
      <p>Your comfort, your space.</p>
    </div>
    <div class="body">
      <p>${escapeHtml(options.preview)}</p>
      ${options.body}
      <p class="note">
        Questions? Contact Nestora support at
        <a href="mailto:hello@nestora.ng" style="color:#173D32">hello@nestora.ng</a>.
      </p>
      ${options.footerNote ? `<p class="note">${escapeHtml(options.footerNote)}</p>` : ""}
    </div>
    <div class="footer">© ${new Date().getFullYear()} Nestora. All rights reserved. · Your comfort, your space.</div>
  </div>
</body>
</html>`;
}

function bookingDetailRows(data: BookingEmailData): string {
  return `
    <div class="row"><span class="label">Apartment</span><span class="value">${escapeHtml(data.apartmentTitle)}</span></div>
    <div class="row"><span class="label">Location</span><span class="value">${escapeHtml(data.apartmentLocation)}</span></div>
    <div class="row"><span class="label">Check-in</span><span class="value">${escapeHtml(data.checkIn)}</span></div>
    <div class="row"><span class="label">Check-out</span><span class="value">${escapeHtml(data.checkOut)}</span></div>
    <div class="row"><span class="label">Guests</span><span class="value">${data.numberOfGuests}</span></div>
    <div class="row"><span class="label">Nights</span><span class="value">${data.numberOfNights}</span></div>
    <div class="row"><span class="label">Booking reference</span><span class="value">${escapeHtml(data.bookingReference)}</span></div>`;
}

export function buildBookingReceivedHtml(data: {
  guestName: string;
  bookingReference: string;
  apartmentTitle: string;
  apartmentLocation: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfNights: number;
  totalAmount: number;
  currency: string;
  managementUrl: string;
  expiresAt: string;
}): string {
  return emailShell({
    title: "Booking received",
    preview: `Hi ${data.guestName}, we have received your booking request.`,
    body: `
      <span class="badge badge-pending">⏳ Awaiting payment</span>
      <p>Your booking for <strong>${escapeHtml(data.apartmentTitle)}</strong> has been created. Complete payment to confirm your stay.</p>
      <h2>Booking details</h2>
      ${bookingDetailRows(data)}
      <div class="total-row"><span>Total due</span><span>${formatMoney(data.totalAmount)} ${escapeHtml(data.currency)}</span></div>
      <p class="note">This booking is held until <strong>${escapeHtml(data.expiresAt)}</strong>. Complete payment before then to secure your dates.</p>
      <a href="${data.managementUrl}" class="btn">View Booking &amp; Pay</a>
      <p class="note">Keep this email safe. The secure link lets you view, pay for or cancel your booking without creating an account.</p>`,
  });
}

export function buildBookingConfirmedHtml(data: BookingEmailData & {
  paymentReference: string;
  paidAt: string;
}): string {
  return emailShell({
    title: "Booking confirmed",
    preview: `Hi ${data.guestName}, your payment was successful and your booking is confirmed.`,
    body: `
      <span class="badge badge-success">✓ Payment successful &amp; booking confirmed</span>
      <p>Thank you for choosing Nestora. Your stay at <strong>${escapeHtml(data.apartmentTitle)}</strong> is confirmed.</p>
      <h2>Booking details</h2>
      ${bookingDetailRows(data)}
      <h2>Payment summary</h2>
      <div class="row"><span class="label">Amount paid</span><span class="value">${formatMoney(data.totalAmount)} ${escapeHtml(data.currency)}</span></div>
      <div class="row"><span class="label">Payment reference</span><span class="value">${escapeHtml(data.paymentReference)}</span></div>
      <div class="row"><span class="label">Payment date</span><span class="value">${escapeHtml(data.paidAt)}</span></div>
      <div class="total-row"><span>Total paid</span><span>${formatMoney(data.totalAmount)} ${escapeHtml(data.currency)}</span></div>
      <p class="note">Your PDF receipt is attached to this email.</p>
      <a href="${data.managementUrl}" class="btn">Manage My Booking</a>`,
  });
}

export function buildCancellationHtml(data: BookingEmailData & {
  reason: string;
  cancelledAt: string;
}): string {
  return emailShell({
    title: "Booking cancelled",
    preview: `Hi ${data.guestName}, your booking has been cancelled.`,
    body: `
      <span class="badge badge-danger">Booking cancelled</span>
      <p>Your booking for <strong>${escapeHtml(data.apartmentTitle)}</strong> has been cancelled.</p>
      <h2>Cancellation details</h2>
      ${bookingDetailRows(data)}
      <div class="row"><span class="label">Cancelled on</span><span class="value">${escapeHtml(data.cancelledAt)}</span></div>
      <div class="row"><span class="label">Reason</span><span class="value">${escapeHtml(data.reason)}</span></div>
      <p class="note">If you have already paid, refund eligibility depends on the cancellation policy. Our team will contact you if a refund applies.</p>
      <a href="${data.managementUrl}" class="btn">View Booking</a>`,
  });
}

export function buildRefundStatusHtml(data: BookingEmailData & {
  paymentReference: string;
  refundAmount: number;
  refundStatus: string;
  adminNote?: string | null;
}): string {
  return emailShell({
    title: "Refund status update",
    preview: `Hi ${data.guestName}, there is an update on your refund request.`,
    body: `
      <span class="badge badge-info">Refund ${escapeHtml(data.refundStatus.toLowerCase())}</span>
      <p>We are writing to update you on the refund for your booking at <strong>${escapeHtml(data.apartmentTitle)}</strong>.</p>
      <h2>Refund details</h2>
      ${bookingDetailRows(data)}
      <div class="row"><span class="label">Payment reference</span><span class="value">${escapeHtml(data.paymentReference)}</span></div>
      <div class="row"><span class="label">Refund amount</span><span class="value">${formatMoney(data.refundAmount)} ${escapeHtml(data.currency)}</span></div>
      <div class="row"><span class="label">Status</span><span class="value">${escapeHtml(data.refundStatus)}</span></div>
      ${data.adminNote ? `<p class="note">${escapeHtml(data.adminNote)}</p>` : ""}
      <p class="note">Approved refunds are usually processed within 5–10 business days.</p>
      <a href="${data.managementUrl}" class="btn">View Booking</a>`,
  });
}
