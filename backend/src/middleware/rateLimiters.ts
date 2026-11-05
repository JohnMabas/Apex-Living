import rateLimit from "express-rate-limit";

/**
 * Strict limiter for login and registration.
 * 10 attempts per IP per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message:
      "Too many attempts from this IP address. Please try again in 15 minutes.",
  },
});

/**
 * Strict limiter for forgot-password endpoint.
 * 5 requests per IP per hour — prevents abuse of reset link generation.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message:
      "Too many password reset requests. Please try again in an hour.",
  },
});

/**
 * General API limiter for all routes.
 * 200 requests per IP per 15 minutes.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests. Please slow down.",
  },
});
