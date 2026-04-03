import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { success, error } from "../utils/response";

const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, "Unauthorized");
    return;
  }

  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  const unreadOnly = String(req.query.unreadOnly ?? "false") === "true";
  const skip = (page - 1) * limit;

  try {
    const where = {
      receiverId: userId,
      ...(unreadOnly ? { isRead: false } : {})
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          readAt: true,
          metadata: true,
          createdAt: true,
          senderId: true,
          receiverId: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          }
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { receiverId: userId, isRead: false } })
    ]);

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
    const unreadCount = await prisma.notification.count({ where: { receiverId: userId, isRead: false } });
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
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, receiverId: true, isRead: true }
    });

    if (!notification) {
      error(res, 404, "Resource not found");
      return;
    }

    if (notification.receiverId !== userId) {
      error(res, 403, "Access denied");
      return;
    }

    if (notification.isRead) {
      success(res, "Notification marked as read", { notification });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
      select: { id: true, isRead: true, readAt: true }
    });

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
    const result = await prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    success(res, `${result.count} notification(s) marked as read`, { updatedCount: result.count });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : "Failed to mark notifications as read");
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
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, receiverId: true }
    });

    if (!notification) {
      error(res, 404, "Resource not found");
      return;
    }

    if (notification.receiverId !== userId) {
      error(res, 403, "Access denied");
      return;
    }

    await prisma.notification.delete({ where: { id: notificationId } });
    success(res, "Notification deleted", null);
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : "Failed to delete notification");
  }
};

export const notificationsController = {
  getMyNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
  deleteNotification
};