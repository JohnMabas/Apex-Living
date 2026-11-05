import type { Request, Response, NextFunction } from "express";
import { updateProfile, changePassword } from "../services/authService.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/authValidators.js";

// ---------------------------------------------------------------------------
// PATCH /api/v1/users/profile
// ---------------------------------------------------------------------------

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const user = await updateProfile(req.userId!, parsed.data);

    res.status(200).json({
      status: "success",
      message: "Profile updated.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/users/change-password
// ---------------------------------------------------------------------------

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    await changePassword(req.userId!, parsed.data);

    res.status(200).json({
      status: "success",
      message: "Password changed successfully.",
    });
  } catch (err) {
    next(err);
  }
}
