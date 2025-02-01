/*
  Warnings:

  - A unique constraint covering the columns `[onchainId]` on the table `AgentProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `onchainId` to the `AgentProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AgentProfile" ADD COLUMN     "onchainId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_onchainId_key" ON "AgentProfile"("onchainId");
