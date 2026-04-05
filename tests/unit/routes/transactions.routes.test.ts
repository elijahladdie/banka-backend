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
  deposit: { name: "deposit" },
  withdraw: { name: "withdraw" },
  confirmWithdrawal: { name: "confirmWithdrawal" },
  transfer: { name: "transfer" },
  listTransactions: { name: "listTransactions" },
  getTransactionById: { name: "getTransactionById" },
  depositSchema: { name: "depositSchema" },
  withdrawSchema: { name: "withdrawSchema" },
  confirmWithdrawalSchema: { name: "confirmWithdrawalSchema" },
  transferSchema: { name: "transferSchema" },
  transactionListSchema: { name: "transactionListSchema" },
  idParamSchema: { name: "idParamSchema" },
  validate: vi.fn((schema: unknown) => ({ type: "validate", schema })),
  asyncWrapper: vi.fn((handler: unknown) => ({ type: "wrapped", handler }))
}));

vi.mock("express", () => ({
  Router: vi.fn(() => mocked.router)
}));

vi.mock("../../../src/controllers/transactions.controller", () => ({
  deposit: mocked.deposit,
  withdraw: mocked.withdraw,
  confirmWithdrawal: mocked.confirmWithdrawal,
  transfer: mocked.transfer,
  listTransactions: mocked.listTransactions,
  getTransactionById: mocked.getTransactionById
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

vi.mock("../../../src/validators/transaction.validator", () => ({
  depositSchema: mocked.depositSchema,
  withdrawSchema: mocked.withdrawSchema,
  confirmWithdrawalSchema: mocked.confirmWithdrawalSchema,
  transferSchema: mocked.transferSchema,
  transactionListSchema: mocked.transactionListSchema
}));

vi.mock("../../../src/validators/user.validator", () => ({
  idParamSchema: mocked.idParamSchema
}));

describe("routes/transactions", () => {
  it("applies auth globally and wires all transaction route roles and validators", async () => {
    const { default: router } = await import("../../../src/routes/transactions.routes");

    expect(router).toBe(mocked.router);

    expect(mocked.router.use).toHaveBeenCalledTimes(1);
    expect(mocked.router.use).toHaveBeenCalledWith(mocked.authenticate);

    expect(mocked.requireRole).toHaveBeenCalledTimes(6);
    expect(mocked.requireRole).toHaveBeenNthCalledWith(1, "cashier", "manager");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(2, "cashier", "manager");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(3, "client", "cashier", "manager");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(4, "client");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(5, "client", "cashier", "manager");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(6, "client", "cashier", "manager");

    expect(mocked.validate).toHaveBeenCalledTimes(6);
    expect(mocked.validate).toHaveBeenNthCalledWith(1, mocked.depositSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(2, mocked.withdrawSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(3, mocked.confirmWithdrawalSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(4, mocked.transferSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(5, mocked.transactionListSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(6, mocked.idParamSchema);

    expect(mocked.asyncWrapper).toHaveBeenCalledTimes(6);
  });
});
