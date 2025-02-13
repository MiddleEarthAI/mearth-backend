-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'TWEET';

-- AlterTable
ALTER TABLE "CoolDown" ADD COLUMN     "startsAt" TIMESTAMP(3);
