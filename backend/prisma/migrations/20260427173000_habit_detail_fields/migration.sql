-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "category" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "monthlyTarget" INTEGER,
ADD COLUMN     "scheduleDays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "scheduleType" TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN     "weeklyTarget" INTEGER;

-- AlterTable
ALTER TABLE "HabitCheckIn" ADD COLUMN     "note" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'done';

-- CreateIndex
CREATE INDEX "Habit_userId_archivedAt_idx" ON "Habit"("userId", "archivedAt");
