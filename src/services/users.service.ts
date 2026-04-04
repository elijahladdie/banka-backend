import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { success, error } from "../utils/response";
import { cacheDelByPrefix, cacheGet, cacheSet } from "./cache";
import { paginationMeta } from "../utils/pagination";
import { parsePagination } from "../utils/pagination";
import { notificationService } from "./notification.service";

const buildWhereConditions = (query: Record<string, any>): Record<string, any> => {
  const { search, role, status } = query;

  return {
    ...(status ? { status: status as never } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(role
      ? {
          userRoles: {
            some: {
              role: { slug: role }
            }
          }
        }
      : {})
  };
};

const formatUserResponse = (user: any): Record<string, any> => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    status: user.status,
    createdAt: user.createdAt,
    roles: user.userRoles.map((ur: any) => ur.role.slug)
  };
};

const formatUserDetailResponse = (user: any): Record<string, any> => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    nationalId: user.nationalId,
    status: user.status,
    profilePicture: user.profilePicture,
    age: user.age,
    roles: user.userRoles.map((ur: any) => ur.role.slug)
  };
};

const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const query = req.query as any;

  const cacheKey = `users:${page}:${limit}:${query.search ?? ""}:${query.role ?? ""}:${query.status ?? ""}`;

  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) {
    success(res, "Users fetched", cached as object, paginationMeta(page, limit, 0));
    return;
  }

  const where = buildWhereConditions(query);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { userRoles: { include: { role: true } } }
    })
  ]);

  if (users.length === 0) {
    error(res, 404, "No users found");
    return;
  }

  const payload = users.map((user) => formatUserResponse(user));
  await cacheSet(cacheKey, payload, 60);

  success(res, "Users fetched", payload, paginationMeta(page, limit, total));
};

const createUser = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, phoneNumber, nationalId, password, age, roleSlug, profilePicture } = req.body;

  const exists = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { nationalId }, ...(phoneNumber ? [{ phoneNumber }] : [])]
    }
  });

  if (exists) {
    error(res, 409, "User already exists with this email, nationalId or phoneNumber");
    return;
  }

  const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role) {
    error(res, 400, "Role not found");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phoneNumber,
      nationalId,
      password: hashedPassword,
      age,
      profilePicture,
      status: roleSlug === "client" ? "pending_approval" : "active",
      userRoles: { create: { roleId: role.id } }
    },
    include: { userRoles: { include: { role: true } } }
  });

  await cacheDelByPrefix("users:");

  success(
    res,
    "User created",
    {
      id: user.id,
      email: user.email,
      status: user.status,
      roles: user.userRoles.map((ur) => ur.role.slug)
    },
    undefined,
    201
  );
};

const getUserById = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } }
  });

  if (!user) {
    error(res, 404, "User not found");
    return;
  }

  success(res, "User fetched", formatUserDetailResponse(user));
};

const updateUser = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);

  if (!req.user) {
    error(res, 401, "Unauthorized");
    return;
  }

  const isManager = req.user.userRoles.some((item: { role: { slug: string } }) => item.role.slug === "manager");
  if (req.user.id !== userId && !isManager) {
    error(res, 403, "Forbidden");
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      nationalId: true,
      age: true,
      profilePicture: true
    }
  });

  if (!existingUser) {
    error(res, 404, "User not found");
    return;
  }

  const hasChanges = ["firstName", "lastName", "email", "phoneNumber", "nationalId", "age", "profilePicture"].some((key) => {
    const nextValue = req.body[key];
    return nextValue !== undefined && nextValue !== (existingUser as Record<string, unknown>)[key];
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: req.body,
    include: { userRoles: { include: { role: true } } }
  });

  await cacheDelByPrefix("users:");

  if (req.user.id === userId && hasChanges) {
    void notificationService.profileUpdated({ receiverId: userId });
  }

  success(res, "User updated", {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    roles: user.userRoles.map((ur) => ur.role.slug)
  });
};

const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);
  const { status } = req.body;

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true }
  });

  if (!currentUser) {
    error(res, 404, "User not found");
    return;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status }
  });

  await cacheDelByPrefix("users:");

  if (status === "active" && currentUser.status !== "active") {
    void notificationService.userActivated({ receiverId: userId, senderId: req.user?.id ?? userId });
  } else if (status === "inactive" && currentUser.status === "active") {
    void notificationService.userDeactivated({
      receiverId: userId,
      senderId: req.user?.id ?? userId,
      reason: typeof req.body.reason === "string" ? req.body.reason : undefined
    });
  }

  success(res, "User status updated", { id: user.id, status: user.status });
};

const changeUserPassword = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);

  if (!req.user) {
    error(res, 401, "Unauthorized");
    return;
  }

  if (req.user.id !== userId) {
    error(res, 403, "Forbidden");
    return;
  }

  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true }
  });

  if (!user) {
    error(res, 404, "User not found");
    return;
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    error(res, 400, "Current password is invalid");
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  void notificationService.passwordChanged({ receiverId: userId });

  success(res, "Password updated", { id: userId });
};

const softDeleteUser = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "inactive" }
  });

  await cacheDelByPrefix("users:");

  success(res, "User soft deleted", { id: user.id, status: user.status });
};

export const usersService = {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  changeUserPassword,
  softDeleteUser
};
