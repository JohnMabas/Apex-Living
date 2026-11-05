import type { ErrorRequestHandler, RequestHandler } from "express";

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
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  response.status(statusCode).json({
    status: "error",
    message: statusCode === 500 ? "Internal server error" : error.message,
  });
};
