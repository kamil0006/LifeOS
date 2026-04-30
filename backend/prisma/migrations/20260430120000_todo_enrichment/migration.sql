-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "dueDate" DATE,
ADD COLUMN "dueTime" TEXT,
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'inne',
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "noteId" TEXT;

CREATE INDEX "Todo_userId_done_idx" ON "Todo"("userId", "done");
