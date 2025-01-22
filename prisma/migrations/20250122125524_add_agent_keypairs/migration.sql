-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "tokenBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "allianceWith" TEXT,
    "lastBattleTime" TIMESTAMP(3),
    "lastAllianceTime" TIMESTAMP(3),
    "twitterHandle" TEXT NOT NULL,
    "aggressiveness" INTEGER NOT NULL,
    "alliancePropensity" INTEGER NOT NULL,
    "influenceability" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT NOT NULL,
    "tokensBurned" DOUBLE PRECISION NOT NULL,
    "locationX" DOUBLE PRECISION NOT NULL,
    "locationY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alliance" (
    "id" TEXT NOT NULL,
    "agent1Id" TEXT NOT NULL,
    "agent2Id" TEXT NOT NULL,
    "formedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dissolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "fromX" DOUBLE PRECISION NOT NULL,
    "fromY" DOUBLE PRECISION NOT NULL,
    "toX" DOUBLE PRECISION NOT NULL,
    "toY" DOUBLE PRECISION NOT NULL,
    "terrain" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "speed" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentKeypair" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),

    CONSTRAINT "AgentKeypair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_twitterHandle_key" ON "Agent"("twitterHandle");

-- CreateIndex
CREATE INDEX "Agent_isAlive_idx" ON "Agent"("isAlive");

-- CreateIndex
CREATE INDEX "Agent_twitterHandle_idx" ON "Agent"("twitterHandle");

-- CreateIndex
CREATE INDEX "Battle_initiatorId_idx" ON "Battle"("initiatorId");

-- CreateIndex
CREATE INDEX "Battle_defenderId_idx" ON "Battle"("defenderId");

-- CreateIndex
CREATE INDEX "Battle_timestamp_idx" ON "Battle"("timestamp");

-- CreateIndex
CREATE INDEX "Alliance_agent1Id_idx" ON "Alliance"("agent1Id");

-- CreateIndex
CREATE INDEX "Alliance_agent2Id_idx" ON "Alliance"("agent2Id");

-- CreateIndex
CREATE INDEX "Alliance_formedAt_idx" ON "Alliance"("formedAt");

-- CreateIndex
CREATE INDEX "Movement_agentId_idx" ON "Movement"("agentId");

-- CreateIndex
CREATE INDEX "Movement_timestamp_idx" ON "Movement"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AgentKeypair_agentId_key" ON "AgentKeypair"("agentId");

-- CreateIndex
CREATE INDEX "AgentKeypair_agentId_idx" ON "AgentKeypair"("agentId");

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_agent1Id_fkey" FOREIGN KEY ("agent1Id") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_agent2Id_fkey" FOREIGN KEY ("agent2Id") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentKeypair" ADD CONSTRAINT "AgentKeypair_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
