import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    lastName: z.string().optional(),
    email: z.string().email(),
    phoneNumber: z.string().min(7).optional(),
    nationalId: z.string().min(4),
    password: z.string().min(8),
    age: z.number().int().min(18),
    profilePicture: z.string().url().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8)
  })
});
