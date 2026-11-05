import { Router } from "express";
import {
  updateProfileHandler,
  changePasswordHandler,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const userRouter = Router();

// All user routes require authentication
userRouter.use(authenticate);

userRouter.patch("/profile", updateProfileHandler);
userRouter.patch("/change-password", changePasswordHandler);
