import { Router } from "express";
import { healthRouter } from "./healthRoutes.js";
import { authRouter } from "./authRoutes.js";
import { userRouter } from "./userRoutes.js";
import { adminApartmentRouter } from "./adminApartmentRoutes.js";
import { hostApartmentRouter } from "./hostApartmentRoutes.js";
import {
  amenityRouter,
  publicApartmentRouter,
} from "./publicApartmentRoutes.js";
import { bookingRouter } from "./bookingRoutes.js";
import { hostBookingRouter } from "./hostBookingRoutes.js";
import { adminBookingRouter } from "./adminBookingRoutes.js";
import { paymentRouter } from "./paymentRoutes.js";
import { adminPaymentRouter } from "./adminPaymentRoutes.js";
import { emailPrefRouter } from "./emailPrefRoutes.js";
import { cookieConsentRouter } from "./cookieConsentRoutes.js";
import { notificationRouter } from "./notificationRoutes.js";
import {
  supportRouter,
  adminSupportRouter,
} from "./supportRoutes.js";
import {
  hostAvailabilityRouter,
  adminAvailabilityRouter,
} from "./availabilityRoutes.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);

// Apartments & amenities
apiRouter.use("/apartments", publicApartmentRouter);
apiRouter.use("/amenities", amenityRouter);
apiRouter.use("/host/apartments", hostApartmentRouter);
apiRouter.use("/admin/apartments", adminApartmentRouter);

// Bookings
apiRouter.use("/bookings", bookingRouter);
apiRouter.use("/host/bookings", hostBookingRouter);
apiRouter.use("/admin/bookings", adminBookingRouter);

// Payments (Phase 6)
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/admin/payments", adminPaymentRouter);

// Email preferences & unsubscribe (Phase 6) — registered at root level
// so paths like /users/me/email-preferences and /email/unsubscribe resolve correctly
apiRouter.use(emailPrefRouter);

// Cookie consent (Phase 6)
apiRouter.use("/cookie-consent", cookieConsentRouter);

// Notifications (Phase 7)
apiRouter.use("/notifications", notificationRouter);

// Support tickets (Phase 7)
apiRouter.use("/support", supportRouter);
apiRouter.use("/admin/support", adminSupportRouter);

// Availability blocks (Phase 7)
apiRouter.use("/host", hostAvailabilityRouter);
apiRouter.use("/admin", adminAvailabilityRouter);
