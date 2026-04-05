import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";
import { logger } from "./logger";

const connectionString = env.databaseUrl;

const pool = new Pool({
  connectionString,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"]
});

export const verifyConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connected successfully!");
    return true;
  } catch (error) {
    logger.error("Failed to connect to database:");
    process.exit(1);
  }
};
