/*
  Warnings:

  - You are about to drop the column `authorityAssociatedTokenAddress` on the `Agent` table. All the data in the column will be lost.
  - Added the required column `vault` to the `AgentProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "authorityAssociatedTokenAddress";

-- AlterTable
ALTER TABLE "AgentProfile" ADD COLUMN     "vault" TEXT NOT NULL;
