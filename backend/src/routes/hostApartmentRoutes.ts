import { Router } from "express";
import {
  archiveApartmentHandler,
  createApartmentHandler,
  deleteApartmentImageHandler,
  getHostApartmentHandler,
  getHostApartmentStatsHandler,
  listHostApartmentsHandler,
  reorderApartmentImagesHandler,
  setPrimaryApartmentImageHandler,
  submitApartmentHandler,
  updateApartmentHandler,
  uploadApartmentImageHandler,
} from "../controllers/hostApartmentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { imageUpload } from "../middleware/uploadMiddleware.js";

export const hostApartmentRouter = Router();

hostApartmentRouter.use(authenticate);

hostApartmentRouter.get("/", listHostApartmentsHandler);
hostApartmentRouter.post("/", createApartmentHandler);
hostApartmentRouter.get("/stats", getHostApartmentStatsHandler);

hostApartmentRouter.get("/:id", getHostApartmentHandler);
hostApartmentRouter.patch("/:id", updateApartmentHandler);
hostApartmentRouter.post("/:id/submit", submitApartmentHandler);
hostApartmentRouter.post("/:id/archive", archiveApartmentHandler);

hostApartmentRouter.post(
  "/:id/images",
  imageUpload,
  uploadApartmentImageHandler,
);
hostApartmentRouter.patch(
  "/:id/images/reorder",
  reorderApartmentImagesHandler,
);
hostApartmentRouter.patch(
  "/:id/images/:imageId/primary",
  setPrimaryApartmentImageHandler,
);
hostApartmentRouter.delete(
  "/:id/images/:imageId",
  deleteApartmentImageHandler,
);
