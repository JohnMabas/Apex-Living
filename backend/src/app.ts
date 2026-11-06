import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiters.js";
import { apiRouter } from "./routes/index.js";
import { startScheduler } from "./services/schedulerService.js";

export const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true, // Required for cross-origin HTTP-only cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// CRITICAL: Capture raw body for Paystack webhook signature verification.
// This MUST come before express.json() so the raw Buffer is still available.
app.use(
  "/api/v1/payments/paystack/webhook",
  express.raw({ type: "application/json" }),
  (req: express.Request & { rawBody?: Buffer }, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = req.body as Buffer;
    next();
  },
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
    maxAge: "7d",
  }),
);
app.use(generalLimiter);
app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

// Start the background job scheduler
startScheduler();
