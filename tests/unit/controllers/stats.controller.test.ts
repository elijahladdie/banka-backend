import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  req: {} as any,
  res: {} as any,
  statsService: {
    overview: vi.fn(),
    transactionsSeries: vi.fn(),
    accountsSeries: vi.fn(),
    usersSeries: vi.fn()
  }
}));

vi.mock("../../../src/services/stats.service", () => ({ statsService: mocked.statsService }));

describe("stats controller", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("overview", () => {
    it("should delegate to statsService.overview", async () => {
      const controller = await import("../../../src/controllers/stats.controller");
      await controller.overview(mocked.req, mocked.res);
      expect(mocked.statsService.overview).toHaveBeenCalledWith(mocked.req, mocked.res);
    });

    it("should propagate service errors", async () => {
      mocked.statsService.overview.mockRejectedValueOnce(new Error("stats failed"));
      const controller = await import("../../../src/controllers/stats.controller");
      await expect(controller.overview(mocked.req, mocked.res)).rejects.toThrow("stats failed");
    });
  });

  describe("transactionsSeries", () => {
    it("should delegate to statsService.transactionsSeries", async () => {
      const controller = await import("../../../src/controllers/stats.controller");
      await controller.transactionsSeries(mocked.req, mocked.res);
      expect(mocked.statsService.transactionsSeries).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("accountsSeries", () => {
    it("should delegate to statsService.accountsSeries", async () => {
      const controller = await import("../../../src/controllers/stats.controller");
      await controller.accountsSeries(mocked.req, mocked.res);
      expect(mocked.statsService.accountsSeries).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("usersSeries", () => {
    it("should delegate to statsService.usersSeries", async () => {
      const controller = await import("../../../src/controllers/stats.controller");
      await controller.usersSeries(mocked.req, mocked.res);
      expect(mocked.statsService.usersSeries).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });
});
