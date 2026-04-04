import { prisma } from "../../config/prisma";
import type { AccountsRepository, AccountWithUsers } from "../interfaces/accounts.repository";
import type { AccountStatus, AccountType } from "../../types/domain";

export class PrismaAccountsRepository implements AccountsRepository {
  findUserById(id: string): Promise<any> {
    return prisma.user.findUnique({ where: { id } });
  }

  findAccountByNumber(accountNumber: string): Promise<any> {
    return prisma.bankAccount.findUnique({ where: { accountNumber } });
  }

  createAccount(data: {
    ownerId: string;
    accountNumber: string;
    type: AccountType;
    createdBy: string;
    status: AccountStatus;
  }): Promise<any> {
    return prisma.bankAccount.create({ data });
  }

  countAccounts(where: object): Promise<number> {
    return prisma.bankAccount.count({ where });
  }

  listAccounts(params: { where: object; skip: number; take: number }): Promise<AccountWithUsers[]> {
    return prisma.bankAccount.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
      include: { owner: true, creator: true }
    });
  }

  getAccountById(id: string): Promise<AccountWithUsers | null> {
    return prisma.bankAccount.findUnique({
      where: { id },
      include: { owner: true, creator: true }
    });
  }

  updateAccountStatus(id: string, status: AccountStatus): Promise<any> {
    return prisma.bankAccount.update({ where: { id }, data: { status } });
  }
}

export const accountsRepository = new PrismaAccountsRepository();
