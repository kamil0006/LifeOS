-- AlterTable
ALTER TABLE "ScheduledExpense" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PLN',
ADD COLUMN     "originalAmount" DOUBLE PRECISION;
