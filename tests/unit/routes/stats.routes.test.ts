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
  overview: { name: "overview" },
  transactionsSeries: { name: "transactionsSeries" },
  accountsSeries: { name: "accountsSeries" },
  usersSeries: { name: "usersSeries" },
  asyncWrapper: vi.fn((handler: unknown) => ({ type: "wrapped", handler }))
}));

vi.mock("express", () => ({
  Router: vi.fn(() => mocked.router)
}));

vi.mock("../../../src/controllers/stats.controller", () => ({
  overview: mocked.overview,
  transactionsSeries: mocked.transactionsSeries,
  accountsSeries: mocked.accountsSeries,
  usersSeries: mocked.usersSeries
}));

vi.mock("../../../src/middleware/auth", () => ({
  authenticate: mocked.authenticate,
  requireRole: mocked.requireRole
}));

vi.mock("../../../src/utils/asyncWrapper", () => ({
  asyncWrapper: mocked.asyncWrapper
}));

describe("routes/stats", () => {
  it("enforces manager-only parent middleware and wires stats endpoints", async () => {
    const { default: router } = await import("../../../src/routes/stats.routes");

    expect(router).toBe(mocked.router);

    expect(mocked.requireRole).toHaveBeenCalledTimes(1);
    expect(mocked.requireRole).toHaveBeenCalledWith("manager");
    expect(mocked.router.use).toHaveBeenCalledTimes(1);
    expect(mocked.router.use).toHaveBeenCalledWith(mocked.authenticate, {
      type: "requireRole",
      roles: ["manager"]
    });

    expect(mocked.asyncWrapper).toHaveBeenCalledTimes(4);
  });
});
