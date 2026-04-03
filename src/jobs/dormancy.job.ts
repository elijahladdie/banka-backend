import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { notificationService } from "../services/notification.service";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
let dormancyTimer: NodeJS.Timeout | undefined;

const runDormancyCheck = async (): Promise<void> => {
  logger.info("[DormancyJob] Starting dormancy check");

  try {
    const ninetyDaysAgo = new Date(Date.now() - NINETY_DAYS_MS);
    const dormantCandidates = await prisma.bankAccount.findMany({
      where: {
        status: "Active"
      },
      select: {
        id: true,
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

    const accountsToMark = dormantCandidates.filter((account) => {
      const lastActivity = [account.outgoingTransactions[0]?.createdAt, account.incomingTransactions[0]?.createdAt]
        .filter(Boolean)
        .sort((a, b) => (a!.getTime() > b!.getTime() ? -1 : 1))[0];
      return !lastActivity || lastActivity < ninetyDaysAgo;
    });

    for (const account of accountsToMark) {
      try {
        await prisma.bankAccount.update({ where: { id: account.id }, data: { status: "Dormant" } });
        await notificationService.accountDormant({
          receiverId: account.ownerId,
          accountId: account.id,
          accountNumber: account.accountNumber
        });
      } catch (error) {
        logger.error({ error, accountId: account.id }, "[DormancyJob] Failed to process account");
      }
    }

    logger.info({ count: accountsToMark.length }, "[DormancyJob] Dormancy check complete");
  } catch (error) {
    logger.error({ error }, "[DormancyJob] Job failed");
  }
};

export function startDormancyJob(): void {
  if (dormancyTimer) {
    return;
  }

  void runDormancyCheck();
  dormancyTimer = setInterval(() => {
    void runDormancyCheck();
  }, 24 * 60 * 60 * 1000);

  logger.info("[DormancyJob] Scheduled daily dormancy checks");
}