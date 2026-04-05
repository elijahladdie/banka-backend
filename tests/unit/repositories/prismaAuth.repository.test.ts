import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn().mockResolvedValue(undefined),
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    role: {
      findUnique: vi.fn()
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock("../../../src/config/prisma", () => ({ prisma: mocked.prisma }));

describe("prisma auth repository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("findClientRole", () => {
    it("should query role by client slug", async () => {
      const { authRepository } =
        await import("../../../src/repositories/implementations/prismaAuth.repository");
      await authRepository.findClientRole();
      expect(mocked.prisma.role.findUnique).toHaveBeenCalledWith({ where: { slug: "client" } });
    });
  });

  describe("updatePasswordAndConsumeResetToken", () => {
    it("should execute prisma transaction", async () => {
      const { authRepository } =
        await import("../../../src/repositories/implementations/prismaAuth.repository");
      await authRepository.updatePasswordAndConsumeResetToken({
        userId: "u1",
        password: "h",
        tokenId: "t1"
      });
      expect(mocked.prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("findUserByEmail", () => {
    it("should bubble prisma errors", async () => {
      mocked.prisma.user.findUnique.mockRejectedValueOnce(new Error("db down"));
      const { authRepository } =
        await import("../../../src/repositories/implementations/prismaAuth.repository");
      await expect(authRepository.findUserByEmail("x")).rejects.toThrow("db down");
    });
  });
});
