/*
  Warnings:

  - Added the required column `authorHandle` to the `Interaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `Interaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `communityAlignment` to the `Interaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `impactScore` to the `Interaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intentType` to the `Interaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN     "authorHandle" TEXT NOT NULL,
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "authorIsVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "authorReliability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "communityAlignment" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deceptionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "impactScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "inReplyToId" TEXT,
ADD COLUMN     "intentType" TEXT NOT NULL,
ADD COLUMN     "isDeceptive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "previousInteractions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "quotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referencedTweet" TEXT,
ADD COLUMN     "replies" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "retweets" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "timestamp" DROP DEFAULT,
ALTER COLUMN "confidence" DROP DEFAULT,
ALTER COLUMN "influenceScore" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Interaction_communityId_idx" ON "Interaction"("communityId");

-- CreateIndex
CREATE INDEX "Interaction_authorId_idx" ON "Interaction"("authorId");

-- CreateIndex
CREATE INDEX "Interaction_timestamp_idx" ON "Interaction"("timestamp");
