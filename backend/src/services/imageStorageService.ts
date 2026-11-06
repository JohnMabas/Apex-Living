import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

export interface StoredImage {
  url: string;
  publicId: string | null;
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary(): void {
  if (!isCloudinaryConfigured()) return;

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

configureCloudinary();

function uploadToCloudinary(buffer: Buffer, folder: string): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError("Image upload failed. Please try again.", 502));
          return;
        }

        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(buffer);
  });
}

async function uploadLocally(buffer: Buffer, mimetype: string): Promise<StoredImage> {
  const extension = MIME_EXTENSIONS[mimetype];
  if (!extension) {
    throw new AppError("Unsupported image type.", 400);
  }

  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadDir, filename), buffer);

  return { url: `/uploads/${filename}`, publicId: null };
}

export async function storeImage(
  buffer: Buffer,
  mimetype: string,
  folder = "nestora/apartments",
): Promise<StoredImage> {
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, folder);
  }

  if (env.NODE_ENV === "production") {
    throw new AppError(
      "Image storage is not configured. Please configure Cloudinary before uploading images.",
      503,
    );
  }

  return uploadLocally(buffer, mimetype);
}

export async function deleteStoredImage(
  url: string,
  publicId: string | null,
): Promise<void> {
  if (publicId && isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // A stale Cloudinary asset must not block removing the database record.
    }
    return;
  }

  if (!url.startsWith("/uploads/")) return;

  const filename = path.basename(url);
  const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, filename);

  try {
    await unlink(filePath);
  } catch {
    // The file may already have been removed; ignore.
  }
}
