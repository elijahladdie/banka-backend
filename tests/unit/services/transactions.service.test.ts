import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  repo: {
    runTransaction: vi.fn(),
    countTransactions: vi.fn(),
    listTransactions: vi.fn(),
    getTransactionById: vi.fn()
  },
  paginationMeta: vi.fn(() => ({})),
  parsePagination: vi.fn(() => ({ page: 1, limit: 10, skip: 0 })),
  generateReference: vi.fn(),
  notificationService: {
    depositReceived: vi.fn(),
    sendWithdrawalCode: vi.fn(),
    withdrawalProcessed: vi.fn(),
    transferSent: vi.fn(),
    transferReceived: vi.fn()
  },
  success: vi.fn(),
  error: vi.fn(),
  prismaJoin: vi.fn()
}));

vi.mock("../../../src/repositories/implementations/prismaTransactions.repository", () => ({
  transactionsRepository: mocked.repo
}));
vi.mock("../../../src/utils/pagination", () => ({
  parsePagination: mocked.parsePagination,
  paginationMeta: mocked.paginationMeta
}));
vi.mock("../../../src/utils/reference", () => ({ generateReference: mocked.generateReference }));
vi.mock("../../../src/services/notification.service", () => ({
  notificationService: mocked.notificationService
}));
vi.mock("../../../src/utils/response", () => ({ success: mocked.success, error: mocked.error }));
vi.mock("@prisma/client", () => ({ Prisma: { join: mocked.prismaJoin } }));

describe("transactions service", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("listTransactions", () => {
    it("should return paginated transactions list for managers", async () => {
      mocked.repo.countTransactions.mockResolvedValue(1);
      mocked.repo.listTransactions.mockResolvedValue([{ id: "t1" }]);
      const { transactionsService } = await import("../../../src/services/transactions.service");

      await transactionsService.listTransactions(
        {
          user: { id: "u1", userRoles: [{ role: { slug: "manager" } }] },
          query: {}
        } as any,
        {} as any
      );

      expect(mocked.success).toHaveBeenCalled();
      expect(mocked.repo.listTransactions).toHaveBeenCalled();
    });
  });

  describe("transfer", () => {
    it("should reject when source equals destination", async () => {
      const { transactionsService } = await import("../../../src/services/transactions.service");
      await transactionsService.transfer(
        {
          user: { id: "u1", userRoles: [] },
          body: { fromAccount: "a1", toAccount: "a1", amount: 10 }
        } as any,
        {} as any
      );
      expect(mocked.error).toHaveBeenCalledWith(
        {},
        400,
        "Source and destination accounts must be different"
      );
    });
  });

  describe("deposit", () => {
    it("should reject when user is unauthenticated", async () => {
      const { transactionsService } = await import("../../../src/services/transactions.service");
      await transactionsService.deposit({ user: undefined, body: {} } as any, {} as any);
      expect(mocked.error).toHaveBeenCalledWith({}, 401, "Unauthorized");
    });
  });
});
