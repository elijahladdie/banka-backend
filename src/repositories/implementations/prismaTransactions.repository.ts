import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { TransactionsRepository, TransactionWithRelations } from "../interfaces/transactions.repository";

export class PrismaTransactionsRepository implements TransactionsRepository {
  runTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx: Prisma.TransactionClient) => fn(tx), { isolationLevel: "Serializable" });
  }

  countTransactions(where: object): Promise<number> {
    return prisma.transaction.count({ where });
  }

  listTransactions(params: { where: object; skip: number; take: number }): Promise<TransactionWithRelations[]> {
    return prisma.transaction.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
      include: {
        sourceAccount: { select: { ownerId: true } },
        destinationAccount: { select: { ownerId: true } },
        performedByUser: true
      }
    }).then((transactions) =>
      transactions.map((transaction) => {
        const { confirmationToken: _confirmationToken, ...safeTransaction } = transaction as typeof transaction & {
          confirmationToken?: string | null;
        };
        return safeTransaction as TransactionWithRelations;
      })
    );
  }

  getTransactionById(id: string): Promise<TransactionWithRelations | null> {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        sourceAccount: { select: { ownerId: true } },
        destinationAccount: { select: { ownerId: true } },
        performedByUser: true
      }
    }).then((transaction) => {
      if (!transaction) return null;
      const { confirmationToken: _confirmationToken, ...safeTransaction } = transaction as typeof transaction & {
        confirmationToken?: string | null;
      };
      return safeTransaction as TransactionWithRelations;
    });
  }
}

export const transactionsRepository = new PrismaTransactionsRepository();
