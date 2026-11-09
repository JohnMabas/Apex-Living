import { Router } from "express";
import {
  getGuestReceiptPdfHandler,
  initializeGuestPaymentHandler,
  initializePaymentHandler,
  verifyGuestPaymentHandler,
  verifyPaymentHandler,
  webhookHandler,
  listMyPaymentsHandler,
  getMyPaymentHandler,
  getReceiptHandler,
} from "../controllers/paymentController.js";
import { authenticateCustomer } from "../middleware/customerAuthMiddleware.js";
import {
  guestBookingAccessLimiter,
  guestPaymentLimiter,
} from "../middleware/rateLimiters.js";

export const paymentRouter = Router();

// Paystack integration
paymentRouter.post("/paystack/initialize", authenticateCustomer, initializePaymentHandler);
paymentRouter.get("/paystack/verify/:reference", authenticateCustomer, verifyPaymentHandler);
// Webhook is public — raw body captured by app.ts middleware before express.json()
paymentRouter.post("/paystack/webhook", webhookHandler);

// Public guest payments — no account required, secured with a booking token
paymentRouter.post(
  "/guest/initialize",
  guestPaymentLimiter,
  initializeGuestPaymentHandler,
);
paymentRouter.get(
  "/guest/verify/:reference",
  guestPaymentLimiter,
  verifyGuestPaymentHandler,
);
paymentRouter.get(
  "/guest/:reference/receipt",
  guestBookingAccessLimiter,
  getGuestReceiptPdfHandler,
);

// Guest payment history — specific paths before /:reference wildcard
paymentRouter.get("/my-payments", authenticateCustomer, listMyPaymentsHandler);
paymentRouter.get("/:reference/receipt", authenticateCustomer, getReceiptHandler);
paymentRouter.get("/:reference", authenticateCustomer, getMyPaymentHandler);
