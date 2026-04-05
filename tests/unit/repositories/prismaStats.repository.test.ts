import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  prisma: {
    user: { count: vi.fn() },
    bankAccount: { count: vi.fn(), groupBy: vi.fn() },
    transaction: { aggregate: vi.fn(), groupBy: vi.fn() },
    userRole: { groupBy: vi.fn() },
    role: { findMany: vi.fn() }
  }
}));

vi.mock("../../../src/config/prisma", () => ({ prisma: mocked.prisma }));

describe("prisma stats repository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("groupUsersByRole", () => {
    it("should map role ids to role slugs", async () => {
      mocked.prisma.userRole.groupBy.mockResolvedValue([{ roleId: "r1", _count: { id: 3 } }]);
      mocked.prisma.role.findMany.mockResolvedValue([{ id: "r1", slug: "manager" }]);
      const { statsRepository } =
        await import("../../../src/repositories/implementations/prismaStats.repository");
      const roles = await statsRepository.groupUsersByRole();
      expect(roles).toEqual([{ role: "manager", count: 3 }]);
    });

    it("should fall back to role id when role lookup misses", async () => {
      mocked.prisma.userRole.groupBy.mockResolvedValue([{ roleId: "rX", _count: { id: 1 } }]);
      mocked.prisma.role.findMany.mockResolvedValue([]);
      const { statsRepository } =
        await import("../../../src/repositories/implementations/prismaStats.repository");
      const roles = await statsRepository.groupUsersByRole();
      expect(roles).toEqual([{ role: "rX", count: 1 }]);
    });
  });
});
