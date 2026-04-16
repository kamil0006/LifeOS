-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "targetPerDay" DOUBLE PRECISION,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "HabitCheckIn" ADD COLUMN     "value" DOUBLE PRECISION;
