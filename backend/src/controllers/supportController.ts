import type { Request, Response, NextFunction } from "express";
import {
  addMessage,
  assignTicket,
  createSupportTicket,
  getTicket,
  listAdminTickets,
  updateTicketStatus,
} from "../services/supportService.js";
import {
  addTicketMessageSchema,
  adminTicketQuerySchema,
  assignTicketSchema,
  createSupportTicketSchema,
  updateTicketStatusSchema,
} from "../validators/supportValidators.js";
import { param } from "../utils/requestParams.js";

// POST /api/v1/support/tickets (public, rate-limited)
export async function createTicketHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createSupportTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await createSupportTicket(parsed.data);

    res.status(201).json({
      status: "success",
      message: "Your support ticket has been submitted. We will be in touch soon.",
      data: { ticket: result.ticket },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/support/tickets (admin)
export async function listAdminTicketsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = adminTicketQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listAdminTickets(parsed.data);

    res.status(200).json({
      status: "success",
      data: { tickets: result.tickets },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/support/tickets/:id (admin)
export async function getTicketHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ticket = await getTicket(param(req, "id"), { includeInternal: true });

    res.status(200).json({
      status: "success",
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/admin/support/tickets/:id/messages (admin)
export async function addTicketMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = addTicketMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const ticket = await addMessage(
      param(req, "id"),
      parsed.data,
      req.userId,
      "Support Team",
    );

    res.status(201).json({
      status: "success",
      message: "Message added.",
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/admin/support/tickets/:id/assign (admin)
export async function assignTicketHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = assignTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const ticket = await assignTicket(param(req, "id"), parsed.data.assignedToId);

    res.status(200).json({
      status: "success",
      message: "Ticket assignment updated.",
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/admin/support/tickets/:id/status (admin)
export async function updateTicketStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateTicketStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const ticket = await updateTicketStatus(
      param(req, "id"),
      parsed.data.status,
    );

    res.status(200).json({
      status: "success",
      message: "Ticket status updated.",
      data: { ticket },
    });
  } catch (err) {
    next(err);
  }
}
