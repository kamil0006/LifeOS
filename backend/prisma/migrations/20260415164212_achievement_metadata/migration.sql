-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "rarity" TEXT,
ADD COLUMN     "title" TEXT;
