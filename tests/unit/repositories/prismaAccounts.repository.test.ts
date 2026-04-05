import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn() },
    bankAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock("../../../src/config/prisma", () => ({ prisma: mocked.prisma }));

describe("prisma accounts repository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("updateAccountStatus", () => {
    it("should update account status", async () => {
      const { accountsRepository } =
        await import("../../../src/repositories/implementations/prismaAccounts.repository");
      await accountsRepository.updateAccountStatus("a1", "Active" as any);
      expect(mocked.prisma.bankAccount.update).toHaveBeenCalledWith({
        where: { id: "a1" },
        data: { status: "Active" }
      });
    });
  });

  describe("findAccountByNumber", () => {
    it("should bubble prisma errors", async () => {
      mocked.prisma.bankAccount.findUnique.mockRejectedValueOnce(new Error("lookup failed"));
      const { accountsRepository } =
        await import("../../../src/repositories/implementations/prismaAccounts.repository");
      await expect(accountsRepository.findAccountByNumber("ACC-1")).rejects.toThrow(
        "lookup failed"
      );
    });
  });
});
