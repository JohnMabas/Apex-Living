import { Prisma, type NotificationCategory } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { NotificationQuery } from "../validators/notificationValidators.js";

// ---------------------------------------------------------------------------
// Prisma record types
// ---------------------------------------------------------------------------

type NotificationRecord = Prisma.NotificationGetPayload<{}>;

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function serializeNotification(n: NotificationRecord) {
  return {
    id: n.id,
    category: n.category,
    title: n.title,
    message: n.message,
    link: n.link,
    isRead: n.isRead,
    readAt: n.readAt?.toISOString() ?? null,
    metadata: n.metadata,
    createdAt: n.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ---------------------------------------------------------------------------
// createNotification — fire-and-forget safe
// ---------------------------------------------------------------------------

/**
 * Create a notification for a user.
 *
 * This function is designed to be safe to call in a fire-and-forget manner
 * (e.g. `void createNotification(...)`). All errors are caught and logged so
 * that notification failures never break the calling flow.
 */
export async function createNotification(
  userId: string,
  category: NotificationCategory,
  title: string,
  message: string,
  link?: string,
  metadata?: Prisma.InputJsonValue,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        category,
        title,
        message,
        link: link ?? null,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error: unknown) {
    console.error(
      `[NOTIFICATION] Failed to create notification for user ${userId}:`,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// listNotifications — paginated, unread-first sorting
// ---------------------------------------------------------------------------

export async function listNotifications(
  userId: string,
  query: NotificationQuery,
) {
  const where: Prisma.NotificationWhereInput = { userId };

  if (query.category) where.category = query.category;

  const skip = (query.page - 1) * query.limit;

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: [
        { isRead: "asc" }, // unread (false) first
        { createdAt: "desc" },
      ],
      skip,
      take: query.limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications: notifications.map(serializeNotification),
    meta: paginationMeta(query.page, query.limit, total),
  };
}

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

// ---------------------------------------------------------------------------
// markAsRead — single notification
// ---------------------------------------------------------------------------

export async function markAsRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true, isRead: true },
  });

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  if (notification.isRead) return;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// markAllAsRead — all user's notifications
// ---------------------------------------------------------------------------

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
