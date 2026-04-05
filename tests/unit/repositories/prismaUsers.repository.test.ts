import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    role: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock("../../../src/config/prisma", () => ({ prisma: mocked.prisma }));

describe("prisma users repository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("listUsers", () => {
    it("should call prisma findMany", async () => {
      const { usersRepository } =
        await import("../../../src/repositories/implementations/prismaUsers.repository");
      await usersRepository.listUsers({ where: {}, skip: 0, take: 10 });
      expect(mocked.prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe("updateUserStatus", () => {
    it("should update status by id", async () => {
      const { usersRepository } =
        await import("../../../src/repositories/implementations/prismaUsers.repository");
      await usersRepository.updateUserStatus("u1", "active" as any);
      expect(mocked.prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { status: "active" }
      });
    });
  });

  describe("countUsers", () => {
    it("should bubble prisma errors", async () => {
      mocked.prisma.user.count.mockRejectedValueOnce(new Error("count failed"));
      const { usersRepository } =
        await import("../../../src/repositories/implementations/prismaUsers.repository");
      await expect(usersRepository.countUsers({})).rejects.toThrow("count failed");
    });
  });
});
