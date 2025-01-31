/*
  Warnings:

  - You are about to drop the column `backstory` on the `Agent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "backstory",
ADD COLUMN     "bio" TEXT[],
ADD COLUMN     "knowledge" TEXT[],
ADD COLUMN     "lore" TEXT[];
