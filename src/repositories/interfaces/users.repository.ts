import type { UserStatus } from "../../types/domain";

export type UserWithRoles = any;

export interface UsersRepository {
  countUsers(where: object): Promise<number>;
  listUsers(params: { where: object; skip: number; take: number }): Promise<UserWithRoles[]>;
  findRoleBySlug(slug: string): Promise<any>;
  findExistingIdentity(data: { email: string; nationalId: string; phoneNumber?: string }): Promise<any>;
  createUser(data: {
    firstName: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    nationalId: string;
    password: string;
    age: number;
    roleId: string;
    profilePicture?: string;
    status: "active" | "pending_approval";
  }): Promise<UserWithRoles>;
  getUserById(id: string): Promise<UserWithRoles | null>;
  updateUserById(id: string, data: object): Promise<UserWithRoles>;
  updateUserStatus(id: string, status: UserStatus): Promise<any>;
}
