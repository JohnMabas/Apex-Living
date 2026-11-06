import { Router } from "express";
import {
  approveApartmentHandler,
  archiveAdminApartmentHandler,
  getAdminApartmentHandler,
  getAdminApartmentStatsHandler,
  listAdminApartmentsHandler,
  rejectApartmentHandler,
  requestChangesHandler,
  suspendApartmentHandler,
} from "../controllers/adminApartmentController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

export const adminApartmentRouter = Router();

adminApartmentRouter.use(authenticate, requireRole("ADMIN"));

adminApartmentRouter.get("/", listAdminApartmentsHandler);
adminApartmentRouter.get("/stats", getAdminApartmentStatsHandler);

adminApartmentRouter.get("/:id", getAdminApartmentHandler);
adminApartmentRouter.post("/:id/approve", approveApartmentHandler);
adminApartmentRouter.post("/:id/reject", rejectApartmentHandler);
adminApartmentRouter.post("/:id/request-changes", requestChangesHandler);
adminApartmentRouter.post("/:id/suspend", suspendApartmentHandler);
adminApartmentRouter.post("/:id/archive", archiveAdminApartmentHandler);
