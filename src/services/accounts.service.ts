import type { Request, Response } from "express";
import type { AccountStatus, AccountType } from "../types/domain";
import { success, error } from "../utils/response";
import { accountsRepository } from "../repositories/implementations/prismaAccounts.repository";
import { generateAccountNumber } from "../utils/generateAccountNumber";
import { paginationMeta } from "../utils/pagination";
import { cacheDelByPrefix, cacheGet, cacheSet } from "./cache";
import { parsePagination } from "../utils/pagination";
import { notificationService } from "./notification.service";
import { buildAccountsSearchCondition } from "../utils/search.helper";
import { t } from "../i18n";

const sanitizeOwner = (owner: any): any => {
  if (!owner || typeof owner !== "object") return owner;
  const { password: _password, ...safeOwner } = owner;
  return safeOwner;
};

const sanitizeAccount = (account: any): any => {
  if (!account || typeof account !== "object") return account;
  return {
    ...account,
    owner: sanitizeOwner(account.owner)
  };
};

const sanitizeAccounts = (items: any[]): any[] => items.map((item) => sanitizeAccount(item));

const uniqueAccountNumber = async (nationalId: string): Promise<string> => {
  for (let i = 0; i < 10; i += 1) {
    const accountNumber = generateAccountNumber(nationalId);
    const exists = await accountsRepository.findAccountByNumber(accountNumber);
    if (!exists) {
      return accountNumber;
    }
  }
  throw new Error("accounts.unableToGenerateUniqueNumber");
};

const createAccount = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const ownerId = req.body.ownerId ?? req.user.id;
  const isManager = req.user.userRoles.some((item: any) => item.role.slug === "manager");

  if (ownerId !== req.user.id && !isManager) {
    error(res, 403, t(req, "common.forbidden"));
    return;
  }

  const owner = await accountsRepository.findUserById(ownerId);
  if (!owner) {
    error(res, 404, t(req, "accounts.ownerNotFound"));
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
    userId: req.user.id,
    accountId: account.id,
    accountNumber: account.accountNumber,
    accountType: account.type,
    currency: "RWF"
  });

  success(res, t(req, "accounts.requestCreated"), account, undefined, 201);
};

const listAccounts = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });

  const isManager = req.user.userRoles.some(
    (item: any) => item.role.slug === "manager"
  );

  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const type = req.query.type as string | undefined;
  const status = req.query.status as string | undefined;
  const ownerIdQuery = req.query.ownerId as string | undefined;

  let where: any = {};

  if (search) {
    where = {
      ...(status && { status }),
      ...(type && { type }),
      ...buildAccountsSearchCondition(search),
    };
  } else {

    const resolvedOwnerId = isManager ? ownerIdQuery : req.user.id;

    where = {
      ...(status && { status }),
      ...(type && { type }),
      ...(resolvedOwnerId && { ownerId: resolvedOwnerId }),
    };
  }

  const cacheKey = search
    ? `accounts:search:${search}:type:${type ?? "all"}:status:${status ?? "all"}:page:${page}:limit:${limit}`
    : `accounts:list:type:${type ?? "all"}:status:${status ?? "all"}:owner:${isManager ? ownerIdQuery ?? "all" : "self"}:page:${page}:limit:${limit}`;

  const cached = await cacheGet<{ items: unknown[]; total: number }>(cacheKey);
  if (cached) {
    const safeItems = sanitizeAccounts(cached.items as any[]);
    success(res, t(req, "accounts.fetched"), safeItems, paginationMeta(page, limit, cached.total));
    return;
  }


  const [total, items] = await Promise.all([
    accountsRepository.countAccounts(where),
    accountsRepository.listAccounts({ where, skip, take: limit }),
  ]);

  const safeItems = sanitizeAccounts(items as any[]);

  await cacheSet(cacheKey, { items: safeItems, total }, 3000);

  success(res, t(req, "accounts.fetched"), safeItems, paginationMeta(page, limit, total));
};

const getAccountById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const accountId = String(req.params.id);
  const account = await accountsRepository.getAccountById(accountId);

  if (!account) {
    error(res, 404, t(req, "accounts.accountNotFound"));
    return;
  }

  const isManager = req.user.userRoles.some((item: any) => item.role.slug === "manager");
  if (!isManager && account.ownerId !== req.user.id) {
    error(res, 403, t(req, "common.forbidden"));
    return;
  }

  success(res, t(req, "accounts.fetchedOne"), sanitizeAccount(account));
};

const getAccountByNumber = async (req: Request, res: Response): Promise<void> => {
  const accountNumber = String(req.params.accountNumber);

  const account = await accountsRepository.findAccountByNumber(accountNumber);
  if (!account) {
    error(res, 404, t(req, "accounts.accountNotFound"));
    return;
  }

  const owner = await accountsRepository.findUserById(account.ownerId);

  success(res, t(req, "accounts.fetchedOne"), {
    id: account.id,
    accountNumber: account.accountNumber,
    ownerId: account.ownerId,
    status: account.status,
    type: account.type,
    balance: account.balance,
    owner: owner
      ? {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email
        }
      : null
  });
};

const approveAccount = async (req: Request, res: Response): Promise<void> => {
  const accountId = String(req.params.id);
  const account = await accountsRepository.getAccountById(accountId);
  if (!account) {
    error(res, 404, t(req, "accounts.accountNotFound"));
    return;
  }

  const updated = await accountsRepository.updateAccountStatus(accountId, "Active");
  await cacheDelByPrefix("accounts:");

  void notificationService.accountApproved({
    userId: account.ownerId,
    accountId: account.id,
    accountNumber: account.accountNumber,
    accountType: account.type
  });

  success(res, t(req, "accounts.approved"), updated);
};

const rejectAccount = async (req: Request, res: Response): Promise<void> => {
  const accountId = String(req.params.id);
  const account = await accountsRepository.getAccountById(accountId);
  if (!account) {
    error(res, 404, t(req, "accounts.accountNotFound"));
    return;
  }

  const updated = await accountsRepository.updateAccountStatus(accountId, "Inactive");
  await cacheDelByPrefix("accounts:");

  void notificationService.accountRejected({
    userId: account.ownerId,
    accountId: account.id,
    accountNumber: account.accountNumber,
    reason: String(req.body.reason ?? t(req, "accounts.noReasonProvided"))
  });

  success(res, t(req, "accounts.rejected"), {
    ...updated,
    reason: req.body.reason ?? t(req, "accounts.noReasonProvided")
  });
};

const updateAccountStatus = async (req: Request, res: Response): Promise<void> => {
  const accountId = String(req.params.id);
  const account = await accountsRepository.getAccountById(accountId);
  if (!account) {
    error(res, 404, t(req, "accounts.accountNotFound"));
    return;
  }

  const updated = await accountsRepository.updateAccountStatus(accountId, req.body.status);
  await cacheDelByPrefix("accounts:");

  if (req.body.status === "Inactive" && typeof req.body.freezeReason === "string") {
    void notificationService.accountFrozen({
      userId: account.ownerId,
      accountId: account.id,
      accountNumber: account.accountNumber,
      reason: req.body.freezeReason
    });
  } else if (req.body.status === "Inactive" && typeof req.body.closureReason === "string") {
    void notificationService.accountClosed({
      userId: account.ownerId,
      accountId: account.id,
      accountNumber: account.accountNumber,
      reason: req.body.closureReason
    });
  }

  success(res, t(req, "accounts.statusUpdated"), { ...updated, reason: req.body.reason ?? null });
};

export const accountsService = {
  createAccount,
  listAccounts,
  getAccountById,
  getAccountByNumber,
  approveAccount,
  rejectAccount,
  updateAccountStatus
};
