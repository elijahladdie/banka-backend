import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  router: {
    use: vi.fn()
  },
  authRoutes: { name: "authRoutes" },
  usersRoutes: { name: "usersRoutes" },
  accountsRoutes: { name: "accountsRoutes" },
  transactionsRoutes: { name: "transactionsRoutes" },
  statsRoutes: { name: "statsRoutes" },
  notificationsRoutes: { name: "notificationsRoutes" }
}));

vi.mock("express", () => ({
  Router: vi.fn(() => mocked.router)
}));

vi.mock("../../../src/routes/auth.routes", () => ({
  __esModule: true,
  default: mocked.authRoutes
}));

vi.mock("../../../src/routes/users.routes", () => ({
  __esModule: true,
  default: mocked.usersRoutes
}));

vi.mock("../../../src/routes/accounts.routes", () => ({
  __esModule: true,
  default: mocked.accountsRoutes
}));

vi.mock("../../../src/routes/transactions.routes", () => ({
  __esModule: true,
  default: mocked.transactionsRoutes
}));

vi.mock("../../../src/routes/stats.routes", () => ({
  __esModule: true,
  default: mocked.statsRoutes
}));

vi.mock("../../../src/routes/notifications.routes", () => ({
  __esModule: true,
  default: mocked.notificationsRoutes
}));

describe("routes/index", () => {
  it("registers every child router on the expected parent path", async () => {
    const { default: router } = await import("../../../src/routes/index");

    expect(router).toBe(mocked.router);
    expect(mocked.router.use).toHaveBeenCalledTimes(6);
    expect(mocked.router.use).toHaveBeenNthCalledWith(1, "/auth", mocked.authRoutes);
    expect(mocked.router.use).toHaveBeenNthCalledWith(2, "/users", mocked.usersRoutes);
    expect(mocked.router.use).toHaveBeenNthCalledWith(3, "/accounts", mocked.accountsRoutes);
    expect(mocked.router.use).toHaveBeenNthCalledWith(
      4,
      "/transactions",
      mocked.transactionsRoutes
    );
    expect(mocked.router.use).toHaveBeenNthCalledWith(5, "/stats", mocked.statsRoutes);
    expect(mocked.router.use).toHaveBeenNthCalledWith(
      6,
      "/notifications",
      mocked.notificationsRoutes
    );
  });
});
