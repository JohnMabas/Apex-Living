import { existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

declare global {
  // eslint-disable-next-line no-var
  var nestoraPrisma: PrismaClient | undefined;
}

function configuredDatabaseUrl(): string | undefined {
  if (!env.DATABASE_URL) return undefined;

  const url = new URL(env.DATABASE_URL);
  if (!["postgresql:", "postgres:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use the PostgreSQL protocol.");
  }

  if (env.DATABASE_CA_CERT_PATH) {
    const certificatePath = resolve(env.DATABASE_CA_CERT_PATH);
    if (!existsSync(certificatePath)) {
      throw new Error("DATABASE_CA_CERT_PATH does not point to a readable certificate file.");
    }
    url.searchParams.set("sslrootcert", certificatePath);
    if (env.NODE_ENV === "production") {
      url.searchParams.set("sslmode", "verify-full");
    }
  }

  if (env.NODE_ENV === "production") {
    const sslMode = url.searchParams.get("sslmode");
    if (!env.DATABASE_CA_CERT_PATH || !["verify-ca", "verify-full"].includes(sslMode ?? "")) {
      throw new Error("Production Aiven connections require DATABASE_CA_CERT_PATH and sslmode=verify-full.");
    }
  }

  return url.toString();
}

const url = configuredDatabaseUrl();
const client = new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

export const prisma = globalThis.nestoraPrisma ?? client;

if (env.NODE_ENV !== "production") {
  globalThis.nestoraPrisma = prisma;
}

export async function connectDatabase(): Promise<boolean> {
  if (!env.DATABASE_URL) {
    console.warn("Database connection skipped: DATABASE_URL is not configured.");
    return false;
  }

  try {
    await prisma.$connect();
    console.info("Database connection established.");
    return true;
  } catch {
    console.error("Database connection failed. Check the Aiven URL, network access, and TLS certificate configuration.");
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
