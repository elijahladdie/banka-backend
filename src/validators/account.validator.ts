import { z } from "zod";

export const createAccountSchema = z.object({
  body: z.object({
    ownerId: z.string().uuid().optional(),
    type: z.enum(["saving", "fixed"])
  })
});

export const accountListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.enum(["Active", "Inactive", "Dormant"]).optional(),
    type: z.enum(["saving", "fixed"]).optional(),
    ownerId: z.string().uuid().optional()
  })
});

export const accountStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(["Active", "Inactive", "Dormant"]),
    reason: z.string().optional()
  })
});

export const accountDecisionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    reason: z.string().optional()
  })
});

export const accountNumberParamSchema = z.object({
  params: z.object({
    accountNumber: z.string().regex(/^\d{10,20}$/)
  })
});
