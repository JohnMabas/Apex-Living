import { Router } from "express";
import {
  getEmailPrefHandler,
  updateEmailPrefHandler,
  unsubscribeHandler,
} from "../controllers/emailPrefController.js";
import { authenticateCustomer } from "../middleware/customerAuthMiddleware.js";

export const emailPrefRouter = Router();

// Authenticated email preference routes
emailPrefRouter.get("/users/me/email-preferences", authenticateCustomer, getEmailPrefHandler);
emailPrefRouter.patch("/users/me/email-preferences", authenticateCustomer, updateEmailPrefHandler);

// Public token-based unsubscribe
emailPrefRouter.post("/email/unsubscribe", unsubscribeHandler);
