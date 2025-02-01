/*
  Warnings:

  - You are about to drop the column `agentId` on the `AgentProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AgentProfile_agentId_key";

-- AlterTable
ALTER TABLE "AgentProfile" DROP COLUMN "agentId";
