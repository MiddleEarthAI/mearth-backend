/*
  Warnings:

  - You are about to drop the column `adaptability` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `aggressiveness` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `baseInfluence` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `consensusMultiplier` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `engagementMultiplier` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `followerMultiplier` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `influenceDifficulty` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `intelligence` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `manipulativeness` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `trustworthiness` on the `AgentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `authorFollowers` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `authorHandle` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `authorIsVerified` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `authorReliability` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `communityAlignment` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `communityId` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `conversationId` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `deceptionScore` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `engagement` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `impactScore` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `inReplyToId` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `influenceScore` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `intentType` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `isDeceptive` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `previousInteractions` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `quotes` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `referencedTweet` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `replies` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `retweets` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `sentiment` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `suggestedAction` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the `Community` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `traits` to the `AgentProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tweetId` to the `Interaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Interaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userMetrics` to the `Interaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Interaction" DROP CONSTRAINT "Interaction_communityId_fkey";

-- DropIndex
DROP INDEX "Interaction_authorId_idx";

-- DropIndex
DROP INDEX "Interaction_communityId_idx";

-- DropIndex
DROP INDEX "Interaction_timestamp_idx";

-- AlterTable
ALTER TABLE "AgentProfile" DROP COLUMN "adaptability",
DROP COLUMN "aggressiveness",
DROP COLUMN "baseInfluence",
DROP COLUMN "consensusMultiplier",
DROP COLUMN "engagementMultiplier",
DROP COLUMN "followerMultiplier",
DROP COLUMN "influenceDifficulty",
DROP COLUMN "intelligence",
DROP COLUMN "manipulativeness",
DROP COLUMN "trustworthiness",
ADD COLUMN     "traits" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Interaction" DROP COLUMN "authorFollowers",
DROP COLUMN "authorHandle",
DROP COLUMN "authorId",
DROP COLUMN "authorIsVerified",
DROP COLUMN "authorReliability",
DROP COLUMN "communityAlignment",
DROP COLUMN "communityId",
DROP COLUMN "confidence",
DROP COLUMN "conversationId",
DROP COLUMN "createdAt",
DROP COLUMN "deceptionScore",
DROP COLUMN "engagement",
DROP COLUMN "impactScore",
DROP COLUMN "inReplyToId",
DROP COLUMN "influenceScore",
DROP COLUMN "intentType",
DROP COLUMN "isDeceptive",
DROP COLUMN "likes",
DROP COLUMN "previousInteractions",
DROP COLUMN "processedAt",
DROP COLUMN "quotes",
DROP COLUMN "referencedTweet",
DROP COLUMN "replies",
DROP COLUMN "retweets",
DROP COLUMN "sentiment",
DROP COLUMN "suggestedAction",
ADD COLUMN     "tweetId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "userMetrics" JSONB NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- DropTable
DROP TABLE "Community";

-- CreateTable
CREATE TABLE "Tweet" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "conversationId" TEXT,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
