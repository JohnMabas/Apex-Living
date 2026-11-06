import { Router } from "express";
import {
  listAdminPaymentsHandler,
  listAdminRefundsHandler,
} from "../controllers/adminPaymentController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

export const adminPaymentRouter = Router();

adminPaymentRouter.use(authenticate, requireRole("ADMIN"));

adminPaymentRouter.get("/", listAdminPaymentsHandler);
adminPaymentRouter.get("/refunds", listAdminRefundsHandler);
