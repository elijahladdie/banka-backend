import type { Request, Response } from "express";
import { success, error } from "../utils/response";
import { notificationsRepository } from "../repositories/implementations/prismaNotifications.repository";

const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, "Unauthorized");
    return;
  }

  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  const unreadOnly = String(req.query.unreadOnly ?? "false") === "true";
  try {
    const { notifications, total, unreadCount } = await notificationsRepository.listNotifications({
      userId,
      page,
      limit,
      unreadOnly
    });

    success(res, "Notifications fetched", {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : "Failed to fetch notifications");
  }
};

const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, "Unauthorized");
    return;
  }

  try {
    const unreadCount = await notificationsRepository.countUnread(userId);
    success(res, "Unread count fetched", { unreadCount });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : "Failed to fetch unread count");
  }
};

const markOneAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, "Unauthorized");
    return;
  }

  const notificationId = String(req.params.id);

  try {
    const notification = await notificationsRepository.findById(notificationId);

    if (!notification) {
      error(res, 404, "Resource not found");
      return;
    }

    if (notification.userId !== userId) {
      error(res, 403, "Access denied");
      return;
    }

    if (notification.isRead) {
      success(res, "Notification marked as read", { notification });
      return;
    }

    const updated = await notificationsRepository.markAsRead(notificationId);

    success(res, "Notification marked as read", { notification: updated });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : "Failed to update notification");
  }
};

const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, "Unauthorized");
    return;
  }

  try {
    const count = await notificationsRepository.markAllAsRead(userId);

    success(res, `${count} notification(s) marked as read`, { updatedCount: count });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : "Failed to mark notifications as read");
  }
};

const markOneAsUnread = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, "Unauthorized");
    return;
  }

  const notificationId = String(req.params.id);

  try {
    const notification = await notificationsRepository.findById(notificationId);

    if (!notification) {
      error(res, 404, "Resource not found");
      return;
    }

    if (notification.userId !== userId) {
      error(res, 403, "Access denied");
      return;
    }

    if (!notification.isRead) {
      success(res, "Notification marked as unread", { notification });
      return;
    }

    const updated = await notificationsRepository.markAsUnread(notificationId);

    success(res, "Notification marked as unread", { notification: updated });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : "Failed to update notification");
  }
};

const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, "Unauthorized");
    return;
  }

  const notificationId = String(req.params.id);

  try {
    const notification = await notificationsRepository.findById(notificationId);

    if (!notification) {
      error(res, 404, "Resource not found");
      return;
    }

    if (notification.userId !== userId) {
      error(res, 403, "Access denied");
      return;
    }

    await notificationsRepository.deleteById(notificationId);
    success(res, "Notification deleted", null);
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : "Failed to delete notification");
  }
};

export const notificationsController = {
  getMyNotifications,
  getUnreadCount,
  markOneAsRead,
  markOneAsUnread,
  markAllAsRead,
  deleteNotification
};