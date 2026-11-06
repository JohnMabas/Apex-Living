import { z } from "zod";
import {
  SupportTicketCategory,
  SupportTicketStatus,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const optionalStatus = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.nativeEnum(SupportTicketStatus).optional(),
);

const optionalCategory = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.nativeEnum(SupportTicketCategory).optional(),
);

const optionalSearch = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().trim().max(120).optional(),
);

// ---------------------------------------------------------------------------
// Create support ticket — POST /support/tickets (public, rate-limited)
// ---------------------------------------------------------------------------

export const createSupportTicketSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(254, "Email address is too long."),
  phone: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z
        .string()
        .trim()
        .min(7, "Please enter a valid phone number.")
        .max(25, "Phone number is too long.")
        .regex(
          /^\+?[0-9][0-9\s\-()]{5,23}$/,
          "Please enter a valid phone number.",
        )
        .optional(),
    ),
  bookingReference: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z
        .string()
        .trim()
        .max(30, "Booking reference is too long.")
        .optional(),
    ),
  category: z.nativeEnum(SupportTicketCategory, {
    errorMap: () => ({ message: "Please choose a valid category." }),
  }),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters.")
    .max(200, "Subject is too long."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(5000, "Message is too long."),
  // Rate-limiting metadata (populated by middleware, not the client)
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

// ---------------------------------------------------------------------------
// Add ticket message — POST /admin/support/tickets/:id/messages
// ---------------------------------------------------------------------------

export const addTicketMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Message body is required.")
    .max(5000, "Message is too long."),
  isInternal: z.boolean().default(false),
  senderType: z.string().default("CUSTOMER"),
});

export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;

// ---------------------------------------------------------------------------
// Admin update ticket — PATCH /admin/support/tickets/:id/status
// and PATCH /admin/support/tickets/:id/assign
// ---------------------------------------------------------------------------

export const adminUpdateTicketSchema = z.object({
  status: z.nativeEnum(SupportTicketStatus, {
    errorMap: () => ({ message: "Invalid ticket status." }),
  }),
  assignedToId: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.string().trim().optional(),
    ),
});

export type AdminUpdateTicketInput = z.infer<typeof adminUpdateTicketSchema>;

// ---------------------------------------------------------------------------
// Admin ticket query — GET /admin/support/tickets
// ---------------------------------------------------------------------------

export const adminTicketQuerySchema = z.object({
  status: optionalStatus,
  category: optionalCategory,
  search: optionalSearch,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type AdminTicketQuery = z.infer<typeof adminTicketQuerySchema>;

// ---------------------------------------------------------------------------
// Assign ticket — PATCH /admin/support/tickets/:id/assign
// ---------------------------------------------------------------------------

export const assignTicketSchema = z.object({
  assignedToId: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.string().trim().optional(),
    ),
});

export type AssignTicketInput = z.infer<typeof assignTicketSchema>;

// ---------------------------------------------------------------------------
// Update ticket status — PATCH /admin/support/tickets/:id/status
// ---------------------------------------------------------------------------

export const updateTicketStatusSchema = z.object({
  status: z.nativeEnum(SupportTicketStatus, {
    errorMap: () => ({ message: "Invalid ticket status." }),
  }),
});

export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
