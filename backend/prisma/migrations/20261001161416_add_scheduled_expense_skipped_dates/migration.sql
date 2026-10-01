-- AlterTable
ALTER TABLE "ScheduledExpense" ADD COLUMN     "skippedDates" TEXT[] DEFAULT ARRAY[]::TEXT[];
