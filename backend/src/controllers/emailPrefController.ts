import type { Request, Response, NextFunction } from "express";
import {
  getEmailPreferences,
  updateEmailPreferences,
  unsubscribeByToken,
} from "../services/paymentService.js";
import { emailPrefSchema } from "../validators/paymentValidators.js";

// GET /api/v1/users/me/email-preferences
export async function getEmailPrefHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const prefs = await getEmailPreferences(req.userId!);
    res.status(200).json({ status: "success", data: { prefs } });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/users/me/email-preferences
export async function updateEmailPrefHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = emailPrefSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const prefs = await updateEmailPreferences(req.userId!, parsed.data);
    res.status(200).json({ status: "success", data: { prefs } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/email/unsubscribe  (NO authentication — token-based)
export async function unsubscribeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token } = req.body as { token?: string };
    if (!token || typeof token !== "string" || token.trim() === "") {
      res.status(400).json({
        status: "error",
        message: "A valid unsubscribe token is required.",
      });
      return;
    }

    await unsubscribeByToken(token.trim());
    res.status(200).json({
      status: "success",
      message: "You have been successfully unsubscribed from promotional emails.",
    });
  } catch (err) {
    next(err);
  }
}
