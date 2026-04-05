import { Redis } from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

let redisClient: Redis | null = null;
let connectPromise: Promise<Redis | null> | null = null;
const memoryBlacklist = new Map<string, number>();

function createClient(): Redis | null {
  if (!env.redisUrl) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    redisClient.on("connect", () => {
      logger.info("Redis socket connected");
    });

    redisClient.on("ready", () => {
      logger.info("Redis is ready");
    });

    redisClient.on("error", (error) => {
      logger.error({ error }, "Redis connection error");
    });

    redisClient.on("close", () => {
      logger.warn("Redis connection closed");
    });

    redisClient.on("reconnecting", () => {
      logger.warn("Redis reconnecting");
    });
  }

  return redisClient;
}

export function getRedisClient(): Redis | null {
  return createClient();
}

export async function connectRedis(): Promise<boolean> {
  const client = createClient();

  if (!client) {
    logger.info("Redis is disabled because REDIS_URL is not configured");
    return false;
  }

  if (client.status === "ready") {
    logger.info("Redis already connected");
    return true;
  }

  if (!connectPromise) {
    connectPromise = client
      .connect()
      .then(async () => {
        await client.ping();
        logger.info("Redis connected successfully");
        return client;
      })
      .catch((error) => {
        logger.error({ error }, "Failed to connect to Redis");
        return null;
      })
      .finally(() => {
        connectPromise = null;
      });
  }

  return Boolean(await connectPromise);
}

export async function blacklistToken(token: string, ttlSeconds: number) {
  if (!token) return;

  const redis = getRedisClient();
  if (redis && redis.status === "ready") {
    try {
      await redis.set(`jwt:blacklist:${token}`, "1", "EX", ttlSeconds);
      return;
    } catch {
      // Fall through to in-memory fallback.
    }
  }
  memoryBlacklist.set(token, Date.now() + ttlSeconds * 1000);
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!token) return false;

  const redis = getRedisClient();
  if (redis && redis.status === "ready") {
    try {
      const exists = await redis.get(`jwt:blacklist:${token}`);
      return Boolean(exists);
    } catch {
      // Fall through to in-memory fallback.
    }
  }
  const expiresAt = memoryBlacklist.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    memoryBlacklist.delete(token);
    return false;
  }
  return true;
}
