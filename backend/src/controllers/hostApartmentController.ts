import type { Request, Response, NextFunction } from "express";
import {
  addApartmentImage,
  archiveHostApartment,
  createApartment,
  deleteApartmentImage,
  getHostApartment,
  getHostApartmentStats,
  listHostApartments,
  reorderApartmentImages,
  setPrimaryApartmentImage,
  submitApartment,
  updateApartment,
} from "../services/apartmentService.js";
import {
  createApartmentSchema,
  hostApartmentQuerySchema,
  imageAltTextSchema,
  reorderImagesSchema,
  updateApartmentSchema,
} from "../validators/apartmentValidators.js";
import { param } from "../utils/requestParams.js";

// ---------------------------------------------------------------------------
// POST /api/v1/host/apartments
// ---------------------------------------------------------------------------

export async function createApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createApartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const apartment = await createApartment(req.userId!, parsed.data);

    res.status(201).json({
      status: "success",
      message: "Apartment draft created.",
      data: { apartment },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/host/apartments
// ---------------------------------------------------------------------------

export async function listHostApartmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = hostApartmentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listHostApartments(req.userId!, parsed.data);

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
// GET /api/v1/host/apartments/stats
// ---------------------------------------------------------------------------

export async function getHostApartmentStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await getHostApartmentStats(req.userId!);
    res.status(200).json({ status: "success", data: { stats } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/host/apartments/:id
// ---------------------------------------------------------------------------

export async function getHostApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apartment = await getHostApartment(req.userId!, param(req, "id"));
    res.status(200).json({ status: "success", data: { apartment } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/host/apartments/:id
// ---------------------------------------------------------------------------

export async function updateApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateApartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const apartment = await updateApartment(
      req.userId!,
      param(req, "id"),
      parsed.data,
    );

    res.status(200).json({
      status: "success",
      message: "Apartment updated.",
      data: { apartment },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/host/apartments/:id/submit
// ---------------------------------------------------------------------------

export async function submitApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apartment = await submitApartment(req.userId!, param(req, "id"));
    res.status(200).json({
      status: "success",
      message: "Apartment submitted for review.",
      data: { apartment },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/host/apartments/:id/archive
// ---------------------------------------------------------------------------

export async function archiveApartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apartment = await archiveHostApartment(req.userId!, param(req, "id"));
    res.status(200).json({
      status: "success",
      message: "Apartment archived.",
      data: { apartment },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function uploadApartmentImageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        status: "error",
        message: "Please select an image to upload.",
      });
      return;
    }

    const parsedAlt = imageAltTextSchema.safeParse(req.body);
    const altText = parsedAlt.success ? parsedAlt.data.altText : undefined;

    const image = await addApartmentImage(
      req.userId!,
      param(req, "id"),
      req.file,
      altText,
    );

    res.status(201).json({
      status: "success",
      message: "Image uploaded.",
      data: { image },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteApartmentImageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteApartmentImage(req.userId!, param(req, "id"), param(req, "imageId"));
    res.status(200).json({
      status: "success",
      message: "Image removed.",
    });
  } catch (err) {
    next(err);
  }
}

export async function setPrimaryApartmentImageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await setPrimaryApartmentImage(
      req.userId!,
      param(req, "id"),
      param(req, "imageId"),
    );
    res.status(200).json({
      status: "success",
      message: "Primary image updated.",
    });
  } catch (err) {
    next(err);
  }
}

export async function reorderApartmentImagesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = reorderImagesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid image order.",
      });
      return;
    }

    await reorderApartmentImages(req.userId!, param(req, "id"), parsed.data);

    res.status(200).json({
      status: "success",
      message: "Image order updated.",
    });
  } catch (err) {
    next(err);
  }
}
