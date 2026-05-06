-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "linkedTodoId" TEXT;

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "linkedEventId" TEXT;
