import type { Request, Response, NextFunction } from "express";
import { listAdminPayments, listAdminRefunds } from "../services/paymentService.js";
import {
  adminPaymentQuerySchema,
  adminRefundQuerySchema,
} from "../validators/paymentValidators.js";

// GET /api/v1/admin/payments
export async function listAdminPaymentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = adminPaymentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listAdminPayments(parsed.data);

    res.status(200).json({
      status: "success",
      data: { payments: result.payments },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/payments/refunds
export async function listAdminRefundsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = adminRefundQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: "error",
        message: parsed.error.errors[0]?.message ?? "Invalid query.",
      });
      return;
    }

    const result = await listAdminRefunds(parsed.data);

    res.status(200).json({
      status: "success",
      data: { refunds: result.refunds },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}
