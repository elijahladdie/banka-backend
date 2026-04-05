import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn() },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn()
    }
  }
}));

vi.mock("../../../src/config/prisma", () => ({ prisma: mocked.prisma }));

describe("prisma notifications repository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("listNotifications", () => {
    it("should return paginated list payload", async () => {
      mocked.prisma.notification.findMany.mockResolvedValue([{ id: "n1" }]);
      mocked.prisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);
      const { notificationsRepository } =
        await import("../../../src/repositories/implementations/prismaNotifications.repository");
      const listed = await notificationsRepository.listNotifications({
        userId: "u1",
        page: 1,
        limit: 10
      });
      expect(listed.total).toBe(1);
    });
  });

  describe("markAllAsRead", () => {
    it("should return updated records count", async () => {
      mocked.prisma.notification.updateMany.mockResolvedValue({ count: 2 });
      const { notificationsRepository } =
        await import("../../../src/repositories/implementations/prismaNotifications.repository");
      const updated = await notificationsRepository.markAllAsRead("u1");
      expect(updated).toBe(2);
    });
  });

  describe("findPreferredLanguageByUserId", () => {
    it("should return null when user is not found", async () => {
      mocked.prisma.user.findUnique.mockResolvedValueOnce(null);
      const { notificationsRepository } =
        await import("../../../src/repositories/implementations/prismaNotifications.repository");
      await expect(
        notificationsRepository.findPreferredLanguageByUserId("missing")
      ).resolves.toBeNull();
    });
  });
});
