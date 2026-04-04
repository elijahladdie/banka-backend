import type { NotificationDirection, NotificationType, Prisma } from "@prisma/client";

export type NotificationWithUser = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  userId: string;
  direction: NotificationDirection;
};

export interface NotificationsRepository {
  findPreferredLanguageByUserId(userId: string): Promise<string | null>;
  create(data: {
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    readAt: Date | null;
    metadata: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    userId: string;
    direction: NotificationDirection;
  }): Promise<NotificationWithUser>;
  listNotifications(params: {
    userId: string;
    page: number;
    limit: number;
    unreadOnly?: boolean;
  }): Promise<{ notifications: NotificationWithUser[]; total: number; unreadCount: number }>;
  findById(id: string): Promise<NotificationWithUser | null>;
  countUnread(userId: string): Promise<number>;
  markAsRead(id: string): Promise<NotificationWithUser>;
  markAsUnread(id: string): Promise<NotificationWithUser>;
  markAllAsRead(userId: string): Promise<number>;
  deleteById(id: string): Promise<void>;
}
