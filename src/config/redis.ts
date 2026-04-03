import { Redis } from "ioredis";
import { env } from "./env";

let redis: Redis | null = null;

if (env.redisUrl) {
  redis = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
  redis.connect().catch(() => {
    redis = null;
  });
}

const memoryBlacklist = new Map<string, number>();

export async function blacklistToken(token: string, ttlSeconds: number) {
  if (!token) return;
  if (redis) {
    await redis.set(`jwt:blacklist:${token}`, "1", "EX", ttlSeconds);
    return;
  }
  memoryBlacklist.set(token, Date.now() + ttlSeconds * 1000);
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!token) return false;
  if (redis) {
    const exists = await redis.get(`jwt:blacklist:${token}`);
    return Boolean(exists);
  }
  const expiresAt = memoryBlacklist.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    memoryBlacklist.delete(token);
    return false;
  }
  return true;
}
