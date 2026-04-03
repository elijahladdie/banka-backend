import type { Prisma } from "@prisma/client";

export type TransactionWithRelations = {
  id: string;
  performedBy: string;
  sourceAccount: { ownerId: string } | null;
  destinationAccount: { ownerId: string } | null;
  performedByUser: any;
};

export interface TransactionsRepository {
  runTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
  countTransactions(where: object): Promise<number>;
  listTransactions(params: { where: object; skip: number; take: number }): Promise<TransactionWithRelations[]>;
  getTransactionById(id: string): Promise<TransactionWithRelations | null>;
}
