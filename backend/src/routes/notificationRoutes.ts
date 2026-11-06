import { Router } from "express";
import {
  getUnreadCountHandler,
  listNotificationsHandler,
  markAllAsReadHandler,
  markAsReadHandler,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate);

// GET /api/v1/notifications
notificationRouter.get("/", listNotificationsHandler);

// GET /api/v1/notifications/unread-count
notificationRouter.get("/unread-count", getUnreadCountHandler);

// PATCH /api/v1/notifications/read-all
notificationRouter.patch("/read-all", markAllAsReadHandler);

// PATCH /api/v1/notifications/:id/read
notificationRouter.patch("/:id/read", markAsReadHandler);
