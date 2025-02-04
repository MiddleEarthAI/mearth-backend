/*
  Warnings:

  - A unique constraint covering the columns `[onchainId,gameId]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Agent_onchainId_gameId_key" ON "Agent"("onchainId", "gameId");
