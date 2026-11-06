import type { Request, Response, NextFunction } from "express";
import {
  cancelBookingByAccessToken,
  cancelGuestBooking,
  createBooking,
  createGuestBooking,
  getBookingByAccessToken,
  getGuestBooking,
  listGuestBookings,
} from "../services/bookingService.js";
import {
  cancelBookingSchema,
  createBookingSchema,
  createGuestBookingSchema,
  guestBookingQuerySchema,
} from "../validators/bookingValidators.js";
import { extractBookingAccessToken } from "../utils/bookingAccessToken.js";
import { param } from "../utils/requestParams.js";

// POST /api/v1/bookings
export async function createBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const booking = await createBooking(req.userId!, parsed.data);

    res.status(201).json({
      status: "success",
      message: "Booking created. Complete payment to confirm your reservation.",
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/bookings/my-bookings
export async function listMyBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = guestBookingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listGuestBookings(req.userId!, parsed.data);

    res.status(200).json({
      status: "success",
      data: { bookings: result.bookings },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/bookings/:id
export async function getMyBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const booking = await getGuestBooking(req.userId!, param(req, "id"));
    res.status(200).json({ status: "success", data: { booking } });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/bookings/:id/cancel
export async function cancelMyBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = cancelBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "A cancellation reason is required.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const booking = await cancelGuestBooking(
      req.userId!,
      param(req, "id"),
      parsed.data,
    );

    res.status(200).json({
      status: "success",
      message: "Booking cancelled.",
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Public guest booking (no account, secure token access)
// ---------------------------------------------------------------------------

// POST /api/v1/bookings/guest
export async function createGuestBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createGuestBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await createGuestBooking(parsed.data);

    res.setHeader("Cache-Control", "no-store");
    res.status(201).json({
      status: "success",
      message:
        "Booking created. Complete payment to confirm your reservation.",
      data: {
        booking: result.booking,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/bookings/guest/:reference
export async function getGuestBookingByTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const booking = await getBookingByAccessToken(
      param(req, "reference"),
      extractBookingAccessToken(req),
    );

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ status: "success", data: { booking } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/bookings/guest/:reference/cancel
export async function cancelGuestBookingByTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = cancelBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message:
          parsed.error.errors[0]?.message ??
          "A cancellation reason is required.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const booking = await cancelBookingByAccessToken(
      param(req, "reference"),
      extractBookingAccessToken(req),
      parsed.data,
    );

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      status: "success",
      message: "Booking cancelled.",
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}
