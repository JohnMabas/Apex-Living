import { Router } from "express";
import {
  getEmailPrefHandler,
  updateEmailPrefHandler,
  unsubscribeHandler,
} from "../controllers/emailPrefController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const emailPrefRouter = Router();

// Authenticated email preference routes
emailPrefRouter.get("/users/me/email-preferences", authenticate, getEmailPrefHandler);
emailPrefRouter.patch("/users/me/email-preferences", authenticate, updateEmailPrefHandler);

// Public token-based unsubscribe
emailPrefRouter.post("/email/unsubscribe", unsubscribeHandler);
