import type {
  Payment,
  PaymentListResult,
  PaymentStatus,
  EmailPreference,
  CookieConsent,
  PaginationMeta,
} from "@/types";
import { apiFetch, apiFetchBlob } from "./apiClient";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQuery(
  params: Record<string, string | number | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

// ---------------------------------------------------------------------------
// Payment initialization & verification
// ---------------------------------------------------------------------------

export interface InitializePaymentResult {
  authorizationUrl: string;
  paymentReference: string;
  amount: number;
  currency: string;
  booking: {
    id: string;
    reference: string;
    apartment: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  };
}

export async function initializePayment(
  bookingId: string,
): Promise<InitializePaymentResult> {
  const response = await apiFetch<{ data: InitializePaymentResult }>(
    "/payments/paystack/initialize",
    { method: "POST", body: { bookingId } },
  );
  return response.data;
}

export async function verifyPayment(reference: string): Promise<Payment> {
  const response = await apiFetch<{ data: { payment: Payment } }>(
    `/payments/paystack/verify/${encodeURIComponent(reference)}`,
  );
  return response.data.payment;
}

// ---------------------------------------------------------------------------
// Guest payments
// ---------------------------------------------------------------------------

type PaymentsListResponse = {
  status: "success";
  data: { payments: Payment[] };
  meta: PaginationMeta;
};

export async function getMyPayments(
  page?: number,
  limit?: number,
): Promise<PaymentListResult> {
  const query = buildQuery({ page, limit });
  const response = await apiFetch<PaymentsListResponse>(
    `/payments/my-payments${query}`,
  );
  return { payments: response.data.payments, meta: response.meta };
}

export async function getMyPayment(reference: string): Promise<Payment> {
  const response = await apiFetch<{ data: { payment: Payment } }>(
    `/payments/${encodeURIComponent(reference)}`,
  );
  return response.data.payment;
}

// ---------------------------------------------------------------------------
// Admin payments
// ---------------------------------------------------------------------------

export interface AdminPaymentFilters {
  search?: string;
  status?: PaymentStatus | "";
  page?: number;
  limit?: number;
}

export interface AdminPaymentsListResult {
  payments: AdminPayment[];
  meta: PaginationMeta;
}

export interface AdminPayment extends Payment {
  booking?: Payment["booking"] & {
    guest?: { id: string | null; fullName: string; email: string | null };
  };
}

type AdminPaymentsListResponse = {
  status: "success";
  data: { payments: AdminPayment[] };
  meta: PaginationMeta;
};

export async function getAdminPayments(
  params: AdminPaymentFilters = {},
): Promise<AdminPaymentsListResult> {
  const query = buildQuery({
    search: params.search,
    status: params.status,
    page: params.page,
    limit: params.limit,
  });
  const response = await apiFetch<AdminPaymentsListResponse>(
    `/admin/payments${query}`,
  );
  return { payments: response.data.payments, meta: response.meta };
}

// ---------------------------------------------------------------------------
// Refunds (admin)
// ---------------------------------------------------------------------------

export interface RefundRequest {
  id: string;
  paymentReference: string;
  reason: string;
  amount: number;
  status: string;
  requestedAt: string;
  payment?: {
    booking?: {
      bookingReference: string;
      guest?: { fullName: string; email: string | null };
    };
  };
}

type RefundsListResponse = {
  status: "success";
  data: { refunds: RefundRequest[] };
  meta: PaginationMeta;
};

export async function getAdminRefunds(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ refunds: RefundRequest[]; meta: PaginationMeta }> {
  const query = buildQuery({
    status: params.status,
    page: params.page,
    limit: params.limit,
  });
  const response = await apiFetch<RefundsListResponse>(
    `/admin/refunds${query}`,
  );
  return { refunds: response.data.refunds, meta: response.meta };
}

// ---------------------------------------------------------------------------
// Email preferences
// ---------------------------------------------------------------------------

export async function getEmailPreferences(): Promise<EmailPreference> {
  const response = await apiFetch<{ data: { emailPreference: EmailPreference } }>(
    "/users/me/email-preferences",
  );
  return response.data.emailPreference;
}

export async function updateEmailPreferences(data: {
  promotionalEmailsEnabled: boolean;
}): Promise<EmailPreference> {
  const response = await apiFetch<{ data: { emailPreference: EmailPreference } }>(
    "/users/me/email-preferences",
    { method: "PATCH", body: data },
  );
  return response.data.emailPreference;
}

// ---------------------------------------------------------------------------
// Cookie consent
// ---------------------------------------------------------------------------

export async function saveCookieConsent(data: CookieConsent): Promise<void> {
  await apiFetch("/cookie-consent", { method: "POST", body: data });
}

// ---------------------------------------------------------------------------
// Public guest payments (no account, secure token)
// ---------------------------------------------------------------------------

export interface GuestInitializePaymentResult {
  authorizationUrl: string;
  paymentReference: string;
  amount: number;
  currency: string;
  booking: {
    id: string;
    reference: string;
    apartment: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  };
}

export async function initializeGuestPayment(
  bookingId: string,
  accessToken: string,
): Promise<GuestInitializePaymentResult> {
  const response = await apiFetch<{ data: GuestInitializePaymentResult }>(
    "/payments/guest/initialize",
    { method: "POST", body: { bookingId, accessToken } },
  );
  return response.data;
}

export async function verifyGuestPayment(
  reference: string,
  accessToken: string,
): Promise<Payment> {
  const response = await apiFetch<{ data: { payment: Payment } }>(
    `/payments/guest/verify/${encodeURIComponent(reference)}`,
    { headers: { "X-Booking-Token": accessToken } },
  );
  return response.data.payment;
}

export async function downloadGuestReceipt(
  reference: string,
  accessToken: string,
): Promise<Blob> {
  return apiFetchBlob(
    `/payments/guest/${encodeURIComponent(reference)}/receipt`,
    { headers: { "X-Booking-Token": accessToken } },
  );
}
