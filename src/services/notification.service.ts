import { NotificationType, NotificationDirection, Prisma } from "@prisma/client";
import { notificationsRepository } from "../repositories/implementations/prismaNotifications.repository";
import { getUserLanguage, translateNotification } from "../utils/notification.i18n";

interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  direction?: NotificationDirection;
  metadata?: Record<string, unknown> | null;
}

class NotificationService {
  async create(payload: CreateNotificationPayload): Promise<void> {
    try {
      const preferredLanguage = await notificationsRepository.findPreferredLanguageByUserId(payload.userId);
      const lang = getUserLanguage(preferredLanguage ?? "en");
      const { title, message } = translateNotification(payload.type, lang, payload.metadata ?? {});

      const metadata = payload.metadata == null ? Prisma.JsonNull : (payload.metadata as Prisma.InputJsonValue);

      await notificationsRepository.create({
        type: payload.type,
        title,
        message,
        isRead: false,
        readAt: null,
        metadata,
        userId: payload.userId,
        direction: payload.direction ?? "RECEIVED"
      });
    } catch (error) {
      console.error("[NotificationService] Failed to create notification", {
        type: payload.type,
        userId: payload.userId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  async createBulk(
    receiverIds: string[],
    payload: Omit<CreateNotificationPayload, "userId">
  ): Promise<void> {
    await Promise.allSettled(receiverIds.map((userId) => this.create({ ...payload, userId })));
  }

  async accountApproved(params: {
    userId: string;
    accountId: string;
    accountNumber: string;
    accountType: string;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "ACCOUNT_APPROVED",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        accountType: params.accountType
      }
    });
  }

  async accountRejected(params: {
    userId: string;
    accountId: string;
    accountNumber: string;
    reason: string;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "ACCOUNT_REJECTED",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        reason: params.reason
      }
    });
  }

  async accountFrozen(params: {
    userId: string;
    accountId: string;
    accountNumber: string;
    reason: string;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "ACCOUNT_FROZEN",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        reason: params.reason
      }
    });
  }

  async accountDormant(params: { userId: string; accountId: string; accountNumber: string }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "ACCOUNT_DORMANT",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber
      }
    });
  }

  async accountClosed(params: {
    userId: string;
    accountId: string;
    accountNumber: string;
    reason: string;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "ACCOUNT_CLOSED",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        reason: params.reason
      }
    });
  }

  async depositReceived(params: {
    userId: string;
    transactionId: string;
    accountId: string;
    accountNumber: string;
    amount: number;
    currency: string;
    balanceAfter: number;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "DEPOSIT_RECEIVED",
      metadata: {
        transactionId: params.transactionId,
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        amount: params.amount,
        currency: params.currency,
        balanceAfter: params.balanceAfter
      }
    });
  }

  async sendWithdrawalCode(params: {
    userId: string;
    transactionId: string;
    accountId: string;
    accountNumber: string;
    amount: number;
    currency: string;
    code: string;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "WITHDRAWAL_CODE_SENT",
      metadata: {
        transactionId: params.transactionId,
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        amount: params.amount,
        currency: params.currency,
        code: params.code
      }
    });
  }

  async withdrawalProcessed(params: {
    userId: string;
    transactionId: string;
    accountId: string;
    accountNumber: string;
    amount: number;
    currency: string;
    balanceAfter: number;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "WITHDRAWAL_PROCESSED",
      metadata: {
        transactionId: params.transactionId,
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        amount: params.amount,
        currency: params.currency,
        balanceAfter: params.balanceAfter
      }
    });
  }

  async transferSent(params: {
    userId: string;
    transactionId: string;
    fromAccountId: string;
    fromAccountNumber: string;
    toAccountId: string;
    toAccountNumber: string;
    amount: number;
    currency: string;
    reference: string;
    balanceAfter: number;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "SENT",
      type: "TRANSFER_SENT",
      metadata: {
        transactionId: params.transactionId,
        fromAccountId: params.fromAccountId,
        fromAccountNumber: params.fromAccountNumber,
        toAccountId: params.toAccountId,
        toAccountNumber: params.toAccountNumber,
        amount: params.amount,
        currency: params.currency,
        reference: params.reference,
        balanceAfter: params.balanceAfter
      }
    });
  }

  async transferReceived(params: {
    userId: string;
    transactionId: string;
    fromAccountId: string;
    fromAccountNumber: string;
    toAccountId: string;
    toAccountNumber: string;
    amount: number;
    currency: string;
    reference: string;
    balanceAfter: number;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "TRANSFER_RECEIVED",
      metadata: {
        transactionId: params.transactionId,
        fromAccountId: params.fromAccountId,
        fromAccountNumber: params.fromAccountNumber,
        toAccountId: params.toAccountId,
        toAccountNumber: params.toAccountNumber,
        amount: params.amount,
        currency: params.currency,
        reference: params.reference,
        balanceAfter: params.balanceAfter
      }
    });
  }

  async passwordChanged(params: { receiverId: string }): Promise<void> {
    await this.create({
      userId: params.receiverId,
      direction: "RECEIVED",
      type: "PASSWORD_CHANGED",
      metadata: null
    });
  }

  async profileUpdated(params: { receiverId: string }): Promise<void> {
    await this.create({
      userId: params.receiverId,
      direction: "RECEIVED",
      type: "PROFILE_UPDATED",
      metadata: null
    });
  }

  async userActivated(params: { receiverId: string }): Promise<void> {
    await this.create({
      userId: params.receiverId,
      direction: "RECEIVED",
      type: "USER_ACTIVATED",
      metadata: null
    });
  }

  async userDeactivated(params: { receiverId: string; reason?: string }): Promise<void> {
    await this.create({
      userId: params.receiverId,
      direction: "RECEIVED",
      type: "USER_DEACTIVATED",
      metadata: params.reason ? { reason: params.reason } : null
    });
  }

  async bankAccountCreated(params: {
    userId: string;
    accountId: string;
    accountNumber: string;
    accountType: string;
    currency: string;
  }): Promise<void> {
    await this.create({
      userId: params.userId,
      direction: "RECEIVED",
      type: "BANK_ACCOUNT_CREATED",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        accountType: params.accountType,
        currency: params.currency
      }
    });
  }

  async welcome(params: { receiverId: string }): Promise<void> {
    await this.create({
      userId: params.receiverId,
      direction: "RECEIVED",
      type: "WELCOME",
      metadata: null
    });
  }
  async accountInactiveWarning(params: { userId: string; accountId: string; accountNumber: string; daysInactive: number }): Promise<void> {
  await this.create({
    userId: params.userId,
    direction: "RECEIVED",
    type: "ACCOUNT_INACTIVE_WARNING",
    metadata: {
      accountId: params.accountId,
      accountNumber: params.accountNumber,
      daysInactive: params.daysInactive,
      message: `Your account has been inactive for ${params.daysInactive} days and is at risk of being suspended. Please access it to avoid dormancy.`
    }
  });
}
}

export const notificationService = new NotificationService();