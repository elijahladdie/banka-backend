import type { AccountStatus, AccountType } from "../../types/domain";

export type AccountWithUsers = any;

export interface AccountsRepository {
  findUserById(id: string): Promise<any>;
  findAccountByNumber(accountNumber: string): Promise<any>;
  createAccount(data: {
    ownerId: string;
    accountNumber: string;
    type: AccountType;
    createdBy: string;
    status: AccountStatus;
  }): Promise<any>;
  countAccounts(where: object): Promise<number>;
  listAccounts(params: { where: object; skip: number; take: number }): Promise<AccountWithUsers[]>;
  getAccountById(id: string): Promise<AccountWithUsers | null>;
  updateAccountStatus(id: string, status: AccountStatus): Promise<any>;
}
