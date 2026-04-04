import type { Decimal } from "@prisma/client/runtime/library";

export interface StatsRepository {
  countActiveUsers(): Promise<number>;
  countPendingUsers(): Promise<number>;
  countAccounts(): Promise<number>;
  aggregateTransactions(): Promise<{ _sum: { amount: Decimal | null }; _count: { id: number } }>;
  groupTransactions(where: object): Promise<Array<{ type: string; _sum: { amount: Decimal | null }; _count: { id: number } }>>;
  groupAccounts(where: object): Promise<Array<{ type: string; status: string; _count: { id: number } }>>;
  groupUsersByRole(createdAt?: object): Promise<Array<{ role: string; count: number }>>;
}
