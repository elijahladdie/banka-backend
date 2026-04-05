import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/env", () => ({
  env: {
    frontendUrl: "http://localhost:3000"
  }
}));

vi.mock("../../config/logger", () => {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn()
  };

  logger.child.mockReturnValue(logger);

  return { logger };
});

vi.mock("pino-http", () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next()
}));

vi.mock("swagger-ui-express", () => ({
  __esModule: true,
  default: {
    serve: (_req: unknown, _res: unknown, next: () => void) => next(),
    setup: () => (_req: unknown, _res: unknown, next: () => void) => next()
  }
}));

vi.mock("../../middleware/requestContext", () => ({
  requestContext: (_req: unknown, _res: unknown, next: () => void) => next()
}));

vi.mock("../../middleware/auth", () => ({
  authenticate: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  signAccessToken: vi.fn()
}));

vi.mock("../../middleware/validate", () => ({
  validate: () => (_req: unknown, _res: unknown, next: () => void) => next()
}));

function createHandler(status: number, route: string) {
  return async (
    _req: unknown,
    res: { status: (value: number) => { json: (body: unknown) => void } }
  ) => {
    res.status(status).json({ ok: true, route });
  };
}

vi.mock("../../controllers/auth.controller", () => ({
  register: createHandler(201, "auth.register"),
  login: createHandler(200, "auth.login"),
  logout: createHandler(200, "auth.logout"),
  forgotPassword: createHandler(200, "auth.forgotPassword"),
  resetPassword: createHandler(200, "auth.resetPassword"),
  changePassword: createHandler(200, "auth.changePassword"),
  me: createHandler(200, "auth.me")
}));

vi.mock("../../controllers/users.controller", () => ({
  listUsers: createHandler(200, "users.listUsers"),
  createUser: createHandler(201, "users.createUser"),
  getUserById: createHandler(200, "users.getUserById"),
  updateUser: createHandler(200, "users.updateUser"),
  updateUserStatus: createHandler(200, "users.updateUserStatus"),
  softDeleteUser: createHandler(200, "users.softDeleteUser")
}));

vi.mock("../../controllers/accounts.controller", () => ({
  createAccount: createHandler(201, "accounts.createAccount"),
  listAccounts: createHandler(200, "accounts.listAccounts"),
  getAccountById: createHandler(200, "accounts.getAccountById"),
  getAccountByNumber: createHandler(200, "accounts.getAccountByNumber"),
  approveAccount: createHandler(200, "accounts.approveAccount"),
  rejectAccount: createHandler(200, "accounts.rejectAccount"),
  updateAccountStatus: createHandler(200, "accounts.updateAccountStatus")
}));

vi.mock("../../controllers/transactions.controller", () => ({
  deposit: createHandler(201, "transactions.deposit"),
  withdraw: createHandler(201, "transactions.withdraw"),
  confirmWithdrawal: createHandler(200, "transactions.confirmWithdrawal"),
  transfer: createHandler(201, "transactions.transfer"),
  listTransactions: createHandler(200, "transactions.listTransactions"),
  getTransactionById: createHandler(200, "transactions.getTransactionById")
}));

vi.mock("../../controllers/stats.controller", () => ({
  overview: createHandler(200, "stats.overview"),
  transactionsSeries: createHandler(200, "stats.transactionsSeries"),
  accountsSeries: createHandler(200, "stats.accountsSeries"),
  usersSeries: createHandler(200, "stats.usersSeries")
}));

vi.mock("../../controllers/notifications.controller", () => ({
  notificationsController: {
    getMyNotifications: createHandler(200, "notifications.getMyNotifications"),
    getUnreadCount: createHandler(200, "notifications.getUnreadCount"),
    markAllAsRead: createHandler(200, "notifications.markAllAsRead"),
    markOneAsRead: createHandler(200, "notifications.markOneAsRead"),
    markOneAsUnread: createHandler(200, "notifications.markOneAsUnread"),
    deleteNotification: createHandler(200, "notifications.deleteNotification")
  }
}));

import { app } from "../../app";

type HttpMethod = "get" | "post" | "patch" | "delete";

type RouteCase = {
  name: string;
  method: HttpMethod;
  path: string;
  status: number;
  route: string;
};

const routeCases: RouteCase[] = [
  {
    name: "register",
    method: "post",
    path: "/api/auth/register",
    status: 201,
    route: "auth.register"
  },
  { name: "login", method: "post", path: "/api/auth/login", status: 200, route: "auth.login" },
  { name: "logout", method: "post", path: "/api/auth/logout", status: 200, route: "auth.logout" },
  {
    name: "forgot password",
    method: "post",
    path: "/api/auth/forgot-password",
    status: 200,
    route: "auth.forgotPassword"
  },
  {
    name: "reset password",
    method: "post",
    path: "/api/auth/reset-password",
    status: 200,
    route: "auth.resetPassword"
  },
  {
    name: "change password",
    method: "post",
    path: "/api/auth/change-password",
    status: 200,
    route: "auth.changePassword"
  },
  { name: "current user", method: "get", path: "/api/auth/me", status: 200, route: "auth.me" },
  { name: "list users", method: "get", path: "/api/users", status: 200, route: "users.listUsers" },
  {
    name: "create user",
    method: "post",
    path: "/api/users",
    status: 201,
    route: "users.createUser"
  },
  {
    name: "get user by id",
    method: "get",
    path: "/api/users/123",
    status: 200,
    route: "users.getUserById"
  },
  {
    name: "update user",
    method: "patch",
    path: "/api/users/123",
    status: 200,
    route: "users.updateUser"
  },
  {
    name: "update user status",
    method: "patch",
    path: "/api/users/123/status",
    status: 200,
    route: "users.updateUserStatus"
  },
  {
    name: "soft delete user",
    method: "delete",
    path: "/api/users/123",
    status: 200,
    route: "users.softDeleteUser"
  },
  {
    name: "create account",
    method: "post",
    path: "/api/accounts",
    status: 201,
    route: "accounts.createAccount"
  },
  {
    name: "list accounts",
    method: "get",
    path: "/api/accounts",
    status: 200,
    route: "accounts.listAccounts"
  },
  {
    name: "get account by number",
    method: "get",
    path: "/api/accounts/by-number/ACC123",
    status: 200,
    route: "accounts.getAccountByNumber"
  },
  {
    name: "get account by id",
    method: "get",
    path: "/api/accounts/123",
    status: 200,
    route: "accounts.getAccountById"
  },
  {
    name: "approve account",
    method: "patch",
    path: "/api/accounts/123/approve",
    status: 200,
    route: "accounts.approveAccount"
  },
  {
    name: "reject account",
    method: "patch",
    path: "/api/accounts/123/reject",
    status: 200,
    route: "accounts.rejectAccount"
  },
  {
    name: "update account status",
    method: "patch",
    path: "/api/accounts/123/status",
    status: 200,
    route: "accounts.updateAccountStatus"
  },
  {
    name: "deposit",
    method: "post",
    path: "/api/transactions/deposit",
    status: 201,
    route: "transactions.deposit"
  },
  {
    name: "withdraw",
    method: "post",
    path: "/api/transactions/withdraw",
    status: 201,
    route: "transactions.withdraw"
  },
  {
    name: "confirm withdrawal",
    method: "post",
    path: "/api/transactions/confirm-withdrawal",
    status: 200,
    route: "transactions.confirmWithdrawal"
  },
  {
    name: "transfer",
    method: "post",
    path: "/api/transactions/transfer",
    status: 201,
    route: "transactions.transfer"
  },
  {
    name: "list transactions",
    method: "get",
    path: "/api/transactions",
    status: 200,
    route: "transactions.listTransactions"
  },
  {
    name: "get transaction by id",
    method: "get",
    path: "/api/transactions/123",
    status: 200,
    route: "transactions.getTransactionById"
  },
  {
    name: "stats overview",
    method: "get",
    path: "/api/stats/overview",
    status: 200,
    route: "stats.overview"
  },
  {
    name: "stats transactions series",
    method: "get",
    path: "/api/stats/transactions",
    status: 200,
    route: "stats.transactionsSeries"
  },
  {
    name: "stats accounts series",
    method: "get",
    path: "/api/stats/accounts",
    status: 200,
    route: "stats.accountsSeries"
  },
  {
    name: "stats users series",
    method: "get",
    path: "/api/stats/users",
    status: 200,
    route: "stats.usersSeries"
  },
  {
    name: "list notifications",
    method: "get",
    path: "/api/notifications",
    status: 200,
    route: "notifications.getMyNotifications"
  },
  {
    name: "unread notification count",
    method: "get",
    path: "/api/notifications/unread-count",
    status: 200,
    route: "notifications.getUnreadCount"
  },
  {
    name: "mark all notifications read",
    method: "patch",
    path: "/api/notifications/read-all",
    status: 200,
    route: "notifications.markAllAsRead"
  },
  {
    name: "mark notification read",
    method: "patch",
    path: "/api/notifications/123/read",
    status: 200,
    route: "notifications.markOneAsRead"
  },
  {
    name: "mark notification unread",
    method: "patch",
    path: "/api/notifications/123/unread",
    status: 200,
    route: "notifications.markOneAsUnread"
  },
  {
    name: "delete notification",
    method: "delete",
    path: "/api/notifications/123",
    status: 200,
    route: "notifications.deleteNotification"
  }
];

async function callRoute(method: HttpMethod, path: string) {
  switch (method) {
    case "get":
      return request(app).get(path);
    case "post":
      return request(app).post(path);
    case "patch":
      return request(app).patch(path);
    case "delete":
      return request(app).delete(path);
  }
}

describe("backend route smoke tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /health returns the service status payload", async () => {
    const response = await callRoute("get", "/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  for (const routeCase of routeCases) {
    it(`${routeCase.method.toUpperCase()} ${routeCase.path} -> ${routeCase.route}`, async () => {
      const response = await callRoute(routeCase.method, routeCase.path);

      expect(response.status).toBe(routeCase.status);
      expect(response.body).toEqual(
        expect.objectContaining({
          ok: true,
          route: routeCase.route
        })
      );
    });
  }
});
