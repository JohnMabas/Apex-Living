import { z } from "zod";
import { BlockType } from "@prisma/client";

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

export const availabilityBlockSchema = z
  .object({
    startDate: dateString,
    endDate: dateString,
    reason: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z.string().trim().max(500, "Reason is too long.").optional(),
      ),
    blockType: z.nativeEnum(BlockType).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date.",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      return data.startDate >= today;
    },
    { message: "Start date cannot be in the past.", path: ["startDate"] },
  );

export type AvailabilityBlockInput = z.infer<typeof availabilityBlockSchema>;

export const availabilityBlockQuerySchema = z.object({
  apartmentId: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.string().trim().optional(),
    ),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type AvailabilityBlockQuery = z.infer<
  typeof availabilityBlockQuerySchema
>;
