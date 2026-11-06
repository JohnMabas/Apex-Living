import type { Request, Response, NextFunction } from "express";
import {
  adminCreateAvailabilityBlock,
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  getApartmentAvailabilityData,
  listAvailabilityBlocks,
  listHostAvailabilityBlocks,
} from "../services/availabilityService.js";
import { checkAvailability } from "../services/bookingService.js";
import { checkAvailabilitySchema } from "../validators/bookingValidators.js";
import {
  availabilityBlockSchema,
  availabilityBlockQuerySchema,
} from "../validators/availabilityValidators.js";
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
    const result = await getApartmentAvailabilityData(
      param(req, "apartmentId"),
    );
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/host/apartments/:id/availability
export async function listHostAvailabilityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listAvailabilityBlocks(
      param(req, "id"),
      req.userId!,
    );
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/host/apartments/:id/availability/block
export async function createAvailabilityBlockHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = availabilityBlockSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const block = await createAvailabilityBlock(
      param(req, "id"),
      req.userId!,
      parsed.data,
    );

    res.status(201).json({ status: "success", data: { block } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/host/apartments/:id/availability/block/:blockId
export async function deleteAvailabilityBlockHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteAvailabilityBlock(
      param(req, "id"),
      param(req, "blockId"),
      req.userId!,
    );
    res.status(200).json({ status: "success", data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/host/availability
export async function listHostAvailabilityOverviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = availabilityBlockQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listHostAvailabilityBlocks(
      req.userId!,
      parsed.data,
    );
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/admin/apartments/:id/availability/block
export async function adminCreateAvailabilityBlockHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = availabilityBlockSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const block = await adminCreateAvailabilityBlock(
      param(req, "id"),
      req.userId!,
      parsed.data,
    );

    res.status(201).json({ status: "success", data: { block } });
  } catch (err) {
    next(err);
  }
}
