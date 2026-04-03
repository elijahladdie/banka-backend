import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../config/prisma";
import type { StatsRepository } from "../interfaces/stats.repository";

export class PrismaStatsRepository implements StatsRepository {
  countActiveUsers(): Promise<number> {
    return prisma.user.count({ where: { status: "active" } });
  }

  countPendingUsers(): Promise<number> {
    return prisma.user.count({ where: { status: "pending_approval" } });
  }

  countAccounts(): Promise<number> {
    return prisma.bankAccount.count();
  }

  aggregateTransactions(): Promise<{ _sum: { amount: Decimal | null }; _count: { id: number } }> {
    return prisma.transaction.aggregate({ _sum: { amount: true }, _count: { id: true } });
  }

  groupTransactions(where: object): Promise<Array<{ type: string; _sum: { amount: Decimal | null }; _count: { id: number } }>> {
    return prisma.transaction.groupBy({
      by: ["type"],
      where: where as never,
      _sum: { amount: true },
      _count: { id: true }
    }) as unknown as Promise<Array<{ type: string; _sum: { amount: Decimal | null }; _count: { id: number } }>>;
  }

  groupAccounts(where: object): Promise<Array<{ type: string; status: string; _count: { id: number } }>> {
    return prisma.bankAccount.groupBy({
      by: ["type", "status"],
      where: where as never,
      _count: { id: true }
    }) as unknown as Promise<Array<{ type: string; status: string; _count: { id: number } }>>;
  }

  async groupUsersByRole(createdAt?: object): Promise<Array<{ role: string; count: number }>> {
    const rows = await prisma.userRole.groupBy({
      by: ["roleId"],
      where: {
        user: { ...(createdAt ?? {}) }
      },
      _count: { id: true }
    });

    const roleIds = rows.map((row: { roleId: string }) => row.roleId);
    const roles = await prisma.role.findMany({ where: { id: { in: roleIds } } });

    return rows.map((row: { roleId: string; _count: { id: number } }) => ({
      role: roles.find((role: { id: string; slug: string }) => role.id === row.roleId)?.slug ?? row.roleId,
      count: row._count.id
    }));
  }
}

export const statsRepository = new PrismaStatsRepository();
