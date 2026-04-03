import { prisma } from "../../config/prisma";
import type { AuthRepository, UserWithRoles } from "../interfaces/auth.repository";

export class PrismaAuthRepository implements AuthRepository {
  findUserForLoginByEmail(email: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { userRoles: { include: { role: true } } }
    });
  }

  findUserByEmail(email: string): Promise<any> {
    return prisma.user.findUnique({ where: { email } });
  }

  findUserByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } }
    });
  }

  findClientRole(): Promise<any> {
    return prisma.role.findUnique({ where: { slug: "client" } });
  }

  createClientRegistration(data: {
    firstName: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    nationalId: string;
    password: string;
    age: number;
    preferredLanguage?: string;
    profilePicture?: string;
    roleId: string;
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
        status: "pending_approval",
        userRoles: { create: { roleId: data.roleId } }
      },
      include: { userRoles: { include: { role: true } } }
    });
  }

  createPasswordResetToken(data: {
    token: string;
    expiresAt: Date;
    userId: string;
    ipAddress?: string;
  }): Promise<any> {
    return prisma.passwordResetToken.create({
      data: {
        token: data.token,
        expiresAt: data.expiresAt,
        userId: data.userId,
        ipAddress: data.ipAddress
      }
    });
  }

  findResetToken(token: string): Promise<any> {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  }

  async updatePasswordAndConsumeResetToken(data: {
    userId: string;
    password: string;
    tokenId: string;
  }): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({ where: { id: data.userId }, data: { password: data.password } }),
      prisma.passwordResetToken.update({
        where: { id: data.tokenId },
        data: { isUsed: true, usedAt: new Date() }
      })
    ]);
  }

  findExistingIdentity(data: { email: string; nationalId: string; phoneNumber?: string }): Promise<any> {
    return prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { nationalId: data.nationalId }, ...(data.phoneNumber ? [{ phoneNumber: data.phoneNumber }] : [])]
      }
    });
  }
}

export const authRepository = new PrismaAuthRepository();
