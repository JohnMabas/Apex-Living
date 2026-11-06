import type { Request, Response, NextFunction } from "express";
import {
  initializeGuestPayment,
  initializePayment,
  verifyGuestPayment,
  verifyPayment,
  processWebhook,
  listGuestPayments,
  getGuestPayment,
  getGuestReceiptPdf,
  getReceiptHtml,
} from "../services/paymentService.js";
import {
  initializeGuestPaymentSchema,
  initializePaymentSchema,
  guestPaymentQuerySchema,
} from "../validators/paymentValidators.js";
import { extractBookingAccessToken } from "../utils/bookingAccessToken.js";
import { param } from "../utils/requestParams.js";
import { AppError } from "../middleware/errorHandler.js";

// POST /api/v1/payments/paystack/initialize
export async function initializePaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = initializePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await initializePayment(req.userId!, parsed.data);

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/payments/paystack/verify/:reference
export async function verifyPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payment = await verifyPayment(req.userId!, param(req, "reference"));
    res.status(200).json({ status: "success", data: { payment } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/payments/paystack/webhook  (NO authentication — public endpoint)
export async function webhookHandler(
  req: Request & { rawBody?: Buffer },
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawBody = req.rawBody;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      res.status(400).json({ status: "error", message: "Missing raw body." });
      return;
    }

    const sig = req.headers["x-paystack-signature"] as string;
    if (!sig) {
      res.status(400).json({ status: "error", message: "Missing Paystack signature header." });
      return;
    }

    await processWebhook(rawBody, sig);
    res.status(200).json({ received: true });
  } catch (err) {
    // Return 200 to prevent Paystack from retrying on AppError (e.g. bad signature)
    if (err instanceof AppError) {
      res.status(200).json({ received: false, error: err.message });
      return;
    }
    next(err);
  }
}

// GET /api/v1/payments/my-payments
export async function listMyPaymentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = guestPaymentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const { page, limit } = parsed.data;
    const result = await listGuestPayments(req.userId!, page, limit);

    res.status(200).json({
      status: "success",
      data: { payments: result.payments },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/payments/:reference
export async function getMyPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payment = await getGuestPayment(req.userId!, param(req, "reference"));
    res.status(200).json({ status: "success", data: { payment } });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/payments/:reference/receipt
export async function getReceiptHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const html = await getReceiptHtml(req.userId!, param(req, "reference"));
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Public guest payments (no account, secure token access)
// ---------------------------------------------------------------------------

// POST /api/v1/payments/guest/initialize
export async function initializeGuestPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = initializeGuestPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await initializeGuestPayment(parsed.data);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/payments/guest/verify/:reference
export async function verifyGuestPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payment = await verifyGuestPayment(
      param(req, "reference"),
      extractBookingAccessToken(req),
    );

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ status: "success", data: { payment } });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/payments/guest/:reference/receipt
export async function getGuestReceiptPdfHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { fileName, buffer } = await getGuestReceiptPdf(
      param(req, "reference"),
      extractBookingAccessToken(req),
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`,
    );
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
}
