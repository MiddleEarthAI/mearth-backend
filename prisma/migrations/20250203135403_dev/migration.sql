/*
  Warnings:

  - The values [Failed] on the enum `BattleStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `agentId` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `agentProfileId` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `publicKey` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `agentId` on the `Alliance` table. All the data in the column will be lost.
  - You are about to drop the column `alliedAgentId` on the `Alliance` table. All the data in the column will be lost.
  - You are about to drop the column `formedAt` on the `Alliance` table. All the data in the column will be lost.
  - You are about to drop the column `agentId` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `opponentId` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `probability` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `resolutionTime` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `tokensGained` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `gameId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the `AgentState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cooldown` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Strategy` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[onchainId]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[initiatorId,joinerId]` on the table `Alliance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[onchainId]` on the table `Game` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `onchainId` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `traits` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initiatorId` to the `Alliance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `joinerId` to the `Alliance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attackerId` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defenderId` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokensStaked` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `onchainId` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Interaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `content` on table `Interaction` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('Comment', 'Quote', 'Mention');

-- AlterEnum
BEGIN;
CREATE TYPE "BattleStatus_new" AS ENUM ('Active', 'Resolved', 'Error');
ALTER TABLE "Battle" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Battle" ALTER COLUMN "status" TYPE "BattleStatus_new" USING ("status"::text::"BattleStatus_new");
ALTER TYPE "BattleStatus" RENAME TO "BattleStatus_old";
ALTER TYPE "BattleStatus_new" RENAME TO "BattleStatus";
DROP TYPE "BattleStatus_old";
ALTER TABLE "Battle" ALTER COLUMN "status" SET DEFAULT 'Active';
COMMIT;

-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_agentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "AgentState" DROP CONSTRAINT "AgentState_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Alliance" DROP CONSTRAINT "Alliance_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Alliance" DROP CONSTRAINT "Alliance_alliedAgentId_fkey";

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_opponentId_fkey";

-- DropForeignKey
ALTER TABLE "Cooldown" DROP CONSTRAINT "Cooldown_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Cooldown" DROP CONSTRAINT "Cooldown_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Strategy" DROP CONSTRAINT "Strategy_agentId_fkey";

-- DropIndex
DROP INDEX "Agent_agentId_gameId_key";

-- DropIndex
DROP INDEX "Alliance_agentId_key";

-- DropIndex
DROP INDEX "Game_gameId_key";

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "agentId",
DROP COLUMN "agentProfileId",
DROP COLUMN "createdAt",
DROP COLUMN "publicKey",
DROP COLUMN "updatedAt",
ADD COLUMN     "onchainId" INTEGER NOT NULL,
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "traits" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "AgentProfile" ADD COLUMN     "followers" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "Alliance" DROP COLUMN "agentId",
DROP COLUMN "alliedAgentId",
DROP COLUMN "formedAt",
ADD COLUMN     "initiatorId" TEXT NOT NULL,
ADD COLUMN     "joinerId" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "combinedTokens" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Battle" DROP COLUMN "agentId",
DROP COLUMN "opponentId",
DROP COLUMN "probability",
DROP COLUMN "resolutionTime",
DROP COLUMN "tokensGained",
ADD COLUMN     "attackerAllyId" TEXT,
ADD COLUMN     "attackerId" TEXT NOT NULL,
ADD COLUMN     "defenderAllyId" TEXT,
ADD COLUMN     "defenderId" TEXT NOT NULL,
ADD COLUMN     "tokensStaked" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "outcome" DROP NOT NULL,
ALTER COLUMN "startTime" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "gameId",
ADD COLUMN     "onchainId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Interaction" DROP COLUMN "type",
ADD COLUMN     "type" "InteractionType" NOT NULL,
ALTER COLUMN "content" SET NOT NULL;

-- DropTable
DROP TABLE "AgentState";

-- DropTable
DROP TABLE "Cooldown";

-- DropTable
DROP TABLE "Location";

-- DropTable
DROP TABLE "Strategy";

-- CreateTable
CREATE TABLE "MapTile" (
    "id" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "terrainType" "TerrainType" NOT NULL,
    "occupiedBy" TEXT,

    CONSTRAINT "MapTile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoolDown" (
    "id" TEXT NOT NULL,
    "type" "CooldownType" NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "cooledAgentId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "CoolDown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_onchainId_key" ON "Agent"("onchainId");

-- CreateIndex
CREATE UNIQUE INDEX "Alliance_initiatorId_joinerId_key" ON "Alliance"("initiatorId", "joinerId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_onchainId_key" ON "Game"("onchainId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_joinerId_fkey" FOREIGN KEY ("joinerId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_attackerAllyId_fkey" FOREIGN KEY ("attackerAllyId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_defenderAllyId_fkey" FOREIGN KEY ("defenderAllyId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapTile" ADD CONSTRAINT "MapTile_occupiedBy_fkey" FOREIGN KEY ("occupiedBy") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoolDown" ADD CONSTRAINT "CoolDown_cooledAgentId_fkey" FOREIGN KEY ("cooledAgentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoolDown" ADD CONSTRAINT "CoolDown_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
