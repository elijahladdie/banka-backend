import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  repo: {
    countActiveUsers: vi.fn(),
    countAccounts: vi.fn(),
    aggregateTransactions: vi.fn(),
    countPendingUsers: vi.fn(),
    groupTransactions: vi.fn(),
    groupAccounts: vi.fn(),
    groupUsersByRole: vi.fn()
  },
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  success: vi.fn()
}));

vi.mock("../../../src/repositories/implementations/prismaStats.repository", () => ({
  statsRepository: mocked.repo
}));
vi.mock("../../../src/services/cache", () => ({
  cacheGet: mocked.cacheGet,
  cacheSet: mocked.cacheSet
}));
vi.mock("../../../src/utils/response", () => ({ success: mocked.success }));

describe("stats service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("overview", () => {
    it("should return cached overview when present", async () => {
      mocked.cacheGet.mockResolvedValue({ activeUsers: 1 });
      const { statsService } = await import("../../../src/services/stats.service");
      await statsService.overview({ query: {} } as any, {} as any);
      expect(mocked.success).toHaveBeenCalledWith({}, "Overview stats fetched", { activeUsers: 1 });
    });

    it("should build overview from repository and cache it", async () => {
      mocked.cacheGet.mockResolvedValue(null);
      mocked.repo.countActiveUsers.mockResolvedValue(10);
      mocked.repo.countAccounts.mockResolvedValue(5);
      mocked.repo.aggregateTransactions.mockResolvedValue({
        _count: { id: 3 },
        _sum: { amount: 200 }
      });
      mocked.repo.countPendingUsers.mockResolvedValue(2);
      const { statsService } = await import("../../../src/services/stats.service");
      await statsService.overview({ query: {} } as any, {} as any);
      expect(mocked.cacheSet).toHaveBeenCalled();
      expect(mocked.success).toHaveBeenCalled();
    });
  });

  describe("transactionsSeries", () => {
    it("should throw when repository call fails", async () => {
      mocked.repo.groupTransactions.mockRejectedValueOnce(new Error("stats unavailable"));
      const { statsService } = await import("../../../src/services/stats.service");
      await expect(
        statsService.transactionsSeries({ query: {} } as any, {} as any)
      ).rejects.toThrow("stats unavailable");
    });
  });
});
