import { Router } from "express";
import {
  getCookieConsentHandler,
  saveCookieConsentHandler,
} from "../controllers/cookieConsentController.js";

export const cookieConsentRouter = Router();

// Cookie consent — optional auth (userId populated if authenticated, undefined otherwise)
cookieConsentRouter.get("/", getCookieConsentHandler);
cookieConsentRouter.post("/", saveCookieConsentHandler);
