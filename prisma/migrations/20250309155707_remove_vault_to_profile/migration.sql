/*
  Warnings:

  - You are about to drop the column `vault` on the `AgentProfile` table. All the data in the column will be lost.
  - Added the required column `authorityAssociatedTokenAddress` to the `Agent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "authorityAssociatedTokenAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AgentProfile" DROP COLUMN "vault";
