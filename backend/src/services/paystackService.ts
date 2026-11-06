import { createHmac } from "crypto";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

// ---------------------------------------------------------------------------
// Types mirroring the Paystack API responses we care about
// ---------------------------------------------------------------------------

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyData {
  id: number;
  domain: string;
  status: string; // 'success' | 'failed' | 'abandoned' | 'pending'
  reference: string;
  amount: number; // in kobo
  currency: string;
  paid_at: string | null;
  gateway_response: string;
  channel: string;
  customer: { email: string; id: number };
  authorization: { authorization_code: string; card_type: string; last4: string; brand: string };
  metadata: Record<string, unknown>;
}

export interface PaystackRefundResponse {
  transaction: { id: number; reference: string };
  amount: number;
  currency: string;
  refund_reference: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function headers(): Record<string, string> {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new AppError(
      "Paystack is not configured. Set PAYSTACK_SECRET_KEY in the backend environment.",
      503,
    );
  }
  return {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

async function paystackFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${env.PAYSTACK_BASE_URL}${path}`;
  const res = await fetch(url, { ...options, headers: headers() });
  const json = (await res.json()) as { status: boolean; message: string; data: T };

  if (!res.ok || !json.status) {
    throw new AppError(
      `Paystack error: ${json.message ?? "Unknown error"}`,
      502,
    );
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Initialize a transaction
// ---------------------------------------------------------------------------

export async function paystackInitialize(params: {
  email: string;
  /** Amount in NGN (whole number) — we convert to kobo internally */
  amountNGN: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResponse> {
  return paystackFetch<PaystackInitResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNGN * 100), // kobo
      reference: params.reference,
      currency: "NGN",
      callback_url: params.callbackUrl ?? env.PAYSTACK_CALLBACK_URL,
      metadata: params.metadata ?? {},
    }),
  });
}

// ---------------------------------------------------------------------------
// Verify a transaction
// ---------------------------------------------------------------------------

export async function paystackVerify(
  reference: string,
): Promise<PaystackVerifyData> {
  return paystackFetch<PaystackVerifyData>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

// ---------------------------------------------------------------------------
// Refund a transaction
// ---------------------------------------------------------------------------

export async function paystackRefund(params: {
  transaction: string; // Paystack transaction ID or reference
  amountNGN: number;
  reason?: string;
}): Promise<PaystackRefundResponse> {
  return paystackFetch<PaystackRefundResponse>("/refund", {
    method: "POST",
    body: JSON.stringify({
      transaction: params.transaction,
      amount: Math.round(params.amountNGN * 100),
      merchant_note: params.reason ?? "Customer refund request",
    }),
  });
}

// ---------------------------------------------------------------------------
// Validate webhook signature (HMAC SHA512)
// ---------------------------------------------------------------------------

export function validateWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string,
): boolean {
  const secret = env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const expected = createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  return expected === signatureHeader;
}
