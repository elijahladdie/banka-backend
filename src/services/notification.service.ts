import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getUserLanguage, translateNotification } from "../utils/notification.i18n";

interface CreateNotificationPayload {
  receiverId: string;
  senderId?: string | null;
  type: NotificationType;
  metadata?: Record<string, unknown> | null;
}

class NotificationService {
  async create(payload: CreateNotificationPayload): Promise<void> {
    try {
      const receiver = await prisma.user.findUnique({
        where: { id: payload.receiverId },
        select: { preferredLanguage: true }
      });

      const lang = getUserLanguage(receiver?.preferredLanguage ?? "en");
      const { title, message } = translateNotification(payload.type, lang, payload.metadata ?? {});

      const metadata = payload.metadata == null ? Prisma.JsonNull : (payload.metadata as Prisma.InputJsonValue);

      await prisma.notification.create({
        data: {
          type: payload.type,
          title,
          message,
          isRead: false,
          readAt: null,
          metadata,
          receiverId: payload.receiverId,
          senderId: payload.senderId ?? null
        }
      });
    } catch (error) {
      console.error("[NotificationService] Failed to create notification", {
        type: payload.type,
        receiverId: payload.receiverId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  async createBulk(
    receiverIds: string[],
    payload: Omit<CreateNotificationPayload, "receiverId">
  ): Promise<void> {
    await Promise.allSettled(receiverIds.map((receiverId) => this.create({ ...payload, receiverId })));
  }

  async accountApproved(params: {
    receiverId: string;
    senderId: string;
    accountId: string;
    accountNumber: string;
    accountType: string;
  }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: params.senderId,
      type: "ACCOUNT_APPROVED",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        accountType: params.accountType
      }
    });
  }

  async accountRejected(params: {
    receiverId: string;
    senderId: string;
    accountId: string;
    accountNumber: string;
    reason: string;
  }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: params.senderId,
      type: "ACCOUNT_REJECTED",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        reason: params.reason
      }
    });
  }

  async accountFrozen(params: {
    receiverId: string;
    senderId: string;
    accountId: string;
    accountNumber: string;
    reason: string;
  }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: params.senderId,
      type: "ACCOUNT_FROZEN",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        reason: params.reason
      }
    });
  }

  async accountDormant(params: { receiverId: string; accountId: string; accountNumber: string }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: null,
      type: "ACCOUNT_DORMANT",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber
      }
    });
  }

  async accountClosed(params: {
    receiverId: string;
    senderId: string;
    accountId: string;
    accountNumber: string;
    reason: string;
  }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: params.senderId,
      type: "ACCOUNT_CLOSED",
      metadata: {
        accountId: params.accountId,
        accountNumber: params.accountNumber,
        reason: params.reason
      }
    });
  }

  async depositReceived(params: {
    receiverId: string;
    senderId: string;
    transactionId: string;
    accountId: string;
    accountNumber: string;
    amount: number;
    currency: string;
    balanceAfter: number;
  }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: params.senderId,
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

  async withdrawalProcessed(params: {
    receiverId: string;
    senderId: string;
    transactionId: string;
    accountId: string;
    accountNumber: string;
    amount: number;
    currency: string;
    balanceAfter: number;
  }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: params.senderId,
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
    receiverId: string;
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
      receiverId: params.receiverId,
      senderId: null,
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
    receiverId: string;
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
      receiverId: params.receiverId,
      senderId: null,
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
      receiverId: params.receiverId,
      senderId: null,
      type: "PASSWORD_CHANGED",
      metadata: null
    });
  }

  async profileUpdated(params: { receiverId: string }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: null,
      type: "PROFILE_UPDATED",
      metadata: null
    });
  }

  async userActivated(params: { receiverId: string; senderId: string }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: params.senderId,
      type: "USER_ACTIVATED",
      metadata: null
    });
  }

  async userDeactivated(params: { receiverId: string; senderId: string; reason?: string }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: params.senderId,
      type: "USER_DEACTIVATED",
      metadata: params.reason ? { reason: params.reason } : null
    });
  }

  async bankAccountCreated(params: {
    receiverId: string;
    accountId: string;
    accountNumber: string;
    accountType: string;
    currency: string;
  }): Promise<void> {
    await this.create({
      receiverId: params.receiverId,
      senderId: null,
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
      receiverId: params.receiverId,
      senderId: null,
      type: "WELCOME",
      metadata: null
    });
  }
}

export const notificationService = new NotificationService();