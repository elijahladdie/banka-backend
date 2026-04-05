import type { Request, Response } from "express";
import { success, error } from "../utils/response";
import { notificationsRepository } from "../repositories/implementations/prismaNotifications.repository";
import { t } from "../i18n";

const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, t(req, "common.unauthorized"));
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

    success(res, t(req, "notifications.fetched"), {
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
    error(res, 500, err instanceof Error ? err.message : t(req, "notifications.failedToFetch"));
  }
};

const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  try {
    const unreadCount = await notificationsRepository.countUnread(userId);
    success(res, t(req, "notifications.unreadCountFetched"), { unreadCount });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : t(req, "notifications.failedToFetchUnreadCount"));
  }
};

const markOneAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const notificationId = String(req.params.id);

  try {
    const notification = await notificationsRepository.findById(notificationId);

    if (!notification) {
      error(res, 404, t(req, "common.resourceNotFound"));
      return;
    }

    if (notification.userId !== userId) {
      error(res, 403, t(req, "notifications.accessDenied"));
      return;
    }

    if (notification.isRead) {
      success(res, t(req, "notifications.markedRead"), { notification });
      return;
    }

    const updated = await notificationsRepository.markAsRead(notificationId);

    success(res, t(req, "notifications.markedRead"), { notification: updated });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : t(req, "notifications.failedToUpdate"));
  }
};

const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  try {
    const count = await notificationsRepository.markAllAsRead(userId);

    success(res, t(req, "notifications.markedAllRead", { count }), { updatedCount: count });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : t(req, "notifications.failedToMarkAllRead"));
  }
};

const markOneAsUnread = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const notificationId = String(req.params.id);

  try {
    const notification = await notificationsRepository.findById(notificationId);

    if (!notification) {
      error(res, 404, t(req, "common.resourceNotFound"));
      return;
    }

    if (notification.userId !== userId) {
      error(res, 403, t(req, "notifications.accessDenied"));
      return;
    }

    if (!notification.isRead) {
      success(res, t(req, "notifications.markedUnread"), { notification });
      return;
    }

    const updated = await notificationsRepository.markAsUnread(notificationId);

    success(res, t(req, "notifications.markedUnread"), { notification: updated });
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : t(req, "notifications.failedToUpdate"));
  }
};

const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    error(res, 401, t(req, "common.unauthorized"));
    return;
  }

  const notificationId = String(req.params.id);

  try {
    const notification = await notificationsRepository.findById(notificationId);

    if (!notification) {
      error(res, 404, t(req, "common.resourceNotFound"));
      return;
    }

    if (notification.userId !== userId) {
      error(res, 403, t(req, "notifications.accessDenied"));
      return;
    }

    await notificationsRepository.deleteById(notificationId);
    success(res, t(req, "notifications.deleted"), null);
  } catch (err) {
    error(res, 500, err instanceof Error ? err.message : t(req, "notifications.failedToDelete"));
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