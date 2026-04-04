import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import type { TransactionStatus, TransactionType } from "../types/domain";
import { success, error } from "../utils/response";
import { parsePagination, paginationMeta } from "../utils/pagination";
import { transactionsRepository } from "../repositories/implementations/prismaTransactions.repository";
import { generateReference } from "../utils/reference";
import { notificationService } from "./notification.service";

function toDecimal(value: number) {
  return Number(value.toFixed(2));
}

const deposit = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, "Unauthorized");
    return;
  }

  const { toAccount, amount, description } = req.body;

  try {
    const result = await transactionsRepository.runTransaction(async (tx) => {
      const destination = await tx.bankAccount.findUnique({ where: { id: toAccount } });
      if (!destination) return { error: { code: 404, message: "Destination account not found" } };
      if (destination.status !== "Active") return { error: { code: 400, message: "Account is not Active" } };

      await tx.$executeRaw`SELECT id FROM "BankAccount" WHERE id = ${destination.id} FOR UPDATE`;

      const before = destination.balance;
      const after = before.plus(amount);

      const account = await tx.bankAccount.update({
        where: { id: destination.id },
        data: { balance: after }
      });

      const transaction = await tx.transaction.create({
        data: {
          type: "deposit",
          fromAccount: null,
          toAccount: destination.id,
          performedBy: user.id,
          amount: toDecimal(amount),
          reference: generateReference("D"),
          description: description,
          status: "completed",
          balanceBefore: before,
          balanceAfter: after,
          fee: toDecimal(0),
          currency: "RWF"
        }
      });

      return { account, transaction, ownerId: destination.ownerId, accountNumber: destination.accountNumber };
    });

    if ("error" in result) {
      const err = result as { error: { code: number; message: string } };
      error(res, err.error.code, err.error.message);
      return;
    }

    void notificationService.depositReceived({
      receiverId: result.ownerId,
      senderId: user.id,
      transactionId: result.transaction.id,
      accountId: result.account.id,
      accountNumber: result.accountNumber,
      amount: Number(amount),
      currency: "RWF",
      balanceAfter: Number(result.account.balance)
    });

    success(res, "Deposit completed", result, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deposit failed";
    error(res, 400, message);
  }
};

const withdraw = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, "Unauthorized");
    return;
  }

  const { fromAccount, amount, description } = req.body;

  try {
    const result = await transactionsRepository.runTransaction(async (tx) => {
      const source = await tx.bankAccount.findUnique({ where: { id: fromAccount } });
      if (!source) return { error: { code: 404, message: "Source account not found" } };
      if (source.status !== "Active") return { error: { code: 400, message: "Account is not Active" } };

      await tx.$executeRaw`SELECT id FROM "BankAccount" WHERE id = ${source.id} FOR UPDATE`;

      if (source.balance.lessThan(amount)) {
        return { error: { code: 400, message: "Insufficient funds" } };
      }

      const before = source.balance;
      const after = before.minus(amount);

      const account = await tx.bankAccount.update({
        where: { id: source.id },
        data: { balance: after }
      });

      const transaction = await tx.transaction.create({
        data: {
          type: "withdraw",
          fromAccount: source.id,
          toAccount: null,
          performedBy: user.id,
          amount: toDecimal(amount),
          reference: generateReference("W"),
          description: description,
          status: "completed",
          balanceBefore: before,
          balanceAfter: after,
          fee: toDecimal(0),
          currency: "RWF"
        }
      });

      return { account, transaction, ownerId: source.ownerId, accountNumber: source.accountNumber };
    });

    if ("error" in result) {
      const err = result as { error: { code: number; message: string } };
      error(res, err.error.code, err.error.message);
      return;
    }

    void notificationService.withdrawalProcessed({
      receiverId: result.ownerId,
      senderId: user.id,
      transactionId: result.transaction.id,
      accountId: result.account.id,
      accountNumber: result.accountNumber,
      amount: Number(amount),
      currency: "RWF",
      balanceAfter: Number(result.account.balance)
    });

    success(res, "Withdrawal completed", result, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Withdrawal failed";
    error(res, 400, message);
  }
};

const transfer = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, "Unauthorized");
    return;
  }

  const { fromAccount, toAccount, amount, description } = req.body;

  if (fromAccount === toAccount) {
    error(res, 400, "Source and destination accounts must be different");
    return;
  }

  try {
    const result = await transactionsRepository.runTransaction(async (tx) => {
      const [source, destination] = await Promise.all([
        tx.bankAccount.findUnique({ where: { id: fromAccount } }),
        tx.bankAccount.findUnique({ where: { id: toAccount } })
      ]);

      if (!source || !destination) return { error: { code: 404, message: "Account not found" } };
      if (source.ownerId !== user.id || destination.ownerId !== user.id) {
        return { error: { code: 403, message: "Transfers are only allowed between your own accounts" } };
      }
      if (source.status !== "Active" || destination.status !== "Active") {
        return { error: { code: 400, message: "Both accounts must be Active" } };
      }

      const ids = [source.id, destination.id].sort();
      const join = (Prisma as unknown as { join: (values: string[]) => unknown }).join;
      await tx.$executeRaw`SELECT id FROM "BankAccount" WHERE id IN (${join(ids)}) FOR UPDATE`;

      if (source.balance.lessThan(amount)) {
        return { error: { code: 400, message: "Insufficient funds" } };
      }

      const sourceBefore = source.balance;
      const sourceAfter = sourceBefore.minus(amount);
      const destinationBefore = destination.balance;
      const destinationAfter = destinationBefore.plus(amount);

      const [updatedSource, updatedDestination, transaction] = await Promise.all([
        tx.bankAccount.update({ where: { id: source.id }, data: { balance: sourceAfter } }),
        tx.bankAccount.update({ where: { id: destination.id }, data: { balance: destinationAfter } }),
        tx.transaction.create({
          data: {
            type: "transfer",
            fromAccount: source.id,
            toAccount: destination.id,
            performedBy: user.id,
            amount: toDecimal(amount),
            reference: generateReference("T"),
            description: description,
            status: "completed",
            balanceBefore: sourceBefore,
            balanceAfter: sourceAfter,
            fee: toDecimal(0),
            currency: "RWF"
          }
        })
      ]);

      return {
        source: updatedSource,
        destination: updatedDestination,
        transaction,
        transferAmount: amount
      };
    });

    if ("error" in result) {
      const err = result as { error: { code: number; message: string } };
      error(res, err.error.code, err.error.message);
      return;
    }

    void notificationService.transferSent({
      receiverId: user.id,
      transactionId: result.transaction.id,
      fromAccountId: result.source.id,
      fromAccountNumber: result.source.accountNumber,
      toAccountId: result.destination.id,
      toAccountNumber: result.destination.accountNumber,
      amount: Number(amount),
      currency: "RWF",
      reference: result.transaction.reference,
      balanceAfter: Number(result.source.balance)
    });

    success(res, "Transfer completed", result, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    error(res, 400, message);
  }
};

const listTransactions = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, "Unauthorized");
    return;
  }

  try {
    const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
    const query = req.query as {
      type?: "deposit" | "withdraw" | "transfer";
      status?: "completed" | "failed" | "pending" | "reversed";
      fromDate?: string;
      toDate?: string;
    };

    const isManager = user.userRoles.some((item: { role: { slug: string } }) => item.role.slug === "manager");
    const isCashier = user.userRoles.some((item: { role: { slug: string } }) => item.role.slug === "cashier");

    const where = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.fromDate || query.toDate
        ? {
            createdAt: {
              ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
              ...(query.toDate ? { lte: new Date(query.toDate) } : {})
            }
          }
        : {}),
      ...(!isManager
        ? isCashier
          ? { performedBy: user.id }
          : {
              OR: [
                { sourceAccount: { ownerId: user.id } },
                { destinationAccount: { ownerId: user.id } }
              ]
            }
        : {})
    };

    const [total, items] = await Promise.all([
      transactionsRepository.countTransactions(where),
      transactionsRepository.listTransactions({ where, skip, take: limit })
    ]);

    success(res, "Transactions fetched", items, paginationMeta(page, limit, total));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch transactions";
    error(res, 400, message);
  }
};

const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, "Unauthorized");
    return;
  }

  try {
    const transactionId = String(req.params.id);
    const transaction = await transactionsRepository.getTransactionById(transactionId);
    if (!transaction) {
      error(res, 404, "Transaction not found");
      return;
    }

    const isManager = user.userRoles.some((item: { role: { slug: string } }) => item.role.slug === "manager");
    const isCashier = user.userRoles.some((item: { role: { slug: string } }) => item.role.slug === "cashier");
    const canViewAsClient = transaction.sourceAccount?.ownerId === user.id || transaction.destinationAccount?.ownerId === user.id;

    if (!isManager && !canViewAsClient && !(isCashier && transaction.performedBy === user.id)) {
      error(res, 403, "Forbidden");
      return;
    }

    success(res, "Transaction fetched", transaction);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch transaction";
    error(res, 400, message);
  }
};

export const transactionsService = {
  deposit,
  withdraw,
  transfer,
  listTransactions,
  getTransactionById
};
