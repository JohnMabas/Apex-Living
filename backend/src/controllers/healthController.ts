import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

export async function getHealth(_request: Request, response: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.status(200).json({
      status: "ok",
      database: "connected",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch {
    response.status(503).json({
      status: "unavailable",
      database: "unavailable",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
  }
}
