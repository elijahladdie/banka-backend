import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncWrapper } from "../utils/asyncWrapper";
import { notificationsController } from "../controllers/notifications.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncWrapper(notificationsController.getMyNotifications));
router.get("/unread-count", asyncWrapper(notificationsController.getUnreadCount));
router.patch("/read-all", asyncWrapper(notificationsController.markAllAsRead));
router.patch("/:id/read", asyncWrapper(notificationsController.markOneAsRead));
router.delete("/:id", asyncWrapper(notificationsController.deleteNotification));

export default router;