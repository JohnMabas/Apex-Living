import { z } from "zod";

const pageField = z.coerce.number().int().min(1).default(1);
const limitField = z.coerce.number().int().min(1).max(50).default(10);
const optText = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.string().trim().max(120).optional(),
);

export const initializePaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required."),
});
export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;

export const initializeGuestPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required."),
  accessToken: z.string().min(20, "A valid booking access token is required."),
});
export type InitializeGuestPaymentInput = z.infer<
  typeof initializeGuestPaymentSchema
>;

export const requestRefundSchema = z.object({
  paymentReference: z.string().min(1, "Payment reference is required."),
  reason: z.string().trim().min(10, "Please explain why you are requesting a refund.").max(1000),
});
export type RequestRefundInput = z.infer<typeof requestRefundSchema>;

export const adminRefundActionSchema = z.object({
  action: z.enum(["approve", "reject", "process"]),
  adminNote: z.string().trim().max(500).optional(),
});
export type AdminRefundActionInput = z.infer<typeof adminRefundActionSchema>;

export const emailPrefSchema = z.object({
  promotionalEmailsEnabled: z.boolean(),
  consentSource: z.string().trim().max(80).optional(),
});
export type EmailPrefInput = z.infer<typeof emailPrefSchema>;

export const cookieConsentSchema = z.object({
  necessary: z.boolean().default(true),
  functional: z.boolean().default(false),
  analytics: z.boolean().default(false),
  marketing: z.boolean().default(false),
  policyVersion: z.string().default("1.0"),
  sessionToken: z.string().optional(),
});
export type CookieConsentInput = z.infer<typeof cookieConsentSchema>;

export const guestPaymentQuerySchema = z.object({ page: pageField, limit: limitField });
export const adminPaymentQuerySchema = z.object({
  search: optText,
  status: optText,
  page: pageField,
  limit: limitField,
});
export const adminRefundQuerySchema = z.object({
  status: optText,
  page: pageField,
  limit: limitField,
});
