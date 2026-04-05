import type { Request, Response } from "express";
import { success } from "../utils/response";
import { statsRepository } from "../repositories/implementations/prismaStats.repository";
import { cacheGet, cacheSet } from "./cache";
import { t } from "../i18n";

function buildDateFilter(query: { fromDate?: string; toDate?: string }) {
  const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
  const toDate = query.toDate ? new Date(query.toDate) : undefined;

  if (!fromDate && !toDate) {
    return undefined;
  }

  return {
    ...(fromDate ? { gte: fromDate } : {}),
    ...(toDate ? { lte: toDate } : {})
  };
}

const overview = async (req: Request, res: Response): Promise<void> => {
  const key = "stats:overview";
  const cached = await cacheGet<object>(key);
  if (cached) {
    success(res, t(req, "stats.overviewFetched"), cached);
    return;
  }

  const [users, accounts, transactionAgg, pendingApprovals] = await Promise.all([
    statsRepository.countActiveUsers(),
    statsRepository.countAccounts(),
    statsRepository.aggregateTransactions(),
    statsRepository.countPendingUsers()
  ]);

  const data = {
    activeUsers: users,
    totalAccounts: accounts,
    transactionCount: transactionAgg._count.id,
    transactionVolume: transactionAgg._sum.amount ?? 0,
    pendingApprovals
  };

  await cacheSet(key, data, 300);
  success(res, t(req, "stats.overviewFetched"), data);
};

const transactionsSeries = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as { fromDate?: string; toDate?: string };
  const key = `stats:transactions:${JSON.stringify(query)}`;
  const cached = await cacheGet<object>(key);
  if (cached) {
    success(res, t(req, "stats.transactionFetched"), cached);
    return;
  }

  const createdAt = buildDateFilter(query);
  const data = await statsRepository.groupTransactions({ ...(createdAt ? { createdAt } : {}) });

  await cacheSet(key, data, 300);
  success(res, t(req, "stats.transactionFetched"), data);
};

const accountsSeries = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as { fromDate?: string; toDate?: string };
  const key = `stats:accounts:${JSON.stringify(query)}`;
  const cached = await cacheGet<object>(key);
  if (cached) {
    success(res, t(req, "stats.accountFetched"), cached);
    return;
  }

  const createdAt = buildDateFilter(query);
  const data = await statsRepository.groupAccounts({ ...(createdAt ? { createdAt } : {}) });

  await cacheSet(key, data, 300);
  success(res, t(req, "stats.accountFetched"), data);
};

const usersSeries = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as { fromDate?: string; toDate?: string };
  const key = `stats:users:${JSON.stringify(query)}`;
  const cached = await cacheGet<object>(key);
  if (cached) {
    success(res, t(req, "stats.userFetched"), cached);
    return;
  }

  const createdAt = buildDateFilter(query);
  const data = await statsRepository.groupUsersByRole(createdAt ? { createdAt } : undefined);

  await cacheSet(key, data, 300);
  success(res, t(req, "stats.userFetched"), data);
};

export const statsService = {
  overview,
  transactionsSeries,
  accountsSeries,
  usersSeries
};
