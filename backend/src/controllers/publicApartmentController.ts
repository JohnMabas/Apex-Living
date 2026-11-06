import type { Request, Response, NextFunction } from "express";
import {
  getPublicApartment,
  listAmenities,
  listPublicApartments,
} from "../services/apartmentService.js";
import { publicApartmentQuerySchema } from "../validators/apartmentValidators.js";
import { param } from "../utils/requestParams.js";

// ---------------------------------------------------------------------------
// GET /api/v1/apartments
// ---------------------------------------------------------------------------

export async function listPublicApartmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = publicApartmentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listPublicApartments(parsed.data);

    res.status(200).json({
      status: "success",
      data: { apartments: result.apartments },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/apartments/:id
// ---------------------------------------------------------------------------

export async function getPublicApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apartment = await getPublicApartment(param(req, "id"));
    res.status(200).json({ status: "success", data: { apartment } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/amenities
// ---------------------------------------------------------------------------

export async function listAmenitiesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const amenities = await listAmenities();
    res.status(200).json({ status: "success", data: { amenities } });
  } catch (err) {
    next(err);
  }
}
