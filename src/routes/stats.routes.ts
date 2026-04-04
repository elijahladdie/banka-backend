import { Router } from "express";
import { overview, transactionsSeries, accountsSeries, usersSeries } from "../controllers/stats.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncWrapper } from "../utils/asyncWrapper";

const router = Router();

router.use(authenticate, requireRole("manager"));

router.get("/overview", asyncWrapper(overview));
router.get("/transactions", asyncWrapper(transactionsSeries));
router.get("/accounts", asyncWrapper(accountsSeries));
router.get("/users", asyncWrapper(usersSeries));

export default router;
