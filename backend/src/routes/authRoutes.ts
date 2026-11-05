import { Router } from "express";
import {
  register,
  login,
  logout,
  me,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authLimiter, forgotPasswordLimiter } from "../middleware/rateLimiters.js";

export const authRouter = Router();

// Public
authRouter.post("/register", authLimiter, register);
authRouter.post("/login", authLimiter, login);
authRouter.post("/forgot-password", forgotPasswordLimiter, forgotPasswordHandler);
authRouter.post("/reset-password", resetPasswordHandler);

// Protected
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, me);
