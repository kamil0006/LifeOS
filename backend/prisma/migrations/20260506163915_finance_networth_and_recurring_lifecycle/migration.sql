-- AlterTable
ALTER TABLE "ScheduledExpense" ADD COLUMN     "pausedUntil" DATE,
ADD COLUMN     "reminderDaysBefore" INTEGER;

-- CreateTable
CREATE TABLE "NetWorthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetWorthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetWorthAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NetWorthAccount_userId_idx" ON "NetWorthAccount"("userId");

-- CreateIndex
CREATE INDEX "NetWorthAccount_userId_kind_idx" ON "NetWorthAccount"("userId", "kind");

-- CreateIndex
CREATE INDEX "NetWorthAdjustment_userId_idx" ON "NetWorthAdjustment"("userId");

-- CreateIndex
CREATE INDEX "NetWorthAdjustment_accountId_createdAt_idx" ON "NetWorthAdjustment"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "NetWorthAccount" ADD CONSTRAINT "NetWorthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthAdjustment" ADD CONSTRAINT "NetWorthAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthAdjustment" ADD CONSTRAINT "NetWorthAdjustment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "NetWorthAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
