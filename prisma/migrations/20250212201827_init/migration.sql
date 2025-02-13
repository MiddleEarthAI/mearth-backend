/*
  Warnings:

  - Changed the type of `type` on the `GameLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `level` on the `GameLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MOVE', 'ALLIANCE_FORM', 'ALLIANCE_BREAK', 'IGNORE', 'BATTLE');

-- DropIndex
DROP INDEX "GameLog_agentId_idx";

-- DropIndex
DROP INDEX "GameLog_gameId_idx";

-- DropIndex
DROP INDEX "GameLog_level_idx";

-- DropIndex
DROP INDEX "GameLog_timestamp_idx";

-- DropIndex
DROP INDEX "GameLog_type_idx";

-- AlterTable
ALTER TABLE "GameLog" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "level",
ADD COLUMN     "level" TEXT NOT NULL;

-- DropEnum
DROP TYPE "LogLevel";

-- DropEnum
DROP TYPE "LogType";

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "EventType" NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "targetId" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
