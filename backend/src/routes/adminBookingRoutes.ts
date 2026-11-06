import { Router } from "express";
import {
  adminChangeBookingStatusHandler,
  getAdminBookingHandler,
  getAdminBookingStatsHandler,
  listAdminBookingsHandler,
} from "../controllers/adminBookingController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

export const adminBookingRouter = Router();

adminBookingRouter.use(authenticate, requireRole("ADMIN"));

adminBookingRouter.get("/", listAdminBookingsHandler);
adminBookingRouter.get("/stats", getAdminBookingStatsHandler);
adminBookingRouter.get("/:id", getAdminBookingHandler);
adminBookingRouter.patch("/:id/status", adminChangeBookingStatusHandler);
