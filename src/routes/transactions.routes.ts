import { Router } from "express";
import { deposit, withdraw, confirmWithdrawal, transfer, listTransactions, getTransactionById } from "../controllers/transactions.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncWrapper } from "../utils/asyncWrapper";
import {
  confirmWithdrawalSchema,
  depositSchema,
  transactionListSchema,
  transferSchema,
  withdrawSchema
} from "../validators/transaction.validator";
import { idParamSchema } from "../validators/user.validator";

const router = Router();

router.use(authenticate);

router.post("/deposit", requireRole("cashier", "manager"), validate(depositSchema), asyncWrapper(deposit));
router.post("/withdraw", requireRole("cashier", "manager"), validate(withdrawSchema), asyncWrapper(withdraw));
router.post("/confirm-withdrawal", requireRole("client", "cashier", "manager"), validate(confirmWithdrawalSchema), asyncWrapper(confirmWithdrawal));
router.post("/transfer", requireRole("client"), validate(transferSchema), asyncWrapper(transfer));
router.get("/", requireRole("client", "cashier", "manager"), validate(transactionListSchema), asyncWrapper(listTransactions));
router.get("/:id", requireRole("client", "cashier", "manager"), validate(idParamSchema), asyncWrapper(getTransactionById));

export default router;
