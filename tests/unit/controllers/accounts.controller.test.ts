import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  req: {} as any,
  res: {} as any,
  accountsService: {
    createAccount: vi.fn(),
    listAccounts: vi.fn(),
    getAccountById: vi.fn(),
    getAccountByNumber: vi.fn(),
    approveAccount: vi.fn(),
    rejectAccount: vi.fn(),
    updateAccountStatus: vi.fn()
  }
}));

vi.mock("../../../src/services/accounts.service", () => ({
  accountsService: mocked.accountsService
}));

describe("accounts controller", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("createAccount", () => {
    it("should delegate to accountsService.createAccount", async () => {
      const controller = await import("../../../src/controllers/accounts.controller");
      await controller.createAccount(mocked.req, mocked.res);
      expect(mocked.accountsService.createAccount).toHaveBeenCalledWith(mocked.req, mocked.res);
    });

    it("should propagate service errors", async () => {
      mocked.accountsService.createAccount.mockRejectedValueOnce(new Error("create failed"));
      const controller = await import("../../../src/controllers/accounts.controller");
      await expect(controller.createAccount(mocked.req, mocked.res)).rejects.toThrow(
        "create failed"
      );
    });
  });

  describe("listAccounts", () => {
    it("should delegate to accountsService.listAccounts", async () => {
      const controller = await import("../../../src/controllers/accounts.controller");
      await controller.listAccounts(mocked.req, mocked.res);
      expect(mocked.accountsService.listAccounts).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("getAccountById", () => {
    it("should delegate to accountsService.getAccountById", async () => {
      const controller = await import("../../../src/controllers/accounts.controller");
      await controller.getAccountById(mocked.req, mocked.res);
      expect(mocked.accountsService.getAccountById).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("getAccountByNumber", () => {
    it("should delegate to accountsService.getAccountByNumber", async () => {
      const controller = await import("../../../src/controllers/accounts.controller");
      await controller.getAccountByNumber(mocked.req, mocked.res);
      expect(mocked.accountsService.getAccountByNumber).toHaveBeenCalledWith(
        mocked.req,
        mocked.res
      );
    });
  });

  describe("approveAccount", () => {
    it("should delegate to accountsService.approveAccount", async () => {
      const controller = await import("../../../src/controllers/accounts.controller");
      await controller.approveAccount(mocked.req, mocked.res);
      expect(mocked.accountsService.approveAccount).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("rejectAccount", () => {
    it("should delegate to accountsService.rejectAccount", async () => {
      const controller = await import("../../../src/controllers/accounts.controller");
      await controller.rejectAccount(mocked.req, mocked.res);
      expect(mocked.accountsService.rejectAccount).toHaveBeenCalledWith(mocked.req, mocked.res);
    });
  });

  describe("updateAccountStatus", () => {
    it("should delegate to accountsService.updateAccountStatus", async () => {
      const controller = await import("../../../src/controllers/accounts.controller");
      await controller.updateAccountStatus(mocked.req, mocked.res);
      expect(mocked.accountsService.updateAccountStatus).toHaveBeenCalledWith(
        mocked.req,
        mocked.res
      );
    });
  });
});
