/*
  Warnings:

  - You are about to drop the column `health` on the `AgentState` table. All the data in the column will be lost.
  - You are about to drop the column `canBreakAlliance` on the `Alliance` table. All the data in the column will be lost.
  - You are about to drop the column `stuckTurnsRemaining` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the `TokenEconomics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnstakingRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TokenEconomics" DROP CONSTRAINT "TokenEconomics_agentId_fkey";

-- DropForeignKey
ALTER TABLE "UnstakingRequest" DROP CONSTRAINT "UnstakingRequest_tokenEconomicsId_fkey";

-- AlterTable
ALTER TABLE "AgentState" DROP COLUMN "health";

-- AlterTable
ALTER TABLE "Alliance" DROP COLUMN "canBreakAlliance";

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "stuckTurnsRemaining";

-- DropTable
DROP TABLE "TokenEconomics";

-- DropTable
DROP TABLE "UnstakingRequest";
