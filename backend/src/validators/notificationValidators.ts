import { z } from "zod";
import { NotificationCategory } from "@prisma/client";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const optionalCategory = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.nativeEnum(NotificationCategory).optional(),
);

// ---------------------------------------------------------------------------
// Notification query — GET /notifications
// ---------------------------------------------------------------------------

export const notificationQuerySchema = z.object({
  category: optionalCategory,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
