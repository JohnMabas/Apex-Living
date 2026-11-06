import { Router } from "express";
import {
  initializePaymentHandler,
  verifyPaymentHandler,
  webhookHandler,
  listMyPaymentsHandler,
  getMyPaymentHandler,
  getReceiptHandler,
} from "../controllers/paymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const paymentRouter = Router();

// Paystack integration
paymentRouter.post("/paystack/initialize", authenticate, initializePaymentHandler);
paymentRouter.get("/paystack/verify/:reference", authenticate, verifyPaymentHandler);
// Webhook is public — raw body captured by app.ts middleware before express.json()
paymentRouter.post("/paystack/webhook", webhookHandler);

// Guest payment history — specific paths before /:reference wildcard
paymentRouter.get("/my-payments", authenticate, listMyPaymentsHandler);
paymentRouter.get("/:reference/receipt", authenticate, getReceiptHandler);
paymentRouter.get("/:reference", authenticate, getMyPaymentHandler);
