import multer from "multer";
import { AppError } from "./errorHandler.js";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(
        new AppError(
          "Only JPEG, PNG, and WebP images are allowed.",
          400,
        ),
      );
      return;
    }

    callback(null, true);
  },
}).single("image");
