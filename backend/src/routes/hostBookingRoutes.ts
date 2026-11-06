import { Router } from "express";
import {
  acceptHostBookingHandler,
  declineHostBookingHandler,
  getHostBookingHandler,
  listHostBookingsHandler,
} from "../controllers/hostBookingController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const hostBookingRouter = Router();

hostBookingRouter.use(authenticate);

hostBookingRouter.get("/", listHostBookingsHandler);
hostBookingRouter.get("/:id", getHostBookingHandler);
hostBookingRouter.patch("/:id/accept", acceptHostBookingHandler);
hostBookingRouter.patch("/:id/decline", declineHostBookingHandler);
