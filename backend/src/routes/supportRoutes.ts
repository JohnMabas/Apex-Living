import { Router } from "express";
import {
  assignTicketHandler,
  addTicketMessageHandler,
  createTicketHandler,
  getTicketHandler,
  listAdminTicketsHandler,
  updateTicketStatusHandler,
} from "../controllers/supportController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";
import { supportTicketLimiter } from "../middleware/rateLimiters.js";

export const supportRouter = Router();
export const adminSupportRouter = Router();

// POST /api/v1/support/tickets (public, rate-limited)
supportRouter.post("/tickets", supportTicketLimiter, createTicketHandler);

// Admin support routes — all require authentication + ADMIN role
adminSupportRouter.use(authenticate, requireRole("ADMIN"));

// GET /api/v1/admin/support/tickets
adminSupportRouter.get("/tickets", listAdminTicketsHandler);

// GET /api/v1/admin/support/tickets/:id
adminSupportRouter.get("/tickets/:id", getTicketHandler);

// POST /api/v1/admin/support/tickets/:id/messages
adminSupportRouter.post("/tickets/:id/messages", addTicketMessageHandler);

// PATCH /api/v1/admin/support/tickets/:id/assign
adminSupportRouter.patch("/tickets/:id/assign", assignTicketHandler);

// PATCH /api/v1/admin/support/tickets/:id/status
adminSupportRouter.patch("/tickets/:id/status", updateTicketStatusHandler);
