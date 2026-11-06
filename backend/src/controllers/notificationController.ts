import type { Request, Response, NextFunction } from "express";
import {
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markAsRead,
} from "../services/notificationService.js";
import { notificationQuerySchema } from "../validators/notificationValidators.js";
import { param } from "../utils/requestParams.js";

// GET /api/v1/notifications
export async function listNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = notificationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listNotifications(req.userId!, parsed.data);

    res.status(200).json({
      status: "success",
      data: { notifications: result.notifications },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/notifications/unread-count
export async function getUnreadCountHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const count = await getUnreadCount(req.userId!);

    res.status(200).json({
      status: "success",
      data: { unreadCount: count },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/notifications/:id/read
export async function markAsReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await markAsRead(req.userId!, param(req, "id"));

    res.status(200).json({
      status: "success",
      message: "Notification marked as read.",
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/notifications/read-all
export async function markAllAsReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await markAllAsRead(req.userId!);

    res.status(200).json({
      status: "success",
      message: "All notifications marked as read.",
    });
  } catch (err) {
    next(err);
  }
}
