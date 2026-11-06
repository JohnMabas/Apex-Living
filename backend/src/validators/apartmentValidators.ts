import { z } from "zod";
import { ApartmentStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce
    .number()
    .min(0, "Amount cannot be negative.")
    .max(100_000_000, "Amount is too large.")
    .optional(),
);

const optionalInt = (min: number, max: number, message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int(message).min(min, message).max(max, message).optional(),
  );

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const propertyTypes = [
  "Apartment",
  "Studio",
  "Duplex",
  "Penthouse",
  "Bungalow",
  "Villa",
] as const;

export const smokingPolicies = [
  "No smoking",
  "Smoking allowed outdoors",
  "Smoking allowed",
] as const;

export const petPolicies = [
  "No pets",
  "Pets on request",
  "Pets allowed",
] as const;

// ---------------------------------------------------------------------------
// Apartment create / update
// ---------------------------------------------------------------------------

const apartmentFields = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title is too long."),
  description: z
    .string()
    .trim()
    .min(30, "Description must be at least 30 characters.")
    .max(5000, "Description is too long."),
  propertyType: z.enum(propertyTypes, {
    errorMap: () => ({ message: "Please choose a valid property type." }),
  }),
  city: z.string().trim().min(2, "City is required.").max(80, "City is too long."),
  location: z
    .string()
    .trim()
    .min(2, "Location is required.")
    .max(120, "Location is too long."),
  address: z
    .string()
    .trim()
    .min(5, "Full address is required.")
    .max(255, "Address is too long."),
  maxGuests: z.coerce
    .number()
    .int("Guest capacity must be a whole number.")
    .min(1, "Guest capacity must be at least 1.")
    .max(50, "Guest capacity is too large."),
  bedrooms: z.coerce
    .number()
    .int("Bedrooms must be a whole number.")
    .min(1, "At least one bedroom is required.")
    .max(50, "Bedroom count is too large."),
  bathrooms: z.coerce
    .number()
    .int("Bathrooms must be a whole number.")
    .min(1, "At least one bathroom is required.")
    .max(50, "Bathroom count is too large."),
  pricePerNight: z.coerce
    .number()
    .min(1, "Price per night is required.")
    .max(100_000_000, "Price is too large."),
  cleaningFee: optionalMoney,
  otherFees: optionalMoney,
  otherFeesNote: optionalText.pipe(z.string().max(200, "Fee note is too long.").optional()),
  checkInInfo: z
    .string()
    .trim()
    .min(2, "Check-in information is required.")
    .max(500, "Check-in information is too long."),
  checkOutInfo: z
    .string()
    .trim()
    .min(2, "Check-out information is required.")
    .max(500, "Check-out information is too long."),
  smokingPolicy: z.enum(smokingPolicies, {
    errorMap: () => ({ message: "Please choose a valid smoking policy." }),
  }),
  petPolicy: z.enum(petPolicies, {
    errorMap: () => ({ message: "Please choose a valid pet policy." }),
  }),
  additionalRules: optionalText.pipe(
    z.string().max(2000, "Additional rules are too long.").optional(),
  ),
  amenityIds: z
    .array(z.string().min(1))
    .max(30, "Too many amenities selected.")
    .optional(),
});

export const createApartmentSchema = apartmentFields.extend({
  amenityIds: z.array(z.string().min(1)).max(30).default([]),
});

export const updateApartmentSchema = apartmentFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export type CreateApartmentInput = z.infer<typeof createApartmentSchema>;
export type UpdateApartmentInput = z.infer<typeof updateApartmentSchema>;

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export const moderationReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Please provide a reason of at least 5 characters.")
    .max(1000, "Reason is too long."),
});

export const requestChangesSchema = moderationReasonSchema;
export const rejectApartmentSchema = moderationReasonSchema;
export const suspendApartmentSchema = moderationReasonSchema;

export type ModerationReasonInput = z.infer<typeof moderationReasonSchema>;

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1, "At least one image is required."),
});

export const imageAltTextSchema = z.object({
  altText: z.string().trim().max(160, "Alt text is too long.").optional(),
});

export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;

// ---------------------------------------------------------------------------
// Listing queries
// ---------------------------------------------------------------------------

const pageField = z.coerce.number().int().min(1).default(1);
const limitField = z.coerce.number().int().min(1).max(50).default(12);

const optionalStatus = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.nativeEnum(ApartmentStatus).optional(),
);

const optionalSearch = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.string().trim().max(120).optional(),
);

const optionalCity = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.string().trim().max(80).optional(),
);

const priceField = (name: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().min(0, `${name} cannot be negative.`).optional(),
  );

export const publicApartmentQuerySchema = z.object({
  city: optionalCity,
  location: optionalCity,
  search: optionalSearch,
  minPrice: priceField("Minimum price"),
  maxPrice: priceField("Maximum price"),
  bedrooms: optionalInt(1, 50, "Bedroom filter is invalid."),
  guests: optionalInt(1, 50, "Guest filter is invalid."),
  propertyType: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.enum(propertyTypes).optional(),
  ),
  amenityIds: z
    .preprocess(
      (v) => {
        if (v === undefined || v === null || v === "") return undefined;
        if (Array.isArray(v)) return v;
        return String(v).split(",").map((s) => s.trim()).filter(Boolean);
      },
      z.array(z.string().min(1)).max(20).optional(),
    ),
  sortBy: z.enum(["newest", "price-asc", "price-desc", "rating"]).default("newest"),
  page: pageField,
  limit: limitField,
});

export const hostApartmentQuerySchema = z.object({
  status: optionalStatus,
  search: optionalSearch,
  page: pageField,
  limit: limitField,
});

export const adminApartmentQuerySchema = z.object({
  status: optionalStatus,
  search: optionalSearch,
  hostId: optionalSearch,
  page: pageField,
  limit: limitField,
});

export type PublicApartmentQuery = z.infer<typeof publicApartmentQuerySchema>;
export type HostApartmentQuery = z.infer<typeof hostApartmentQuerySchema>;
export type AdminApartmentQuery = z.infer<typeof adminApartmentQuerySchema>;
