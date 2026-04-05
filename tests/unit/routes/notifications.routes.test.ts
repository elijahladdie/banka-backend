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
  getMyNotifications: { name: "getMyNotifications" },
  getUnreadCount: { name: "getUnreadCount" },
  markAllAsRead: { name: "markAllAsRead" },
  markOneAsRead: { name: "markOneAsRead" },
  markOneAsUnread: { name: "markOneAsUnread" },
  deleteNotification: { name: "deleteNotification" },
  asyncWrapper: vi.fn((handler: unknown) => ({ type: "wrapped", handler }))
}));

vi.mock("express", () => ({
  Router: vi.fn(() => mocked.router)
}));

vi.mock("../../../src/middleware/auth", () => ({
  authenticate: mocked.authenticate
}));

vi.mock("../../../src/utils/asyncWrapper", () => ({
  asyncWrapper: mocked.asyncWrapper
}));

vi.mock("../../../src/controllers/notifications.controller", () => ({
  notificationsController: {
    getMyNotifications: mocked.getMyNotifications,
    getUnreadCount: mocked.getUnreadCount,
    markAllAsRead: mocked.markAllAsRead,
    markOneAsRead: mocked.markOneAsRead,
    markOneAsUnread: mocked.markOneAsUnread,
    deleteNotification: mocked.deleteNotification
  }
}));

describe("routes/notifications", () => {
  it("applies auth to the router and wires all notification endpoints", async () => {
    const { default: router } = await import("../../../src/routes/notifications.routes");

    expect(router).toBe(mocked.router);

    expect(mocked.router.use).toHaveBeenCalledTimes(1);
    expect(mocked.router.use).toHaveBeenCalledWith(mocked.authenticate);

    expect(mocked.asyncWrapper).toHaveBeenCalledTimes(6);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(1, mocked.getMyNotifications);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(2, mocked.getUnreadCount);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(3, mocked.markAllAsRead);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(4, mocked.markOneAsRead);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(5, mocked.markOneAsUnread);
    expect(mocked.asyncWrapper).toHaveBeenNthCalledWith(6, mocked.deleteNotification);
  });
});
