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
    userId: req.user.id,
    accountId: account.id,
    accountNumber: account.accountNumber,
    accountType: account.type,
    currency: "RWF"
  });

  success(res, "Account request created", account, undefined, 201);
};

const listAccounts = async (req: Request, res: Response): Promise<void> => {
  // 1. AUTH CHECK
  if (!req.user) {
    error(res, 401, "Unauthorized");
    return;
  }

  // 2. PAGINATION
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });

  // 3. ROLE CHECK
  const isManager = req.user.userRoles.some(
    (item: any) => item.role.slug === "manager"
  );

  // 4. QUERY PARAMS
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const type = req.query.type as string | undefined;
  const status = req.query.status as string | undefined;
  const ownerIdQuery = req.query.ownerId as string | undefined;

  // 5. CONDITION BUILDING (IMPORTANT LOGIC)
  let where: any = {};

  if (search) {
    // 🔥 SEARCH MODE (GLOBAL — NO ownerId restriction)
    where = {
      ...(status && { status }),
      ...(type && { type }),
      ...buildAccountsSearchCondition(search),
    };
  } else {
    // 🔒 NORMAL MODE (ROLE-BASED FILTERING)

    const resolvedOwnerId = isManager ? ownerIdQuery : req.user.id;

    where = {
      ...(status && { status }),
      ...(type && { type }),
      ...(resolvedOwnerId && { ownerId: resolvedOwnerId }),
    };
  }

  // 6. CACHE KEY (SHARED + STABLE)
  const cacheKey = search
    ? `accounts:search:${search}:type:${type ?? "all"}:status:${status ?? "all"}:page:${page}:limit:${limit}`
    : `accounts:list:type:${type ?? "all"}:status:${status ?? "all"}:owner:${isManager ? ownerIdQuery ?? "all" : "self"}:page:${page}:limit:${limit}`;

  // 7. CACHE CHECK
  const cached = await cacheGet<{ items: unknown[]; total: number }>(cacheKey);
  if (cached) {
    const safeItems = sanitizeAccounts(cached.items as any[]);
    success(res, "Accounts fetched", safeItems, paginationMeta(page, limit, cached.total));
    return;
  }

  // 8. DATABASE QUERY
  const [total, items] = await Promise.all([
    accountsRepository.countAccounts(where),
    accountsRepository.listAccounts({ where, skip, take: limit }),
  ]);

  const safeItems = sanitizeAccounts(items as any[]);

  // 9. CACHE STORE (SHORT TTL FOR FRESHNESS)
  await cacheSet(cacheKey, { items: safeItems, total }, 30);

  // 10. RESPONSE
  success(res, "Accounts fetched", safeItems, paginationMeta(page, limit, total));
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

  success(res, "Account fetched", sanitizeAccount(account));
};

const getAccountByNumber = async (req: Request, res: Response): Promise<void> => {
  const accountNumber = String(req.params.accountNumber);

  const account = await accountsRepository.findAccountByNumber(accountNumber);
  if (!account) {
    error(res, 404, "Account not found");
    return;
  }

  const owner = await accountsRepository.findUserById(account.ownerId);

  success(res, "Account fetched", {
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
    error(res, 404, "Account not found");
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
    userId: account.ownerId,
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

  success(res, "Account status updated", { ...updated, reason: req.body.reason ?? null });
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
