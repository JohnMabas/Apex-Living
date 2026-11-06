import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  if (error?.name === "MulterError") {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "The image is too large. Maximum size is 5 MB."
        : "The image upload could not be processed.";
    response.status(400).json({ status: "error", message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      response.status(409).json({
        status: "error",
        message: "A record with those details already exists.",
      });
      return;
    }

    if (error.code === "P2025") {
      response.status(404).json({
        status: "error",
        message: "The requested record was not found.",
      });
      return;
    }
  }

  console.error(error);
  response.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
