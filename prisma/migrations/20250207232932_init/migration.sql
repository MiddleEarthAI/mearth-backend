/*
  Warnings:

  - You are about to alter the column `onchainId` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "onchainId" SET DATA TYPE INTEGER;
