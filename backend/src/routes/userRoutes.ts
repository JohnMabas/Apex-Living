import { Router } from "express";
import {
  updateProfileHandler,
  changePasswordHandler,
} from "../controllers/userController.js";
import { authenticateCustomer } from "../middleware/customerAuthMiddleware.js";

export const userRouter = Router();

// All user routes require authentication
userRouter.use(authenticateCustomer);

userRouter.patch("/profile", updateProfileHandler);
userRouter.patch("/change-password", changePasswordHandler);
