import { prisma } from "../../config/prisma";
import type { UsersRepository, UserWithRoles } from "../interfaces/users.repository";
import type { UserStatus } from "../../types/domain";

export class PrismaUsersRepository implements UsersRepository {
  countUsers(where: object): Promise<number> {
    return prisma.user.count({ where });
  }

  listUsers(params: { where: object; skip: number; take: number }): Promise<UserWithRoles[]> {
    return prisma.user.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
      include: { userRoles: { include: { role: true } } }
    });
  }

  findRoleBySlug(slug: string): Promise<any> {
    return prisma.role.findUnique({ where: { slug } });
  }

  findExistingIdentity(data: { email: string; nationalId: string; phoneNumber?: string }): Promise<any> {
    return prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { nationalId: data.nationalId }, ...(data.phoneNumber ? [{ phoneNumber: data.phoneNumber }] : [])]
      }
    });
  }

  createUser(data: {
    firstName: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    nationalId: string;
    password: string;
    age: number;
    roleId: string;
    preferredLanguage?: string;
    profilePicture?: string;
    status: "active" | "pending_approval";
  }): Promise<UserWithRoles> {
    return prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        nationalId: data.nationalId,
        password: data.password,
        age: data.age,
        preferredLanguage: data.preferredLanguage ?? "en",
        profilePicture: data.profilePicture,
        status: data.status,
        userRoles: { create: { roleId: data.roleId } }
      },
      include: { userRoles: { include: { role: true } } }
    });
  }

  getUserById(id: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } }
    });
  }

  updateUserById(id: string, data: object): Promise<UserWithRoles> {
    return prisma.user.update({
      where: { id },
      data,
      include: { userRoles: { include: { role: true } } }
    });
  }

  updateUserStatus(id: string, status: UserStatus): Promise<any> {
    return prisma.user.update({ where: { id }, data: { status } });
  }
}

export const usersRepository = new PrismaUsersRepository();
