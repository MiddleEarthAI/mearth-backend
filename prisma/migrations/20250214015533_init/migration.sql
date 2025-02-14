/*
  Warnings:

  - The values [BATTLE] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[startTime,type]` on the table `Battle` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('TWEET', 'MOVE', 'ALLIANCE_FORM', 'ALLIANCE_BREAK', 'IGNORE', 'BATTLE_STARTED', 'BATTLE_RESOLVED', 'AGENT_DEATH');
ALTER TABLE "GameEvent" ALTER COLUMN "eventType" TYPE "EventType_new" USING ("eventType"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "Battle_startTime_type_key" ON "Battle"("startTime", "type");
