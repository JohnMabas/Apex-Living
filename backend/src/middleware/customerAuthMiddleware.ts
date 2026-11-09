import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  syncCustomerFromSupabase,
  verifySupabaseAccessToken,
} from "../services/supabaseAuthService.js";

interface LegacyJwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() || null;
  }
  return null;
}

function authenticateLegacyCookie(
  req: Request,
  next: NextFunction,
): void {
  const cookieToken = req.cookies?.nestora_token as string | undefined;
  if (!cookieToken) {
    next(new AppError("Authentication required. Please sign in.", 401));
    return;
  }

  try {
    const payload = jwt.verify(cookieToken, env.JWT_SECRET) as LegacyJwtPayload;
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError("Your session has expired. Please sign in again.", 401));
    } else {
      next(new AppError("Invalid authentication token.", 401));
    }
  }
}

/**
 * Customer authentication.
 *
 * Supabase access tokens are sent as Bearer tokens by the frontend. Legacy
 * host/admin/customer sessions continue to use the HTTP-only Nestora cookie.
 * Supabase identities are verified server-side and synchronised to the Aiven
 * PostgreSQL customer record before the request is allowed through.
 */
export async function authenticateCustomer(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const bearerToken = extractBearerToken(req);

  if (!bearerToken) {
    authenticateLegacyCookie(req, next);
    return;
  }

  try {
    const identity = await verifySupabaseAccessToken(bearerToken);
    const user = await syncCustomerFromSupabase(identity);

    req.userId = user.id;
    req.userRole = user.role;
    req.supabaseUserId = user.supabaseUserId ?? undefined;

    next();
  } catch (err) {
    next(err);
  }
}
