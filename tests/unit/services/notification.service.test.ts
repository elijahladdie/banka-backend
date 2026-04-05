import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  repo: {
    findPreferredLanguageByUserId: vi.fn(),
    create: vi.fn()
  },
  getUserLanguage: vi.fn(),
  translateNotification: vi.fn(),
  consoleError: vi.fn()
}));

vi.mock("../../../src/repositories/implementations/prismaNotifications.repository", () => ({
  notificationsRepository: mocked.repo
}));
vi.mock("../../../src/utils/notification.i18n", () => ({
  getUserLanguage: mocked.getUserLanguage,
  translateNotification: mocked.translateNotification
}));

describe("notification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(mocked.consoleError);
  });

  describe("create", () => {
    it("should create translated notification payload", async () => {
      mocked.repo.findPreferredLanguageByUserId.mockResolvedValue("fr");
      mocked.getUserLanguage.mockReturnValue("fr");
      mocked.translateNotification.mockReturnValue({ title: "T", message: "M" });

      const { notificationService } = await import("../../../src/services/notification.service");
      await notificationService.create({ userId: "u1", type: "WELCOME", metadata: { a: 1 } });

      expect(mocked.repo.create).toHaveBeenCalled();
    });

    it("should rethrow repository errors and log them", async () => {
      mocked.repo.findPreferredLanguageByUserId.mockResolvedValue("en");
      mocked.getUserLanguage.mockReturnValue("en");
      mocked.translateNotification.mockReturnValue({ title: "T", message: "M" });
      mocked.repo.create.mockRejectedValueOnce(new Error("insert failed"));

      const { notificationService } = await import("../../../src/services/notification.service");
      await expect(
        notificationService.create({ userId: "u1", type: "WELCOME", metadata: {} })
      ).rejects.toThrow("insert failed");
      expect(mocked.consoleError).toHaveBeenCalled();
    });
  });

  describe("transferSent", () => {
    it("should create transfer sent notification with SENT direction", async () => {
      mocked.repo.findPreferredLanguageByUserId.mockResolvedValue("en");
      mocked.getUserLanguage.mockReturnValue("en");
      mocked.translateNotification.mockReturnValue({ title: "Transfer Sent", message: "ok" });
      const { notificationService } = await import("../../../src/services/notification.service");

      await notificationService.transferSent({
        userId: "u1",
        transactionId: "t1",
        fromAccountId: "a1",
        fromAccountNumber: "ACC1",
        toAccountId: "a2",
        toAccountNumber: "ACC2",
        amount: 100,
        currency: "RWF",
        reference: "REF1",
        balanceAfter: 900
      });

      expect(mocked.repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: "SENT",
          type: "TRANSFER_SENT"
        })
      );
    });
  });
});
