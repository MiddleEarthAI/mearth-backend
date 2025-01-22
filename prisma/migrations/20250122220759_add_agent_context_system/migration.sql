/*
  Warnings:

  - Added the required column `iv` to the `AgentKeypair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tag` to the `AgentKeypair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AgentKeypair` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AgentKeypair" ADD COLUMN     "iv" BYTEA NOT NULL,
ADD COLUMN     "tag" BYTEA NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "AgentPersonality" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "openness" INTEGER NOT NULL,
    "conscientiousness" INTEGER NOT NULL,
    "extraversion" INTEGER NOT NULL,
    "agreeableness" INTEGER NOT NULL,
    "neuroticism" INTEGER NOT NULL,
    "riskTolerance" INTEGER NOT NULL,
    "deceptionLevel" INTEGER NOT NULL,
    "loyaltyLevel" INTEGER NOT NULL,
    "adaptability" INTEGER NOT NULL,
    "preferredTerrain" TEXT[],
    "avoidedAgents" TEXT[],
    "allyPreferences" TEXT[],
    "currentMood" TEXT NOT NULL,
    "stressLevel" INTEGER NOT NULL,
    "confidenceLevel" INTEGER NOT NULL,
    "pastInteractions" JSONB NOT NULL,
    "learningRate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPersonality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentContext" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "backstory" TEXT NOT NULL,
    "goals" TEXT[],
    "values" TEXT[],
    "fears" TEXT[],
    "decisionHistory" JSONB NOT NULL,
    "relationshipMap" JSONB NOT NULL,
    "battleStrategy" JSONB NOT NULL,
    "movementPatterns" JSONB NOT NULL,
    "communityFeedback" JSONB NOT NULL,
    "influenceWeight" INTEGER NOT NULL,
    "currentStrategy" TEXT NOT NULL,
    "missionCritical" BOOLEAN NOT NULL,
    "lastContextUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMemory" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "recentEvents" JSONB NOT NULL,
    "activeThreats" JSONB NOT NULL,
    "opportunities" JSONB NOT NULL,
    "battleHistory" JSONB NOT NULL,
    "allianceHistory" JSONB NOT NULL,
    "betrayals" JSONB NOT NULL,
    "victories" JSONB NOT NULL,
    "learnedStrategies" JSONB NOT NULL,
    "failedApproaches" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentPersonality_agentId_key" ON "AgentPersonality"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentContext_agentId_key" ON "AgentContext"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMemory_agentId_key" ON "AgentMemory"("agentId");

-- AddForeignKey
ALTER TABLE "AgentPersonality" ADD CONSTRAINT "AgentPersonality_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentContext" ADD CONSTRAINT "AgentContext_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMemory" ADD CONSTRAINT "AgentMemory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
