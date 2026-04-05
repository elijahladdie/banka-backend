import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { success, error } from "../utils/response";
import { cacheDelByPrefix, cacheGet, cacheSet } from "./cache";
import { paginationMeta } from "../utils/pagination";
import { parsePagination } from "../utils/pagination";
import { notificationService } from "./notification.service";
import { buildUsersSearchCondition } from "../utils/search.helper";
import { t } from "../i18n";

const buildWhereConditions = (query: Record<string, any>): Record<string, any> => {
  const { search, role, status } = query;

  return {
    ...(status ? { status: status as never } : {}),
    ...buildUsersSearchCondition(typeof search === "string" ? search : ""),
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
    preferredLanguage: user.preferredLanguage,
    age: user.age,
    profilePicture: user.profilePicture,
    nationalId: user.nationalId,
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
    preferredLanguage: user.preferredLanguage,
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
    success(res, t(req, "users.fetched"), cached as object, paginationMeta(page, limit, 0));
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
    error(res, 404, t(req, "users.noneFound"));
    return;
  }

  const payload = users.map((user) => formatUserResponse(user));
  await cacheSet(cacheKey, payload, 60);

  success(res, t(req, "users.fetched"), payload, paginationMeta(page, limit, total));
};

const createUser = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const isManager = req.user.userRoles.some((item: { role: { slug: string } }) => item.role.slug === "manager");
  if (!isManager) {
    error(res, 403, t(req, "users.onlyManagersCanCreate"));
    return;
  }

  const { firstName, lastName, email, phoneNumber, nationalId, password, age, roleSlug, profilePicture } = req.body;

  const exists = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { nationalId }, ...(phoneNumber ? [{ phoneNumber }] : [])]
    }
  });

  if (exists) {
    error(res, 409, t(req, "users.alreadyExists"));
    return;
  }

  const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role) {
    error(res, 400, t(req, "users.roleNotFound"));
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

  await notificationService.welcome({ receiverId: user.id });

  success(
    res,
    t(req, "users.created"),
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
    error(res, 404, t(req, "auth.userNotFound"));
    return;
  }

  success(res, t(req, "users.fetchedOne"), formatUserDetailResponse(user));
};

const updateUser = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);

  if (!req.user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const isManager = req.user.userRoles.some((item: { role: { slug: string } }) => item.role.slug === "manager");
  if (req.user.id !== userId && !isManager) {
    error(res, 403, t(req, "common.forbidden"));
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
    error(res, 404, t(req, "auth.userNotFound"));
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

  success(res, t(req, "users.updated"), {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    preferredLanguage: user.preferredLanguage,
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
    error(res, 404, t(req, "auth.userNotFound"));
    return;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status }
  });

  await cacheDelByPrefix("users:");

  if (status === "active" && currentUser.status !== "active") {
    void notificationService.userActivated({ receiverId: userId });
  } else if (status === "inactive" && currentUser.status === "active") {
    void notificationService.userDeactivated({
      receiverId: userId,
      reason: typeof req.body.reason === "string" ? req.body.reason : undefined
    });
  }

  success(res, t(req, "users.statusUpdated"), { id: user.id, status: user.status });
};

const changeUserPassword = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);

  if (!req.user) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  if (req.user.id !== userId) {
    error(res, 403, t(req, "common.forbidden"));
    return;
  }

  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true }
  });

  if (!user) {
    error(res, 404, t(req, "auth.userNotFound"));
    return;
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    error(res, 400, t(req, "users.currentPasswordInvalid"));
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  void notificationService.passwordChanged({ receiverId: userId });

  success(res, t(req, "users.passwordUpdated"), { id: userId });
};

const softDeleteUser = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.id);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "inactive" }
  });

  await cacheDelByPrefix("users:");

  success(res, t(req, "users.softDeleted"), { id: user.id, status: user.status });
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
