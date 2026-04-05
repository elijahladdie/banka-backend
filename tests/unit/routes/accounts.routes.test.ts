import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  router: {
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  },
  authenticate: { name: "authenticate" },
  requireRole: vi.fn((...roles: string[]) => ({ type: "requireRole", roles })),
  createAccount: { name: "createAccount" },
  listAccounts: { name: "listAccounts" },
  getAccountById: { name: "getAccountById" },
  getAccountByNumber: { name: "getAccountByNumber" },
  approveAccount: { name: "approveAccount" },
  rejectAccount: { name: "rejectAccount" },
  updateAccountStatus: { name: "updateAccountStatus" },
  createAccountSchema: { name: "createAccountSchema" },
  accountListSchema: { name: "accountListSchema" },
  accountNumberParamSchema: { name: "accountNumberParamSchema" },
  idParamSchema: { name: "idParamSchema" },
  accountDecisionSchema: { name: "accountDecisionSchema" },
  accountStatusSchema: { name: "accountStatusSchema" },
  validate: vi.fn((schema: unknown) => ({ type: "validate", schema })),
  asyncWrapper: vi.fn((handler: unknown) => ({ type: "wrapped", handler }))
}));

vi.mock("express", () => ({
  Router: vi.fn(() => mocked.router)
}));

vi.mock("../../../src/controllers/accounts.controller", () => ({
  createAccount: mocked.createAccount,
  listAccounts: mocked.listAccounts,
  getAccountById: mocked.getAccountById,
  getAccountByNumber: mocked.getAccountByNumber,
  approveAccount: mocked.approveAccount,
  rejectAccount: mocked.rejectAccount,
  updateAccountStatus: mocked.updateAccountStatus
}));

vi.mock("../../../src/middleware/auth", () => ({
  authenticate: mocked.authenticate,
  requireRole: mocked.requireRole
}));

vi.mock("../../../src/middleware/validate", () => ({
  validate: mocked.validate
}));

vi.mock("../../../src/utils/asyncWrapper", () => ({
  asyncWrapper: mocked.asyncWrapper
}));

vi.mock("../../../src/validators/account.validator", () => ({
  createAccountSchema: mocked.createAccountSchema,
  accountListSchema: mocked.accountListSchema,
  accountNumberParamSchema: mocked.accountNumberParamSchema,
  accountDecisionSchema: mocked.accountDecisionSchema,
  accountStatusSchema: mocked.accountStatusSchema
}));

vi.mock("../../../src/validators/user.validator", () => ({
  idParamSchema: mocked.idParamSchema
}));

describe("routes/accounts", () => {
  it("applies authentication globally and registers all account route role/validation conditions", async () => {
    const { default: router } = await import("../../../src/routes/accounts.routes");

    expect(router).toBe(mocked.router);

    expect(mocked.router.use).toHaveBeenCalledTimes(1);
    expect(mocked.router.use).toHaveBeenCalledWith(mocked.authenticate);

    expect(mocked.requireRole).toHaveBeenCalledTimes(7);
    expect(mocked.requireRole).toHaveBeenNthCalledWith(1, "client", "manager", "cashier");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(2, "client", "manager", "cashier");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(3, "cashier", "manager");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(4, "client", "manager", "cashier");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(5, "manager");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(6, "manager");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(7, "manager");

    expect(mocked.validate).toHaveBeenCalledTimes(7);
    expect(mocked.validate).toHaveBeenNthCalledWith(1, mocked.createAccountSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(2, mocked.accountListSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(3, mocked.accountNumberParamSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(4, mocked.idParamSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(5, mocked.accountDecisionSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(6, mocked.accountDecisionSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(7, mocked.accountStatusSchema);

    expect(mocked.asyncWrapper).toHaveBeenCalledTimes(7);
  });
});
