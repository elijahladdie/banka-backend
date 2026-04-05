import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    transaction: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

vi.mock("../../../src/config/prisma", () => ({ prisma: mocked.prisma }));

describe("prisma transactions repository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("runTransaction", () => {
    it("should run callback inside prisma transaction", async () => {
      mocked.prisma.$transaction.mockImplementation(async (fn: any) => fn({ tx: true }));
      const { transactionsRepository } =
        await import("../../../src/repositories/implementations/prismaTransactions.repository");
      const runResult = await transactionsRepository.runTransaction(async () => "ok");
      expect(runResult).toBe("ok");
    });
  });

  describe("listTransactions", () => {
    it("should strip confirmationToken from returned rows", async () => {
      mocked.prisma.transaction.findMany.mockResolvedValue([
        {
          id: "t1",
          confirmationToken: "1234",
          sourceAccount: null,
          destinationAccount: null,
          performedByUser: null
        }
      ]);
      const { transactionsRepository } =
        await import("../../../src/repositories/implementations/prismaTransactions.repository");
      const listed = await transactionsRepository.listTransactions({
        where: {},
        skip: 0,
        take: 10
      });
      expect((listed[0] as any).confirmationToken).toBeUndefined();
    });
  });

  describe("countTransactions", () => {
    it("should bubble prisma errors", async () => {
      mocked.prisma.transaction.count.mockRejectedValueOnce(new Error("count failed"));
      const { transactionsRepository } =
        await import("../../../src/repositories/implementations/prismaTransactions.repository");
      await expect(transactionsRepository.countTransactions({})).rejects.toThrow("count failed");
    });
  });
});
