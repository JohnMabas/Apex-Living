import type { Request, Response, NextFunction } from "express";
import {
  adminChangeBookingStatus,
  getAdminBooking,
  getAdminBookingStats,
  listAdminBookings,
} from "../services/bookingService.js";
import {
  adminBookingQuerySchema,
  adminStatusChangeSchema,
} from "../validators/bookingValidators.js";
import { param } from "../utils/requestParams.js";

// GET /api/v1/admin/bookings
export async function listAdminBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = adminBookingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listAdminBookings(parsed.data);

    res.status(200).json({
      status: "success",
      data: { bookings: result.bookings },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/bookings/stats
export async function getAdminBookingStatsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await getAdminBookingStats();
    res.status(200).json({ status: "success", data: { stats } });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/bookings/:id
export async function getAdminBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const booking = await getAdminBooking(param(req, "id"));
    res.status(200).json({ status: "success", data: { booking } });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/admin/bookings/:id/status
export async function adminChangeBookingStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = adminStatusChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid status.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const booking = await adminChangeBookingStatus(
      req.userId!,
      param(req, "id"),
      parsed.data,
    );

    res.status(200).json({
      status: "success",
      message: "Booking status updated.",
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}
