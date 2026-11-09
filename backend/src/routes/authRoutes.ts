import { Router } from "express";
import {
  register,
  login,
  logout,
  me,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/authController.js";
import {
  linkSupabaseCustomerHandler,
  syncSupabaseCustomerHandler,
} from "../controllers/supabaseAuthController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authenticateCustomer } from "../middleware/customerAuthMiddleware.js";
import { authLimiter, forgotPasswordLimiter } from "../middleware/rateLimiters.js";

export const authRouter = Router();

// Public
authRouter.post("/register", authLimiter, register);
authRouter.post("/login", authLimiter, login);
authRouter.post("/forgot-password", forgotPasswordLimiter, forgotPasswordHandler);
authRouter.post("/reset-password", resetPasswordHandler);

// Public logout — always clears the legacy cookie. The frontend also signs the
// Supabase session out.
authRouter.post("/logout", logout);

// Customer authentication (Supabase Bearer token or legacy cookie)
authRouter.get("/me", authenticateCustomer, me);
authRouter.post(
  "/supabase/sync",
  authenticateCustomer,
  syncSupabaseCustomerHandler,
);

// Secure account linking: requires an existing legacy session plus a verified
// Supabase access token whose email matches the existing account.
authRouter.post(
  "/supabase/link",
  authLimiter,
  authenticate,
  linkSupabaseCustomerHandler,
);
