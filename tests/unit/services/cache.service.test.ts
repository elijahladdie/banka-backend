import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  env: { redisUrl: undefined as string | undefined },
  Redis: vi.fn(),
  redisClient: {
    connect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    set: vi.fn(),
    keys: vi.fn(),
    del: vi.fn()
  }
}));

vi.mock("../../../src/config/env", () => ({ env: mocked.env }));
vi.mock("ioredis", () => ({ Redis: mocked.Redis }));

describe("cache service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("cacheGet/cacheSet", () => {
    it("should use in-memory cache when redis is not configured", async () => {
      mocked.env.redisUrl = undefined;
      const { cacheSet, cacheGet } = await import("../../../src/services/cache");

      await cacheSet("k1", { value: 1 }, 10);
      const value = await cacheGet<{ value: number }>("k1");

      expect(value).toEqual({ value: 1 });
      expect(mocked.Redis).not.toHaveBeenCalled();
    });
  });

  describe("cacheDelByPrefix", () => {
    it("should delete all in-memory keys matching prefix", async () => {
      mocked.env.redisUrl = undefined;
      const { cacheSet, cacheGet, cacheDelByPrefix } = await import("../../../src/services/cache");

      await cacheSet("users:1", { id: 1 }, 10);
      await cacheSet("users:2", { id: 2 }, 10);
      await cacheDelByPrefix("users:");

      await expect(cacheGet("users:1")).resolves.toBeNull();
      await expect(cacheGet("users:2")).resolves.toBeNull();
    });
  });
});
