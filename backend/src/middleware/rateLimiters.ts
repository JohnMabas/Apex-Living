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

/**
 * Guest booking creation — limits automated booking spam while allowing a
 * genuine traveller to retry after a validation error.
 * 10 bookings per IP per hour.
 */
export const guestBookingCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message:
      "Too many booking attempts from this IP address. Please try again later or contact support.",
  },
});

/**
 * Secure guest booking lookup/cancellation and payment access.
 * 60 requests per IP per 15 minutes.
 */
export const guestBookingAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests. Please try again in a few minutes.",
  },
});

/**
 * Guest payment initialization/verification.
 * 30 requests per IP per 15 minutes.
 */
export const guestPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many payment attempts. Please try again in a few minutes.",
  },
});

/**
 * Support ticket creation — prevents spam submissions.
 * 5 tickets per IP per hour.
 */
export const supportTicketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message:
      "Too many support ticket submissions from this IP address. Please try again later.",
  },
});
