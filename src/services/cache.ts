import { getRedisClient } from "../config/redis";

const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (redis && redis.status === "ready") {
    try {
      const value = await redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      // Fall through to in-memory fallback.
    }
  }
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return JSON.parse(hit.value) as T;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number) {
  const payload = JSON.stringify(value);

  const redis = getRedisClient();
  if (redis && redis.status === "ready") {
    try {
      await redis.set(key, payload, "EX", ttlSeconds);
      return;
    } catch {
      // Fall through to in-memory fallback.
    }
  }
  memoryCache.set(key, { value: payload, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDelByPrefix(prefix: string) {
  const redis = getRedisClient();
  if (redis && redis.status === "ready") {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length) await redis.del(keys);
      return;
    } catch {
      // Fall through to in-memory fallback.
    }
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
}
