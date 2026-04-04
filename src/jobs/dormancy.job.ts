import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { notificationService } from "../services/notification.service";

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
let dormancyTimer: NodeJS.Timeout | undefined;

const runDormancyCheck = async (): Promise<void> => {
  logger.info("[DormancyJob] Starting dormancy check");

  try {
    const now = new Date();
    const tenDaysAgo = new Date(Date.now() - TEN_DAYS_MS);
    const ninetyDaysAgo = new Date(Date.now() - NINETY_DAYS_MS);

    const activeAccounts = await prisma.bankAccount.findMany({
      where: { status: "Active" },
      select: {
        id: true,
        createdAt: true,
        accountNumber: true,
        ownerId: true,
        outgoingTransactions: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1
        },
        incomingTransactions: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    for (const account of activeAccounts) {
      const lastActivity = [
        account.outgoingTransactions[0]?.createdAt,
        account.incomingTransactions[0]?.createdAt
      ]
        .filter(Boolean)
        .sort((a, b) => (a!.getTime() > b!.getTime() ? -1 : 1))[0];

      // Skip accounts that are too new (< 90 days)
      const accountOlderThan90Days = account.createdAt <= ninetyDaysAgo;

      // 1️⃣ Send warning if last activity > 10 days
      if ((lastActivity ?? account.createdAt) <= tenDaysAgo) {
        try {
          await notificationService.accountInactiveWarning({
            userId: account.ownerId,
            accountId: account.id,
            accountNumber: account.accountNumber,
            daysInactive: 10
          });
        } catch (error) {
          logger.error({ error, accountId: account.id }, "[DormancyJob] Failed to send inactivity warning");
        }
      }

      // 2️⃣ Mark as dormant if last activity > 90 days and account itself is older than 90 days
      if ((lastActivity ?? account.createdAt) <= ninetyDaysAgo && accountOlderThan90Days) {
        try {
          await prisma.bankAccount.update({
            where: { id: account.id },
            data: { status: "Dormant" }
          });

          await notificationService.accountDormant({
            userId: account.ownerId,
            accountId: account.id,
            accountNumber: account.accountNumber
          });
        } catch (error) {
          logger.error({ error, accountId: account.id }, "[DormancyJob] Failed to mark account dormant");
        }
      }
    }

    logger.info({ count: activeAccounts.length }, "[DormancyJob] Dormancy check complete");
  } catch (error) {
    logger.error({ error }, "[DormancyJob] Job failed");
  }
};

export function startDormancyJob(): void {
  if (dormancyTimer) return;

  void runDormancyCheck();
  dormancyTimer = setInterval(() => {
    void runDormancyCheck();
  }, 24 * 60 * 60 * 1000);

  logger.info("[DormancyJob] Scheduled daily dormancy checks");
}