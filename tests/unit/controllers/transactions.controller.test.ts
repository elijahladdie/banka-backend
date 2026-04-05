import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  req: {} as any,
  res: {} as any,
  transactionsService: {
    deposit: vi.fn(),
    withdraw: vi.fn(),
    confirmWithdrawal: vi.fn(),
    transfer: vi.fn(),
    listTransactions: vi.fn(),
    getTransactionById: vi.fn()
  }
}));

vi.mock("../../../src/services/transactions.service", () => ({
  transactionsService: mocked.transactionsService
}));

describe("transactions controller", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("transfer", () => {
    it("should delegate to transactionsService.transfer", async () => {
      const controller = await import("../../../src/controllers/transactions.controller");
      await controller.transfer(mocked.req, mocked.res);
      expect(mocked.transactionsService.transfer).toHaveBeenCalledWith(mocked.req, mocked.res);
    });

    it("should propagate service errors", async () => {
      mocked.transactionsService.transfer.mockRejectedValueOnce(new Error("transfer failed"));
      const controller = await import("../../../src/controllers/transactions.controller");
      await expect(controller.transfer(mocked.req, mocked.res)).rejects.toThrow("transfer failed");
    });
  });

  describe("deposit", () => {
    it("should delegate to transactionsService.deposit", async () => {
      const controller = await import("../../../src/controllers/transactions.controller");
      await controller.deposit(mocked.req, mocked.res);
      expect(mocked.transactionsService.deposit).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("withdraw", () => {
    it("should delegate to transactionsService.withdraw", async () => {
      const controller = await import("../../../src/controllers/transactions.controller");
      await controller.withdraw(mocked.req, mocked.res);
      expect(mocked.transactionsService.withdraw).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("confirmWithdrawal", () => {
    it("should delegate to transactionsService.confirmWithdrawal", async () => {
      const controller = await import("../../../src/controllers/transactions.controller");
      await controller.confirmWithdrawal(mocked.req, mocked.res);
      expect(mocked.transactionsService.confirmWithdrawal).toHaveBeenCalledWith(
        mocked.req,
        mocked.res
      );
    });
  });

  describe("listTransactions", () => {
    it("should delegate to transactionsService.listTransactions", async () => {
      const controller = await import("../../../src/controllers/transactions.controller");
      await controller.listTransactions(mocked.req, mocked.res);
      expect(mocked.transactionsService.listTransactions).toHaveBeenCalledWith(
        mocked.req,
        mocked.res
      );
    });
  });

  describe("getTransactionById", () => {
    it("should delegate to transactionsService.getTransactionById", async () => {
      const controller = await import("../../../src/controllers/transactions.controller");
      await controller.getTransactionById(mocked.req, mocked.res);
      expect(mocked.transactionsService.getTransactionById).toHaveBeenCalledWith(
        mocked.req,
        mocked.res
      );
    });
  });
});
