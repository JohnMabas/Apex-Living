import { z } from "zod";
import { BookingStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Parse a YYYY-MM-DD string into a UTC midnight Date */
function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? undefined : d;
}

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
  .transform((v) => parseDate(v)!);

const pageField = z.coerce.number().int().min(1).default(1);
const limitField = z.coerce.number().int().min(1).max(50).default(10);

const optionalText = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().trim().max(120).optional(),
);

const optionalStatus = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.nativeEnum(BookingStatus).optional(),
);

// ---------------------------------------------------------------------------
// Availability check — used by both POST /check-availability and sidebar
// ---------------------------------------------------------------------------

export const checkAvailabilitySchema = z
  .object({
    apartmentId: z.string().min(1, "Apartment ID is required."),
    checkIn: dateString,
    checkOut: dateString,
    numberOfGuests: z.coerce
      .number()
      .int("Guest count must be a whole number.")
      .min(1, "At least 1 guest is required.")
      .max(50, "Guest count is too large."),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out must be after check-in.",
    path: ["checkOut"],
  })
  .refine(
    (data) => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      return data.checkIn >= today;
    },
    { message: "Check-in date cannot be in the past.", path: ["checkIn"] },
  );

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;

// ---------------------------------------------------------------------------
// Create booking
// ---------------------------------------------------------------------------

export const createBookingSchema = z
  .object({
    apartmentId: z.string().min(1, "Apartment ID is required."),
    checkIn: dateString,
    checkOut: dateString,
    numberOfGuests: z.coerce
      .number()
      .int("Guest count must be a whole number.")
      .min(1, "At least 1 guest is required.")
      .max(50, "Guest count is too large."),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out must be after check-in.",
    path: ["checkOut"],
  })
  .refine(
    (data) => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      return data.checkIn >= today;
    },
    { message: "Check-in date cannot be in the past.", path: ["checkIn"] },
  );

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ---------------------------------------------------------------------------
// Cancel booking (guest)
// ---------------------------------------------------------------------------

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Please provide a cancellation reason.")
    .max(1000, "Reason is too long."),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// ---------------------------------------------------------------------------
// Host decline
// ---------------------------------------------------------------------------

export const declineBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Please provide a decline reason.")
    .max(1000, "Reason is too long."),
});

export type DeclineBookingInput = z.infer<typeof declineBookingSchema>;

// ---------------------------------------------------------------------------
// Admin status change
// ---------------------------------------------------------------------------

export const adminStatusChangeSchema = z.object({
  status: z.nativeEnum(BookingStatus, {
    errorMap: () => ({ message: "Invalid booking status." }),
  }),
  note: z
    .string()
    .trim()
    .max(1000, "Note is too long.")
    .optional(),
});

export type AdminStatusChangeInput = z.infer<typeof adminStatusChangeSchema>;

// ---------------------------------------------------------------------------
// Query schemas
// ---------------------------------------------------------------------------

export const guestBookingQuerySchema = z.object({
  status: optionalStatus,
  page: pageField,
  limit: limitField,
});

export const hostBookingQuerySchema = z.object({
  status: optionalStatus,
  search: optionalText,
  page: pageField,
  limit: limitField,
});

export const adminBookingQuerySchema = z.object({
  status: optionalStatus,
  search: optionalText,
  guestId: optionalText,
  apartmentId: optionalText,
  page: pageField,
  limit: limitField,
});

export type GuestBookingQuery = z.infer<typeof guestBookingQuerySchema>;
export type HostBookingQuery = z.infer<typeof hostBookingQuerySchema>;
export type AdminBookingQuery = z.infer<typeof adminBookingQuerySchema>;
