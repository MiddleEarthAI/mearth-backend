/*
  Warnings:

  - You are about to alter the column `combinedTokens` on the `Alliance` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "Alliance" ALTER COLUMN "combinedTokens" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Battle" ALTER COLUMN "tokensStaked" SET DATA TYPE BIGINT;
