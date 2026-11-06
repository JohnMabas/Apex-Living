import type { Request, Response, NextFunction } from "express";
import {
  approveApartment,
  archiveAdminApartment,
  getAdminApartment,
  getAdminApartmentStats,
  listAdminApartments,
  rejectApartment,
  requestApartmentChanges,
  suspendApartment,
} from "../services/apartmentService.js";
import {
  adminApartmentQuerySchema,
  rejectApartmentSchema,
  requestChangesSchema,
  suspendApartmentSchema,
} from "../validators/apartmentValidators.js";
import { param } from "../utils/requestParams.js";

// ---------------------------------------------------------------------------
// GET /api/v1/admin/apartments
// ---------------------------------------------------------------------------

export async function listAdminApartmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = adminApartmentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listAdminApartments(parsed.data);

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
// GET /api/v1/admin/apartments/stats
// ---------------------------------------------------------------------------

export async function getAdminApartmentStatsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await getAdminApartmentStats();
    res.status(200).json({ status: "success", data: { stats } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/admin/apartments/:id
// ---------------------------------------------------------------------------

export async function getAdminApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apartment = await getAdminApartment(param(req, "id"));
    res.status(200).json({ status: "success", data: { apartment } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/admin/apartments/:id/approve
// ---------------------------------------------------------------------------

export async function approveApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apartment = await approveApartment(req.userId!, param(req, "id"));
    res.status(200).json({
      status: "success",
      message: "Apartment approved and published.",
      data: { apartment },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/admin/apartments/:id/reject
// ---------------------------------------------------------------------------

export async function rejectApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = rejectApartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "A reason is required.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const apartment = await rejectApartment(
      req.userId!,
      param(req, "id"),
      parsed.data,
    );

    res.status(200).json({
      status: "success",
      message: "Apartment rejected.",
      data: { apartment },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/admin/apartments/:id/request-changes
// ---------------------------------------------------------------------------

export async function requestChangesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = requestChangesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "A reason is required.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const apartment = await requestApartmentChanges(
      req.userId!,
      param(req, "id"),
      parsed.data,
    );

    res.status(200).json({
      status: "success",
      message: "Changes requested from the host.",
      data: { apartment },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/admin/apartments/:id/suspend
// ---------------------------------------------------------------------------

export async function suspendApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = suspendApartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "A reason is required.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const apartment = await suspendApartment(
      req.userId!,
      param(req, "id"),
      parsed.data,
    );

    res.status(200).json({
      status: "success",
      message: "Apartment suspended.",
      data: { apartment },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/admin/apartments/:id/archive
// ---------------------------------------------------------------------------

export async function archiveAdminApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apartment = await archiveAdminApartment(param(req, "id"));
    res.status(200).json({
      status: "success",
      message: "Apartment archived.",
      data: { apartment },
    });
  } catch (err) {
    next(err);
  }
}
