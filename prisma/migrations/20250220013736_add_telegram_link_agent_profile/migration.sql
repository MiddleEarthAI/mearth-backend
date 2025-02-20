/*
  Warnings:

  - Added the required column `description` to the `AgentProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loreFulltext` to the `AgentProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AgentProfile" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "loreFulltext" TEXT NOT NULL;
