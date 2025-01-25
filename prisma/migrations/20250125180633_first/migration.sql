-- CreateEnum
CREATE TYPE "CharacterType" AS ENUM ('SCOOTLES', 'PURRLOCK_PAWS', 'SIR_GULLIHOP', 'WANDERLEAF');

-- CreateEnum
CREATE TYPE "TerrainType" AS ENUM ('PLAINS', 'MOUNTAINS', 'RIVER');

-- CreateEnum
CREATE TYPE "BattleOutcome" AS ENUM ('ATTACKER_WIN', 'DEFENDER_WIN', 'DRAW');

-- CreateEnum
CREATE TYPE "AllianceStatus" AS ENUM ('ACTIVE', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'DEFEATED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TOKEN_TRANSFER', 'BATTLE_BURN', 'STAKING_REWARD');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "twitterHandle" TEXT NOT NULL,
    "lastActionTime" TIMESTAMP(3),
    "characterType" "CharacterType" NOT NULL,
    "bio" TEXT[],
    "lore" TEXT[],
    "knowledge" TEXT[],
    "walletId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keypair" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "iv" BYTEA NOT NULL,
    "tag" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keypair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "governanceTokens" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "terrain" "TerrainType" NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "speed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "outcome" "BattleOutcome" NOT NULL,
    "tokensBurned" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "winningProbability" DOUBLE PRECISION NOT NULL,
    "agentId" TEXT,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alliance" (
    "id" TEXT NOT NULL,
    "formedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dissolutionTime" TIMESTAMP(3),
    "status" "AllianceStatus" NOT NULL,

    CONSTRAINT "Alliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tweet" (
    "id" TEXT NOT NULL,
    "tweetId" BIGINT NOT NULL,
    "agentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorFollowerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TweetEngagement" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "retweets" INTEGER NOT NULL DEFAULT 0,
    "influencerImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TweetEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TweetFeedback" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "targetAgent" TEXT NOT NULL,
    "coordinateX" DOUBLE PRECISION NOT NULL,
    "coordinateY" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,

    CONSTRAINT "TweetFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakingReward" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StakingReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTrait" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "traitName" TEXT NOT NULL,
    "traitValue" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AgentToAlliance" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AgentToAlliance_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_name_key" ON "Agent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_twitterHandle_key" ON "Agent"("twitterHandle");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_walletId_key" ON "Agent"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "Keypair_agentId_key" ON "Keypair"("agentId");

-- CreateIndex
CREATE INDEX "Keypair_agentId_idx" ON "Keypair"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "TweetEngagement_tweetId_key" ON "TweetEngagement"("tweetId");

-- CreateIndex
CREATE UNIQUE INDEX "TweetFeedback_tweetId_key" ON "TweetFeedback"("tweetId");

-- CreateIndex
CREATE INDEX "_AgentToAlliance_B_index" ON "_AgentToAlliance"("B");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keypair" ADD CONSTRAINT "Keypair_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TweetEngagement" ADD CONSTRAINT "TweetEngagement_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TweetFeedback" ADD CONSTRAINT "TweetFeedback_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakingReward" ADD CONSTRAINT "StakingReward_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTrait" ADD CONSTRAINT "AgentTrait_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgentToAlliance" ADD CONSTRAINT "_AgentToAlliance_A_fkey" FOREIGN KEY ("A") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgentToAlliance" ADD CONSTRAINT "_AgentToAlliance_B_fkey" FOREIGN KEY ("B") REFERENCES "Alliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
