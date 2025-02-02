-- CreateEnum
CREATE TYPE "TerrainType" AS ENUM ('Plain', 'Mountain', 'River');

-- CreateEnum
CREATE TYPE "AllianceStatus" AS ENUM ('Active', 'Pending', 'Broken');

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('Active', 'Resolved', 'Failed');

-- CreateEnum
CREATE TYPE "BattleType" AS ENUM ('Simple', 'AgentVsAlliance', 'AllianceVsAlliance');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'USER');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "gameId" BIGINT NOT NULL,
    "authority" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "rewardsVault" TEXT NOT NULL,
    "mapDiameter" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bump" INTEGER NOT NULL,
    "dailyRewardTokens" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentProfile" (
    "id" TEXT NOT NULL,
    "onchainId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "xHandle" TEXT NOT NULL,
    "bio" TEXT[],
    "lore" TEXT[],
    "characteristics" TEXT[],
    "knowledge" TEXT[],
    "influenceDifficulty" TEXT NOT NULL DEFAULT 'medium',
    "aggressiveness" INTEGER NOT NULL,
    "trustworthiness" INTEGER NOT NULL,
    "manipulativeness" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "adaptability" INTEGER NOT NULL,
    "baseInfluence" DOUBLE PRECISION NOT NULL,
    "followerMultiplier" DOUBLE PRECISION NOT NULL,
    "engagementMultiplier" DOUBLE PRECISION NOT NULL,
    "consensusMultiplier" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "agentId" INTEGER NOT NULL,
    "publicKey" TEXT NOT NULL,
    "agentProfileId" TEXT NOT NULL,
    "health" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "terrainType" "TerrainType" NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alliance" (
    "id" TEXT NOT NULL,
    "formedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "combinedTokens" DOUBLE PRECISION NOT NULL,
    "status" "AllianceStatus" NOT NULL DEFAULT 'Active',
    "gameId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "alliedAgentId" TEXT NOT NULL,

    CONSTRAINT "Alliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT NOT NULL,
    "tokensLost" DOUBLE PRECISION,
    "tokensGained" DOUBLE PRECISION,
    "probability" DOUBLE PRECISION NOT NULL,
    "gameId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "type" "BattleType" NOT NULL DEFAULT 'Simple',
    "status" "BattleStatus" NOT NULL DEFAULT 'Active',
    "startTime" TIMESTAMP(3) NOT NULL,
    "resolutionTime" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "averageEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supporterCount" INTEGER NOT NULL DEFAULT 0,
    "lastInfluenceTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "influenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "authorFollowers" INTEGER NOT NULL,
    "authorIsVerified" BOOLEAN NOT NULL DEFAULT false,
    "engagement" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "retweets" INTEGER NOT NULL DEFAULT 0,
    "quotes" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "sentiment" TEXT NOT NULL,
    "influenceScore" DOUBLE PRECISION NOT NULL,
    "suggestedAction" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "isDeceptive" BOOLEAN NOT NULL DEFAULT false,
    "deceptionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "intentType" TEXT NOT NULL,
    "referencedTweet" TEXT,
    "conversationId" TEXT,
    "inReplyToId" TEXT,
    "communityAlignment" DOUBLE PRECISION NOT NULL,
    "impactScore" DOUBLE PRECISION NOT NULL,
    "previousInteractions" INTEGER NOT NULL DEFAULT 0,
    "authorReliability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentState" (
    "id" TEXT NOT NULL,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "lastActionType" TEXT NOT NULL,
    "lastActionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActionDetails" TEXT NOT NULL,
    "influencedByTweet" TEXT,
    "influenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "AgentState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cooldown" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,
    "targetAgentId" TEXT NOT NULL,

    CONSTRAINT "Cooldown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "publicStrategy" TEXT NOT NULL,
    "actualStrategy" TEXT NOT NULL,
    "deceptionLevel" INTEGER NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "email" TEXT,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_gameId_key" ON "Game"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_onchainId_key" ON "AgentProfile"("onchainId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_xHandle_key" ON "AgentProfile"("xHandle");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_agentId_gameId_key" ON "Agent"("agentId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_agentId_key" ON "Location"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Alliance_agentId_key" ON "Alliance"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Community_agentId_key" ON "Community"("agentId");

-- CreateIndex
CREATE INDEX "Interaction_communityId_idx" ON "Interaction"("communityId");

-- CreateIndex
CREATE INDEX "Interaction_authorId_idx" ON "Interaction"("authorId");

-- CreateIndex
CREATE INDEX "Interaction_timestamp_idx" ON "Interaction"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AgentState_agentId_key" ON "AgentState"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Cooldown_agentId_targetAgentId_type_key" ON "Cooldown"("agentId", "targetAgentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Strategy_agentId_key" ON "Strategy"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_privyUserId_key" ON "User"("privyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_agentProfileId_fkey" FOREIGN KEY ("agentProfileId") REFERENCES "AgentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_alliedAgentId_fkey" FOREIGN KEY ("alliedAgentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentState" ADD CONSTRAINT "AgentState_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cooldown" ADD CONSTRAINT "Cooldown_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
