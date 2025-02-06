-- CreateEnum
CREATE TYPE "AllianceStatus" AS ENUM ('Active', 'Pending', 'Broken');

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('Active', 'Resolved', 'Cancelled');

-- CreateEnum
CREATE TYPE "BattleType" AS ENUM ('Simple', 'AgentVsAlliance', 'AllianceVsAlliance');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('Comment', 'Quote', 'Mention');

-- CreateEnum
CREATE TYPE "TerrainType" AS ENUM ('plain', 'mountain', 'river');

-- CreateEnum
CREATE TYPE "CooldownType" AS ENUM ('Alliance', 'Battle', 'Ignore', 'Tweet', 'Move');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'USER');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "onchainId" BIGINT NOT NULL,
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
    "followers" INTEGER NOT NULL DEFAULT 100,
    "bio" TEXT[],
    "lore" TEXT[],
    "characteristics" TEXT[],
    "knowledge" TEXT[],
    "traits" JSONB NOT NULL,
    "postExamples" TEXT[],

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "onchainId" INTEGER NOT NULL,
    "authority" TEXT NOT NULL,
    "health" INTEGER NOT NULL DEFAULT 100,
    "gameId" TEXT NOT NULL,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "profileId" TEXT NOT NULL,
    "deathTimestamp" TIMESTAMP(3),
    "mapTileId" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapTile" (
    "id" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "terrainType" "TerrainType" NOT NULL,
    "agentId" TEXT,

    CONSTRAINT "MapTile_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Alliance" (
    "id" TEXT NOT NULL,
    "combinedTokens" DOUBLE PRECISION,
    "status" "AllianceStatus" NOT NULL DEFAULT 'Active',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "joinerId" TEXT NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Alliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "type" "BattleType" NOT NULL,
    "status" "BattleStatus" NOT NULL DEFAULT 'Active',
    "tokensStaked" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "gameId" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "attackerAllyId" TEXT,
    "defenderAllyId" TEXT,
    "winnerId" TEXT,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "userMetrics" JSONB NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoolDown" (
    "id" TEXT NOT NULL,
    "type" "CooldownType" NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "cooledAgentId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "CoolDown_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "Game_onchainId_key" ON "Game"("onchainId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_onchainId_key" ON "AgentProfile"("onchainId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_xHandle_key" ON "AgentProfile"("xHandle");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_mapTileId_key" ON "Agent"("mapTileId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_onchainId_gameId_key" ON "Agent"("onchainId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "MapTile_x_y_key" ON "MapTile"("x", "y");

-- CreateIndex
CREATE UNIQUE INDEX "Alliance_initiatorId_joinerId_key" ON "Alliance"("initiatorId", "joinerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_privyUserId_key" ON "User"("privyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_mapTileId_fkey" FOREIGN KEY ("mapTileId") REFERENCES "MapTile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_joinerId_fkey" FOREIGN KEY ("joinerId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_attackerAllyId_fkey" FOREIGN KEY ("attackerAllyId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_defenderAllyId_fkey" FOREIGN KEY ("defenderAllyId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoolDown" ADD CONSTRAINT "CoolDown_cooledAgentId_fkey" FOREIGN KEY ("cooledAgentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoolDown" ADD CONSTRAINT "CoolDown_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
