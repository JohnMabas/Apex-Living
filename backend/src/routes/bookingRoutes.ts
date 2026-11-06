import { Router } from "express";
import {
  cancelGuestBookingByTokenHandler,
  cancelMyBookingHandler,
  createBookingHandler,
  createGuestBookingHandler,
  getGuestBookingByTokenHandler,
  getMyBookingHandler,
  listMyBookingsHandler,
} from "../controllers/guestBookingController.js";
import {
  checkAvailabilityHandler,
} from "../controllers/availabilityController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  guestBookingAccessLimiter,
  guestBookingCreateLimiter,
} from "../middleware/rateLimiters.js";

export const bookingRouter = Router();

// Availability check — public or authenticated
bookingRouter.post("/check-availability", checkAvailabilityHandler);

// Public guest bookings — no account required, secured with a booking token
bookingRouter.post(
  "/guest",
  guestBookingCreateLimiter,
  createGuestBookingHandler,
);
bookingRouter.get(
  "/guest/:reference",
  guestBookingAccessLimiter,
  getGuestBookingByTokenHandler,
);
bookingRouter.post(
  "/guest/:reference/cancel",
  guestBookingAccessLimiter,
  cancelGuestBookingByTokenHandler,
);

// Account bookings — require authentication
bookingRouter.post("/", authenticate, createBookingHandler);
bookingRouter.get("/my-bookings", authenticate, listMyBookingsHandler);
bookingRouter.get("/:id", authenticate, getMyBookingHandler);
bookingRouter.patch("/:id/cancel", authenticate, cancelMyBookingHandler);
