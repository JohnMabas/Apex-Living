import { randomUUID } from "crypto";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  templateName: string;
  userId?: string;
  paymentId?: string;
}

// ---------------------------------------------------------------------------
// Core sender — uses HTTP API (Resend-compatible)
// ---------------------------------------------------------------------------

async function sendViaProvider(params: {
  to: string;
  subject: string;
  html: string;
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
      paymentId: params.paymentId,
      templateName: params.templateName,
      recipient: params.to,
      subject: params.subject,
      status: "QUEUED",
      idempotencyKey: randomUUID(),
      payload: { html: params.html, text: params.html.replace(/<[^>]+>/g, " "), attachments: [] },
    },
  });

  try {
    await sendViaProvider({
      to: params.to,
      subject: params.subject,
      html: params.html,
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
    <p>Hi ${data.guestName},</p>
    <span class="badge">✗ Payment Failed</span>
    <p>We were unable to process your payment for <strong>${data.apartmentTitle}</strong>.</p>
    <p>Booking reference: <strong>${data.bookingReference}</strong></p>
    ${data.reason ? `<p>Reason: ${data.reason}</p>` : ""}
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
