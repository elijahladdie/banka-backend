import { NotificationDirection, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { NotificationsRepository, NotificationWithUser } from "../interfaces/notifications.repository";

export class PrismaNotificationsRepository implements NotificationsRepository {
  findPreferredLanguageByUserId(userId: string): Promise<string | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true }
    }).then((user) => user?.preferredLanguage ?? null);
  }

  create(data: {
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    readAt: Date | null;
    metadata: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    userId: string;
    direction: NotificationDirection;
  }): Promise<NotificationWithUser> {
    return prisma.notification.create({
      data,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        readAt: true,
        metadata: true,
        createdAt: true,
        userId: true,
        direction: true
      }
    });
  }

  async listNotifications(params: {
    userId: string;
    page: number;
    limit: number;
    unreadOnly?: boolean;
  }): Promise<{ notifications: NotificationWithUser[]; total: number; unreadCount: number }> {
    const skip = (params.page - 1) * params.limit;
    const where = {
      userId: params.userId,
      ...(params.unreadOnly ? { isRead: false } : {})
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          readAt: true,
          metadata: true,
          createdAt: true,
          userId: true,
          direction: true
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: params.userId, isRead: false } })
    ]);

    return { notifications, total, unreadCount };
  }

  findById(id: string): Promise<NotificationWithUser | null> {
    return prisma.notification.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        readAt: true,
        metadata: true,
        createdAt: true,
        userId: true,
        direction: true
      }
    });
  }

  countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  markAsRead(id: string): Promise<NotificationWithUser> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        readAt: true,
        metadata: true,
        createdAt: true,
        userId: true,
        direction: true
      }
    });
  }

  markAsUnread(id: string): Promise<NotificationWithUser> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: false, readAt: null },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        readAt: true,
        metadata: true,
        createdAt: true,
        userId: true,
        direction: true
      }
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    return result.count;
  }

  async deleteById(id: string): Promise<void> {
    await prisma.notification.delete({ where: { id } });
  }
}

export const notificationsRepository = new PrismaNotificationsRepository();
