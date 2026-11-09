import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

// ---------------------------------------------------------------------------
// Extend Express Request to carry the authenticated user's data
// ---------------------------------------------------------------------------

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
      supabaseUserId?: string;
    }
  }
}

// ---------------------------------------------------------------------------
// JWT verification helper
// ---------------------------------------------------------------------------

interface JwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

function extractToken(req: Request): string | null {
  // Prefer HTTP-only cookie
  const cookieToken = req.cookies?.nestora_token as string | undefined;
  if (cookieToken) return cookieToken;

  // Fall back to Bearer header (useful for testing with Postman / curl)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

// ---------------------------------------------------------------------------
// authenticate — verifies the JWT and populates req.userId / req.userRole
// ---------------------------------------------------------------------------

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req);

  if (!token) {
    next(new AppError("Authentication required. Please sign in.", 401));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
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

// ---------------------------------------------------------------------------
// requireRole — must be used AFTER authenticate
// ---------------------------------------------------------------------------

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      next(
        new AppError(
          "You do not have permission to access this resource.",
          403,
        ),
      );
      return;
    }
    next();
  };
}
