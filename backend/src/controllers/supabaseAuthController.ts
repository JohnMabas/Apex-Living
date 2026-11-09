import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getMe, toSafeUser } from "../services/authService.js";
import { linkSupabaseAccount } from "../services/supabaseAuthService.js";

const linkSchema = z.object({
  accessToken: z.string().min(1, "A Supabase access token is required."),
});

// POST /api/v1/auth/supabase/sync
export async function syncSupabaseCustomerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // authenticateCustomer has already verified the token and synchronised the
    // Aiven PostgreSQL customer record.
    const user = await getMe(req.userId!);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      status: "success",
      message: "Customer profile synchronised.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/supabase/link
export async function linkSupabaseCustomerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = linkSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
      });
      return;
    }

    const user = await linkSupabaseAccount(req.userId!, parsed.data.accessToken);
    res.status(200).json({
      status: "success",
      message: "Google account linked successfully.",
      data: { user: toSafeUser(user) },
    });
  } catch (err) {
    next(err);
  }
}
