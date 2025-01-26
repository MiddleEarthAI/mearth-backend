/*
  Warnings:

  - You are about to drop the column `outcome` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `winningProbability` on the `Battle` table. All the data in the column will be lost.
  - Added the required column `attackerTokensBefore` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attackerWon` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deathOccurred` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defenderTokensBefore` to the `Battle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Battle" DROP COLUMN "outcome",
DROP COLUMN "winningProbability",
ADD COLUMN     "attackerTokensBefore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "attackerWon" BOOLEAN NOT NULL,
ADD COLUMN     "deathOccurred" BOOLEAN NOT NULL,
ADD COLUMN     "defenderTokensBefore" DOUBLE PRECISION NOT NULL;
