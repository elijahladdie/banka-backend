import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  repo: {
    findUserById: vi.fn(),
    findAccountByNumber: vi.fn(),
    createAccount: vi.fn(),
    countAccounts: vi.fn(),
    listAccounts: vi.fn(),
    getAccountById: vi.fn(),
    updateAccountStatus: vi.fn()
  },
  generateAccountNumber: vi.fn(),
  paginationMeta: vi.fn(() => ({})),
  parsePagination: vi.fn(() => ({ page: 1, limit: 10, skip: 0 })),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDelByPrefix: vi.fn(),
  notificationService: {
    bankAccountCreated: vi.fn(),
    accountApproved: vi.fn(),
    accountRejected: vi.fn(),
    accountFrozen: vi.fn(),
    accountClosed: vi.fn()
  },
  buildAccountsSearchCondition: vi.fn(() => ({})),
  success: vi.fn(),
  error: vi.fn()
}));

vi.mock("../../../src/repositories/implementations/prismaAccounts.repository", () => ({
  accountsRepository: mocked.repo
}));
vi.mock("../../../src/utils/generateAccountNumber", () => ({
  generateAccountNumber: mocked.generateAccountNumber
}));
vi.mock("../../../src/utils/pagination", () => ({
  parsePagination: mocked.parsePagination,
  paginationMeta: mocked.paginationMeta
}));
vi.mock("../../../src/services/cache", () => ({
  cacheGet: mocked.cacheGet,
  cacheSet: mocked.cacheSet,
  cacheDelByPrefix: mocked.cacheDelByPrefix
}));
vi.mock("../../../src/services/notification.service", () => ({
  notificationService: mocked.notificationService
}));
vi.mock("../../../src/utils/search.helper", () => ({
  buildAccountsSearchCondition: mocked.buildAccountsSearchCondition
}));
vi.mock("../../../src/utils/response", () => ({ success: mocked.success, error: mocked.error }));

describe("accounts service", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("listAccounts", () => {
    it("should return cached accounts list", async () => {
      mocked.cacheGet.mockResolvedValue({
        items: [{ id: "a1", owner: { id: "u1", password: "hidden" } }],
        total: 1
      });
      const { accountsService } = await import("../../../src/services/accounts.service");

      await accountsService.listAccounts(
        { user: { id: "u1", userRoles: [{ role: { slug: "client" } }] }, query: {} } as any,
        {} as any
      );

      expect(mocked.success).toHaveBeenCalled();
      expect(mocked.repo.countAccounts).not.toHaveBeenCalled();
    });
  });

  describe("createAccount", () => {
    it("should reject when user is missing", async () => {
      const { accountsService } = await import("../../../src/services/accounts.service");
      await accountsService.createAccount({ user: undefined, body: {} } as any, {} as any);
      expect(mocked.error).toHaveBeenCalledWith({}, 401, "Unauthorized");
    });
  });

  describe("approveAccount", () => {
    it("should return 404 when account not found", async () => {
      mocked.repo.getAccountById.mockResolvedValue(null);
      const { accountsService } = await import("../../../src/services/accounts.service");
      await accountsService.approveAccount({ params: { id: "a1" } } as any, {} as any);
      expect(mocked.error).toHaveBeenCalledWith({}, 404, "Account not found");
    });
  });
});
