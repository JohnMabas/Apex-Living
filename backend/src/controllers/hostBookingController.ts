import type { Request, Response, NextFunction } from "express";
import {
  acceptHostBooking,
  declineHostBooking,
  getHostBooking,
  listHostBookings,
} from "../services/bookingService.js";
import {
  declineBookingSchema,
  hostBookingQuerySchema,
} from "../validators/bookingValidators.js";
import { param } from "../utils/requestParams.js";

// GET /api/v1/host/bookings
export async function listHostBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = hostBookingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listHostBookings(req.userId!, parsed.data);

    res.status(200).json({
      status: "success",
      data: { bookings: result.bookings },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/host/bookings/:id
export async function getHostBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const booking = await getHostBooking(req.userId!, param(req, "id"));
    res.status(200).json({ status: "success", data: { booking } });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/host/bookings/:id/accept
export async function acceptHostBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const booking = await acceptHostBooking(req.userId!, param(req, "id"));
    res.status(200).json({
      status: "success",
      message: "Booking accepted.",
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/host/bookings/:id/decline
export async function declineHostBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = declineBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "A reason is required.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const booking = await declineHostBooking(
      req.userId!,
      param(req, "id"),
      parsed.data,
    );

    res.status(200).json({
      status: "success",
      message: "Booking declined.",
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}
