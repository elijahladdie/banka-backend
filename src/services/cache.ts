import { env } from "../config/env";
import { Redis } from "ioredis";

let redis: Redis | null = null;
if (env.redisUrl) {
  redis = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
  redis.connect().catch(() => {
    redis = null;
  });
}

const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redis) {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
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
  if (redis) {
    await redis.set(key, payload, "EX", ttlSeconds);
    return;
  }
  memoryCache.set(key, { value: payload, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDelByPrefix(prefix: string) {
  if (redis) {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(keys);
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
}
