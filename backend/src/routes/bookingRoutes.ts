import { Router } from "express";
import {
  cancelMyBookingHandler,
  createBookingHandler,
  getMyBookingHandler,
  listMyBookingsHandler,
} from "../controllers/guestBookingController.js";
import {
  checkAvailabilityHandler,
} from "../controllers/availabilityController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const bookingRouter = Router();

// Availability check — public or authenticated
bookingRouter.post("/check-availability", checkAvailabilityHandler);

// Guest bookings — require authentication
bookingRouter.post("/", authenticate, createBookingHandler);
bookingRouter.get("/my-bookings", authenticate, listMyBookingsHandler);
bookingRouter.get("/:id", authenticate, getMyBookingHandler);
bookingRouter.patch("/:id/cancel", authenticate, cancelMyBookingHandler);
