import { Router } from "express";
import {
  getPublicApartmentHandler,
  listAmenitiesHandler,
  listPublicApartmentsHandler,
} from "../controllers/publicApartmentController.js";
import {
  getApartmentAvailabilityHandler,
} from "../controllers/availabilityController.js";

export const publicApartmentRouter = Router();
publicApartmentRouter.get("/", listPublicApartmentsHandler);
publicApartmentRouter.get("/:id", getPublicApartmentHandler);
publicApartmentRouter.get(
  "/:apartmentId/availability",
  getApartmentAvailabilityHandler,
);

export const amenityRouter = Router();
amenityRouter.get("/", listAmenitiesHandler);
