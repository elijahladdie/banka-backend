import type { Request, Response } from "express";
import type { AccountStatus, AccountType } from "../types/domain";
import { success, error } from "../utils/response";
import { accountsRepository } from "../repositories/implementations/prismaAccounts.repository";
import { generateAccountNumber } from "../utils/generateAccountNumber";
import { paginationMeta } from "../utils/pagination";
import { cacheDelByPrefix, cacheGet, cacheSet } from "./cache";
import { parsePagination } from "../utils/pagination";
import { notificationService } from "./notification.service";

const uniqueAccountNumber = async (nationalId: string): Promise<string> => {
  for (let i = 0; i < 10; i += 1) {
    const accountNumber = generateAccountNumber(nationalId);
    const exists = await accountsRepository.findAccountByNumber(accountNumber);
    if (!exists) {
      return accountNumber;
    }
  }
  throw new Error("Unable to generate unique account number");
};

const createAccount = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, "Unauthorized");
    return;
  }

  const ownerId = req.body.ownerId ?? req.user.id;
  const isManager = req.user.userRoles.some((item: any) => item.role.slug === "manager");

  if (ownerId !== req.user.id && !isManager) {
    error(res, 403, "Forbidden");
    return;
  }

  const owner = await accountsRepository.findUserById(ownerId);
  if (!owner) {
    error(res, 404, "Owner not found");
    return;
  }

  const accountNumber = await uniqueAccountNumber(owner.nationalId);
  const account = await accountsRepository.createAccount({
    ownerId,
    accountNumber,
    type: req.body.type,
    createdBy: req.user.id,
    status: isManager ? "Active" : "Inactive"
  });

  await cacheDelByPrefix("accounts:");

  void notificationService.bankAccountCreated({
    receiverId: req.user.id,
    accountId: account.id,
    accountNumber: account.accountNumber,
    accountType: account.type,
    currency: "RWF"
  });

  success(res, "Account request created", account, undefined, 201);
};

const listAccounts = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, "Unauthorized");
    return;
  }

  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const isManager = req.user.userRoles.some((item: any) => item.role.slug === "manager");

  const resolvedOwnerId = isManager ? (req.query.ownerId as string) : req.user.id;
  const cacheKey = `accounts:${req.user.id}:${page}:${limit}:${req.query.status ?? ""}:${req.query.type ?? ""}:${resolvedOwnerId ?? ""}`;

  const cached = await cacheGet<{ items: unknown[]; total: number }>(cacheKey);
  if (cached) {
    success(res, "Accounts fetched", cached.items, paginationMeta(page, limit, cached.total));
    return;
  }

  const where = {
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(req.query.type ? { type: req.query.type } : {}),
    ...(resolvedOwnerId ? { ownerId: resolvedOwnerId } : {})
  };

  const [total, items] = await Promise.all([
    accountsRepository.countAccounts(where),
    accountsRepository.listAccounts({ where, skip, take: limit })
  ]);

  await cacheSet(cacheKey, { items, total }, 30);
  success(res, "Accounts fetched", items, paginationMeta(page, limit, total));
};

const getAccountById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, "Unauthorized");
    return;
  }

  const accountId = String(req.params.id);
  const account = await accountsRepository.getAccountById(accountId);

  if (!account) {
    error(res, 404, "Account not found");
    return;
  }

  const isManager = req.user.userRoles.some((item: any) => item.role.slug === "manager");
  if (!isManager && account.ownerId !== req.user.id) {
    error(res, 403, "Forbidden");
    return;
  }

  success(res, "Account fetched", account);
};

const approveAccount = async (req: Request, res: Response): Promise<void> => {
  const accountId = String(req.params.id);
  const account = await accountsRepository.getAccountById(accountId);
  if (!account) {
    error(res, 404, "Account not found");
    return;
  }

  const updated = await accountsRepository.updateAccountStatus(accountId, "Active");
  await cacheDelByPrefix("accounts:");

  void notificationService.accountApproved({
    receiverId: account.ownerId,
    senderId: req.user?.id ?? account.ownerId,
    accountId: account.id,
    accountNumber: account.accountNumber,
    accountType: account.type
  });

  success(res, "Account approved", updated);
};

const rejectAccount = async (req: Request, res: Response): Promise<void> => {
  const accountId = String(req.params.id);
  const account = await accountsRepository.getAccountById(accountId);
  if (!account) {
    error(res, 404, "Account not found");
    return;
  }

  const updated = await accountsRepository.updateAccountStatus(accountId, "Inactive");
  await cacheDelByPrefix("accounts:");

  void notificationService.accountRejected({
    receiverId: account.ownerId,
    senderId: req.user?.id ?? account.ownerId,
    accountId: account.id,
    accountNumber: account.accountNumber,
    reason: String(req.body.reason ?? "No reason provided")
  });

  success(res, "Account rejected", { ...updated, reason: req.body.reason ?? "No reason provided" });
};

const updateAccountStatus = async (req: Request, res: Response): Promise<void> => {
  const accountId = String(req.params.id);
  const account = await accountsRepository.getAccountById(accountId);
  if (!account) {
    error(res, 404, "Account not found");
    return;
  }

  const updated = await accountsRepository.updateAccountStatus(accountId, req.body.status);
  await cacheDelByPrefix("accounts:");

  if (req.body.status === "Inactive" && typeof req.body.freezeReason === "string") {
    void notificationService.accountFrozen({
      receiverId: account.ownerId,
      senderId: req.user?.id ?? account.ownerId,
      accountId: account.id,
      accountNumber: account.accountNumber,
      reason: req.body.freezeReason
    });
  } else if (req.body.status === "Inactive" && typeof req.body.closureReason === "string") {
    void notificationService.accountClosed({
      receiverId: account.ownerId,
      senderId: req.user?.id ?? account.ownerId,
      accountId: account.id,
      accountNumber: account.accountNumber,
      reason: req.body.closureReason
    });
  }

  success(res, "Account status updated", { ...updated, reason: req.body.reason ?? null });
};

export const accountsService = {
  createAccount,
  listAccounts,
  getAccountById,
  approveAccount,
  rejectAccount,
  updateAccountStatus
};
