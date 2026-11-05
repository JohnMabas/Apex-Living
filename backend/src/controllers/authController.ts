import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
} from "../services/authService.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/authValidators.js";

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

const COOKIE_NAME = "nestora_token";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function setAuthCookie(
  res: Response,
  token: string,
  rememberMe = false,
): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? 30 * MS_PER_DAY : 7 * MS_PER_DAY,
    path: "/",
  });
}

function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, path: "/" });
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/register
// ---------------------------------------------------------------------------

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const payload = await registerUser(parsed.data);
    setAuthCookie(res, payload.token);

    res.status(201).json({
      status: "success",
      message: "Account created successfully.",
      data: { user: payload.user },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/login
// ---------------------------------------------------------------------------

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const payload = await loginUser(parsed.data);
    setAuthCookie(res, payload.token, parsed.data.rememberMe);

    res.status(200).json({
      status: "success",
      message: "Signed in successfully.",
      data: { user: payload.user },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/logout
// ---------------------------------------------------------------------------

export function logout(req: Request, res: Response): void {
  clearAuthCookie(res);
  res.status(200).json({ status: "success", message: "Signed out." });
}

// ---------------------------------------------------------------------------
// GET /api/v1/auth/me
// ---------------------------------------------------------------------------

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // req.userId is set by the authenticate middleware
    const user = await getMe(req.userId!);
    res.status(200).json({ status: "success", data: { user } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/forgot-password
// ---------------------------------------------------------------------------

export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await forgotPassword(parsed.data);

    // Always respond with a generic message to avoid account enumeration
    const responseBody: Record<string, unknown> = {
      status: "success",
      message:
        "If an account with that email or phone exists, a password reset link has been sent.",
    };

    // In development, expose the token so you can test without an email provider
    if (env.NODE_ENV !== "production" && result.devToken) {
      responseBody.devToken = result.devToken;
      responseBody.devNote =
        "⚠️  devToken is only returned in development. Configure an email/SMS provider to send real reset links.";
    }

    res.status(200).json(responseBody);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/reset-password
// ---------------------------------------------------------------------------

export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    await resetPassword(parsed.data);

    res.status(200).json({
      status: "success",
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (err) {
    next(err);
  }
}
