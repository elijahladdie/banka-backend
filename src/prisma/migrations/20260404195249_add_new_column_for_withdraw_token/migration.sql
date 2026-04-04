-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_INACTIVE_WARNING';
ALTER TYPE "NotificationType" ADD VALUE 'WITHDRAWAL_CODE_SENT';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "confirmationToken" TEXT;
