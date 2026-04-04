import { z } from "zod";

const amountSchema = z.coerce.number().min(100, "Minimum amount is 100 RWF");

export const depositSchema = z.object({
  body: z.object({
    toAccount: z.string().uuid(),
    amount: amountSchema,
    description: z.string().min(1)
  })
});

export const withdrawSchema = z.object({
  body: z.object({
    fromAccount: z.string().uuid(),
    amount: amountSchema,
    description: z.string().min(1)
  })
});

export const confirmWithdrawalSchema = z.object({
  body: z.object({
    transactionId: z.string().uuid(),
    confirmationCode: z.string().regex(/^\d{4}$/, "Confirmation code must be a 4-digit number")
  })
});

export const transferSchema = z.object({
  body: z.object({
    fromAccount: z.string().uuid(),
    toAccount: z.string().uuid(),
    amount: amountSchema,
    description: z.string().min(1)
  })
});

export const transactionListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    type: z.enum(["deposit", "withdraw", "transfer"]).optional(),
    status: z.enum(["completed", "failed", "pending", "reversed"]).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional()
  })
});
