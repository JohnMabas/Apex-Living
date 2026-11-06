import { Router } from "express";
import {
  adminCreateAvailabilityBlockHandler,
  createAvailabilityBlockHandler,
  deleteAvailabilityBlockHandler,
  listHostAvailabilityHandler,
  listHostAvailabilityOverviewHandler,
} from "../controllers/availabilityController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

// ---------------------------------------------------------------------------
// Host availability routes — all require authentication
// ---------------------------------------------------------------------------

export const hostAvailabilityRouter = Router();
hostAvailabilityRouter.use(authenticate);

// GET /api/v1/host/apartments/:id/availability
hostAvailabilityRouter.get(
  "/apartments/:id/availability",
  listHostAvailabilityHandler,
);

// POST /api/v1/host/apartments/:id/availability/block
hostAvailabilityRouter.post(
  "/apartments/:id/availability/block",
  createAvailabilityBlockHandler,
);

// DELETE /api/v1/host/apartments/:id/availability/block/:blockId
hostAvailabilityRouter.delete(
  "/apartments/:id/availability/block/:blockId",
  deleteAvailabilityBlockHandler,
);

// GET /api/v1/host/availability
hostAvailabilityRouter.get("/availability", listHostAvailabilityOverviewHandler);

// ---------------------------------------------------------------------------
// Admin availability routes — require authentication + ADMIN role
// ---------------------------------------------------------------------------

export const adminAvailabilityRouter = Router();
adminAvailabilityRouter.use(authenticate, requireRole("ADMIN"));

// POST /api/v1/admin/apartments/:id/availability/block
adminAvailabilityRouter.post(
  "/apartments/:id/availability/block",
  adminCreateAvailabilityBlockHandler,
);
