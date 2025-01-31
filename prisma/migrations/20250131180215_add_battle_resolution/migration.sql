/*
  Warnings:

  - Added the required column `resolutionTime` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Battle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('Active', 'Resolved', 'Failed');

-- CreateEnum
CREATE TYPE "BattleType" AS ENUM ('Simple', 'AgentVsAlliance', 'AllianceVsAlliance');

-- AlterTable
ALTER TABLE "Battle" ADD COLUMN     "resolutionTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "BattleStatus" NOT NULL DEFAULT 'Active',
ADD COLUMN     "type" "BattleType" NOT NULL DEFAULT 'Simple';
