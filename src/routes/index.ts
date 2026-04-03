import { Router } from "express";
import authRoutes from "./auth.routes";
import usersRoutes from "./users.routes";
import accountsRoutes from "./accounts.routes";
import transactionsRoutes from "./transactions.routes";
import statsRoutes from "./stats.routes";
import notificationsRoutes from "./notifications.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/accounts", accountsRoutes);
router.use("/transactions", transactionsRoutes);
router.use("/stats", statsRoutes);
router.use("/notifications", notificationsRoutes);

export default router;
