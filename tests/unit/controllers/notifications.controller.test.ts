import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  repo: {
    listNotifications: vi.fn(),
    countUnread: vi.fn(),
    findById: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteById: vi.fn()
  },
  success: vi.fn(),
  error: vi.fn()
}));

vi.mock("../../../src/repositories/implementations/prismaNotifications.repository", () => ({
  notificationsRepository: mocked.repo
}));

vi.mock("../../../src/utils/response", () => ({
  success: mocked.success,
  error: mocked.error
}));

describe("notifications controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUnreadCount", () => {
    it("should return 401 when user is missing", async () => {
      const { notificationsController } =
        await import("../../../src/controllers/notifications.controller");
      await notificationsController.getUnreadCount({ user: undefined } as any, {} as any);
      expect(mocked.error).toHaveBeenCalledWith({}, 401, "Unauthorized");
    });
  });

  describe("getMyNotifications", () => {
    it("should return paginated notifications for authenticated user", async () => {
      mocked.repo.listNotifications.mockResolvedValue({
        notifications: [{ id: "n1" }],
        total: 12,
        unreadCount: 3
      });
      const { notificationsController } =
        await import("../../../src/controllers/notifications.controller");

      await notificationsController.getMyNotifications(
        { user: { id: "u1" }, query: { page: "2", limit: "5", unreadOnly: "true" } } as any,
        {} as any
      );

      expect(mocked.repo.listNotifications).toHaveBeenCalledWith({
        userId: "u1",
        page: 2,
        limit: 5,
        unreadOnly: true
      });
      expect(mocked.success).toHaveBeenCalled();
    });
  });

  describe("markOneAsRead", () => {
    it("should return 403 when marking another user's notification", async () => {
      mocked.repo.findById.mockResolvedValue({ id: "n1", userId: "u2", isRead: false });
      const { notificationsController } =
        await import("../../../src/controllers/notifications.controller");

      await notificationsController.markOneAsRead(
        { user: { id: "u1" }, params: { id: "n1" } } as any,
        {} as any
      );

      expect(mocked.error).toHaveBeenCalledWith({}, 403, "Access denied");
    });
  });
});
