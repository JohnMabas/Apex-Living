import type { Request, Response, NextFunction } from "express";
import {
  checkAvailability,
  getApartmentBlockedDates,
} from "../services/bookingService.js";
import { checkAvailabilitySchema } from "../validators/bookingValidators.js";
import { param } from "../utils/requestParams.js";

// POST /api/v1/bookings/check-availability
export async function checkAvailabilityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = checkAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await checkAvailability(parsed.data);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/apartments/:apartmentId/availability
export async function getApartmentAvailabilityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const blockedDates = await getApartmentBlockedDates(
      param(req, "apartmentId"),
    );

    res.status(200).json({
      status: "success",
      data: { blockedDates },
    });
  } catch (err) {
    next(err);
  }
}
