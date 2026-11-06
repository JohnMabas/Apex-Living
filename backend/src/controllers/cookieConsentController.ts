import type { Request, Response, NextFunction } from "express";
import { getCookieConsent, saveCookieConsent } from "../services/paymentService.js";
import { cookieConsentSchema } from "../validators/paymentValidators.js";

// GET /api/v1/cookie-consent
export async function getCookieConsentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionToken = req.query["sessionToken"] as string | undefined;
    const consent = await getCookieConsent(req.userId, sessionToken);
    res.status(200).json({ status: "success", data: { consent } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/cookie-consent
export async function saveCookieConsentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = cookieConsentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const consent = await saveCookieConsent({ ...parsed.data, userId: req.userId });
    res.status(201).json({ status: "success", data: { consent } });
  } catch (err) {
    next(err);
  }
}
