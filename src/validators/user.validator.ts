import { z } from "zod";

export const usersListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional()
  })
});

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    lastName: z.string().optional(),
    email: z.string().email(),
    phoneNumber: z.string().optional(),
    nationalId: z.string().min(4),
    password: z.string().min(8),
    age: z.number().int().min(18),
    roleSlug: z.enum(["client", "cashier", "manager"]),
    profilePicture: z.string().url().optional()
  })
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    profilePicture: z.string().url().optional(),
    age: z.number().int().min(18).optional()
  })
});

export const updateUserStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(["active", "inactive", "suspended", "pending_approval"]),
    reason: z.string().optional()
  })
});

export const changeUserPasswordSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8)
  })
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});
