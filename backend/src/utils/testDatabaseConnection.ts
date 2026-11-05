import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

async function testDatabaseConnection(): Promise<void> {
  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL is not configured; connection test was not run.");
    process.exitCode = 1;
    return;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.info("Database connection successful.");
  } finally {
    await prisma.$disconnect();
  }
}

void testDatabaseConnection();
