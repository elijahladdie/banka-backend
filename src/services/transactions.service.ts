import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import type { TransactionStatus, TransactionType } from "../types/domain";
import { success, error } from "../utils/response";
import { parsePagination, paginationMeta } from "../utils/pagination";
import { transactionsRepository } from "../repositories/implementations/prismaTransactions.repository";
import { generateReference } from "../utils/reference";
import { notificationService } from "./notification.service";
import { t } from "../i18n";

function toDecimal(value: number) {
  return Number(value.toFixed(2));
}

const deposit = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const { toAccount, amount, description } = req.body;

  try {
    const result = await transactionsRepository.runTransaction(async (tx) => {
      const destination = await tx.bankAccount.findUnique({ where: { id: toAccount } });
      if (!destination) return { error: { code: 404, message: t(req, "transactions.destinationAccountNotFound") } };
      if (destination.status !== "Active") return { error: { code: 400, message: t(req, "transactions.accountNotActive") } };

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
      userId: result.ownerId,
      transactionId: result.transaction.id,
      accountId: result.account.id,
      accountNumber: result.accountNumber,
      amount: Number(amount),
      currency: "RWF",
      balanceAfter: Number(result.account.balance)
    });

    success(res, t(req, "transactions.depositCompleted"), result, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : t(req, "transactions.depositFailed");
    error(res, 400, message);
  }
};

const withdraw = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const { fromAccount, amount, description } = req.body;

  try {
    const token = Math.floor(1000 + Math.random() * 9000).toString();
    const result = await transactionsRepository.runTransaction(async (tx) => {
      const source = await tx.bankAccount.findUnique({ where: { id: fromAccount } });
      if (!source) return { error: { code: 404, message: t(req, "transactions.sourceAccountNotFound") } };
      if (source.status !== "Active") return { error: { code: 400, message: t(req, "transactions.accountNotActive") } };

      await tx.$executeRaw`SELECT id FROM "BankAccount" WHERE id = ${source.id} FOR UPDATE`;

      if (source.balance.lessThan(amount)) {
        return { error: { code: 400, message: t(req, "transactions.insufficientFunds") } };
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
          status: "pending",
          confirmationToken: token,
          balanceBefore: before,
          balanceAfter: after,
          fee: toDecimal(0),
          currency: "RWF"
        }
      });

      return { account, transaction, ownerId: source.ownerId, accountNumber: source.accountNumber, token };
    });

    if ("error" in result) {
      const err = result as { error: { code: number; message: string } };
      error(res, err.error.code, err.error.message);
      return;
    }
    void notificationService.sendWithdrawalCode({
      userId: result.ownerId,
      transactionId: result.transaction.id,
      accountId: result.account.id,
      accountNumber: result.accountNumber,
      amount: Number(amount),
      currency: "RWF",
      code: result.token
    });

    const { token: _token, ...safeResult } = result;
    success(res, t(req, "transactions.withdrawalSubmitted"), {
      ...safeResult,
      transaction: { ...result.transaction, confirmationToken: null }
    }, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : t(req, "transactions.withdrawalFailed");
    error(res, 400, message);
  }
};

const confirmWithdrawal = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const { transactionId, confirmationCode } = req.body;

  try {
    const result = await transactionsRepository.runTransaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          sourceAccount: { select: { ownerId: true, accountNumber: true } },
          performedByUser: true
        }
      });

      if (!transaction) return { error: { code: 404, message: t(req, "transactions.transactionNotFound") } };
      if (transaction.type !== "withdraw") return { error: { code: 400, message: t(req, "transactions.transactionNotWithdrawal") } };
      if (transaction.status !== "pending") return { error: { code: 400, message: t(req, "transactions.transactionAlreadyProcessed") } };
      if (transaction.confirmationToken !== confirmationCode) return { error: { code: 400, message: t(req, "transactions.invalidConfirmationCode") } };

      const isAccountOwner = transaction.sourceAccount?.ownerId === user.id;
      if (!isAccountOwner) {
        return { error: { code: 403, message: t(req, "transactions.onlyOwnerCanConfirmWithdrawal") } };
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "completed",
          confirmationToken: null
        }
      });

      return { transaction: updatedTransaction, sourceAccount: transaction.sourceAccount };
    });

    if ("error" in result) {
      const err = result as { error: { code: number; message: string } };
      error(res, err.error.code, err.error.message);
      return;
    }

    if (result.sourceAccount) {
      void notificationService.withdrawalProcessed({
        userId: result.sourceAccount.ownerId,
        transactionId: result.transaction.id,
        accountId: result.transaction.fromAccount ?? "",
        accountNumber: result.sourceAccount.accountNumber,
        amount: Number(result.transaction.amount),
        currency: result.transaction.currency,
        balanceAfter: Number(result.transaction.balanceAfter)
      });
    }

    success(res, t(req, "transactions.withdrawalConfirmed"), result);
  } catch (err) {
    const message = err instanceof Error ? err.message : t(req, "transactions.failedToConfirmWithdrawal");
    error(res, 400, message);
  }
};

const transfer = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const { fromAccount, toAccount, amount, description } = req.body;

  if (fromAccount === toAccount) {
    error(res, 400, t(req, "transactions.sourceAndDestinationMustDiffer"));
    return;
  }

  try {
    const result = await transactionsRepository.runTransaction(async (tx) => {
      const [source, destination] = await Promise.all([
        tx.bankAccount.findUnique({ where: { id: fromAccount } }),
        tx.bankAccount.findUnique({ where: { id: toAccount } })
      ]);

      if (!source || !destination) return { error: { code: 404, message: t(req, "transactions.accountNotFound") } };
      if (source.status !== "Active" || destination.status !== "Active") {
        return { error: { code: 400, message: t(req, "transactions.bothAccountsMustBeActive") } };
      }

      const ids = [source.id, destination.id].sort();
      const join = (Prisma as unknown as { join: (values: string[]) => unknown }).join;
      await tx.$executeRaw`SELECT id FROM "BankAccount" WHERE id IN (${join(ids)}) FOR UPDATE`;

      if (source.balance.lessThan(amount)) {
        return { error: { code: 400, message: t(req, "transactions.insufficientFunds") } };
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
      userId: user.id,
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
    void notificationService.transferReceived({
      userId: result.destination.ownerId,
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

    success(res, t(req, "transactions.transferCompleted"), result, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : t(req, "transactions.transferFailed");
    error(res, 400, message);
  }
};

const listTransactions = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, t(req, "common.unauthorized"));
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

    success(res, t(req, "transactions.fetched"), items, paginationMeta(page, limit, total));
  } catch (err) {
    const message = err instanceof Error ? err.message : t(req, "transactions.failedToFetchMany");
    error(res, 400, message);
  }
};

const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  try {
    const transactionId = String(req.params.id);
    const transaction = await transactionsRepository.getTransactionById(transactionId);
    if (!transaction) {
      error(res, 404, t(req, "transactions.transactionNotFound"));
      return;
    }

    const isManager = user.userRoles.some((item: { role: { slug: string } }) => item.role.slug === "manager");
    const isCashier = user.userRoles.some((item: { role: { slug: string } }) => item.role.slug === "cashier");
    const canViewAsClient = transaction.sourceAccount?.ownerId === user.id || transaction.destinationAccount?.ownerId === user.id;

    if (!isManager && !canViewAsClient && !(isCashier && transaction.performedBy === user.id)) {
      error(res, 403, t(req, "common.forbidden"));
      return;
    }

    success(res, t(req, "transactions.fetchedOne"), transaction);
  } catch (err) {
    const message = err instanceof Error ? err.message : t(req, "transactions.failedToFetchOne");
    error(res, 400, message);
  }
};

export const transactionsService = {
  deposit,
  withdraw,
  confirmWithdrawal,
  transfer,
  listTransactions,
  getTransactionById
};
