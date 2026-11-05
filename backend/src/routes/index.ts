import { Router } from "express";
import { healthRouter } from "./healthRoutes.js";
import { authRouter } from "./authRoutes.js";
import { userRouter } from "./userRoutes.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
