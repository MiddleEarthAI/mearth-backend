-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('Plain', 'Mountain', 'River');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
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
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "agentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "xHandle" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "backstory" TEXT NOT NULL,
    "characteristics" TEXT[],
    "influenceDifficulty" TEXT NOT NULL DEFAULT 'medium',
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
    "fieldType" "FieldType" NOT NULL,
    "stuckTurnsRemaining" INTEGER NOT NULL DEFAULT 0,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alliance" (
    "id" TEXT NOT NULL,
    "formedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canBreakAlliance" BOOLEAN NOT NULL DEFAULT true,
    "combinedTokens" DOUBLE PRECISION NOT NULL,
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

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "averageEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supporterCount" INTEGER NOT NULL DEFAULT 0,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorFollowers" INTEGER NOT NULL,
    "engagement" INTEGER NOT NULL,
    "sentiment" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "communityId" TEXT NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personality" (
    "id" TEXT NOT NULL,
    "aggressiveness" INTEGER NOT NULL,
    "trustworthiness" INTEGER NOT NULL,
    "manipulativeness" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "adaptability" INTEGER NOT NULL,
    "baseInfluence" DOUBLE PRECISION NOT NULL,
    "followerMultiplier" DOUBLE PRECISION NOT NULL,
    "engagementMultiplier" DOUBLE PRECISION NOT NULL,
    "consensusMultiplier" DOUBLE PRECISION NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Personality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentState" (
    "id" TEXT NOT NULL,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "health" INTEGER NOT NULL DEFAULT 100,
    "lastActionType" TEXT NOT NULL,
    "lastActionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActionDetails" TEXT NOT NULL,
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
CREATE TABLE "TokenEconomics" (
    "id" TEXT NOT NULL,
    "stakedTokens" DOUBLE PRECISION NOT NULL,
    "totalStaked" DOUBLE PRECISION NOT NULL,
    "stakersCount" INTEGER NOT NULL,
    "totalWon" INTEGER NOT NULL DEFAULT 0,
    "totalLost" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "TokenEconomics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnstakingRequest" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unlockTime" TIMESTAMP(3) NOT NULL,
    "tokenEconomicsId" TEXT NOT NULL,

    CONSTRAINT "UnstakingRequest_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "Game_gameId_key" ON "Game"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_agentId_key" ON "Agent"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_xHandle_key" ON "Agent"("xHandle");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_publicKey_key" ON "Agent"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "Location_agentId_key" ON "Location"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Alliance_agentId_key" ON "Alliance"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Community_agentId_key" ON "Community"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Personality_agentId_key" ON "Personality"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentState_agentId_key" ON "AgentState"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Cooldown_agentId_targetAgentId_type_key" ON "Cooldown"("agentId", "targetAgentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TokenEconomics_agentId_key" ON "TokenEconomics"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Strategy_agentId_key" ON "Strategy"("agentId");

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
ALTER TABLE "Personality" ADD CONSTRAINT "Personality_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentState" ADD CONSTRAINT "AgentState_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cooldown" ADD CONSTRAINT "Cooldown_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenEconomics" ADD CONSTRAINT "TokenEconomics_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnstakingRequest" ADD CONSTRAINT "UnstakingRequest_tokenEconomicsId_fkey" FOREIGN KEY ("tokenEconomicsId") REFERENCES "TokenEconomics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
