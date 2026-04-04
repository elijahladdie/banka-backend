import { Router } from "express";
import { createAccount, listAccounts, getAccountById, getAccountByNumber, approveAccount, rejectAccount, updateAccountStatus } from "../controllers/accounts.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncWrapper } from "../utils/asyncWrapper";
import {
  accountDecisionSchema,
  accountListSchema,
  accountNumberParamSchema,
  accountStatusSchema,
  createAccountSchema
} from "../validators/account.validator";
import { idParamSchema } from "../validators/user.validator";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("client", "manager", "cashier"), validate(createAccountSchema), asyncWrapper(createAccount));
router.get("/", requireRole("client", "manager", "cashier"), validate(accountListSchema), asyncWrapper(listAccounts));
router.get("/by-number/:accountNumber", requireRole("cashier", "manager"), validate(accountNumberParamSchema), asyncWrapper(getAccountByNumber));
router.get("/:id", requireRole("client", "manager", "cashier"), validate(idParamSchema), asyncWrapper(getAccountById));
router.patch("/:id/approve", requireRole("manager"), validate(accountDecisionSchema), asyncWrapper(approveAccount));
router.patch("/:id/reject", requireRole("manager"), validate(accountDecisionSchema), asyncWrapper(rejectAccount));
router.patch("/:id/status", requireRole("manager"), validate(accountStatusSchema), asyncWrapper(updateAccountStatus));

export default router;
